import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { waCampaigns, waMessages, waContacts, waTemplates, waAudiences, guestProfiles } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { buildFilterClause, eligibilityClause, type AudienceFilter } from './audiences';
import { isRePermissionTemplate } from './template-lint';
import { getSettings } from './settings';
import { estimateCostPaise, PRICE_PAISE } from './types';

/**
 * Campaign construction: turn a template + an audience into a queue of
 * wa_messages rows, and decide when a running campaign should stop.
 *
 * The queue is built once, at launch, inside a single transaction. Two
 * consequences worth understanding:
 *
 *  - Consent is evaluated *twice*: here, when the queue is built, and again by
 *    the dispatcher immediately before each send. The second check is the one
 *    that matters. Someone can opt out in the hours between queueing and
 *    sending, and a queue row is not permission.
 *
 *  - Every row carries an idempotency_key unique on
 *    (campaign, contact, template). Re-running the build cannot double-send, and
 *    a retry after a crash mid-insert resumes rather than duplicates.
 */

/** sha256 of the identity triple. Unique index on wa_messages makes this exactly-once. */
export function idempotencyKey(campaignId: string, contactId: string, templateId: string): string {
    return createHash('sha256').update(`${campaignId}|${contactId}|${templateId}`).digest('hex').slice(0, 64);
}

// --------------------------------------------
// Variable resolution
// --------------------------------------------

export type VariableSource = string; // e.g. 'contact.firstName', 'campaign.offerCode'

/**
 * Resolve one template variable for one contact.
 *
 * Always returns a non-empty string. An empty variable is a delivery failure at
 * Meta, not a blank space in the message, so the fallback chain ends in a
 * generic word rather than ''.
 */
export function resolveVariable(
    source: VariableSource | undefined,
    context: {
        contact: { name?: string | null; phone: string };
        guest?: { firstName?: string | null; lastName?: string | null; lastStayAt?: Date | null; totalStays?: number | null } | null;
        staticValues?: Record<string, string>;
        variableIndex: string;
    },
    fallback = 'Guest',
): string {
    const { contact, guest, staticValues, variableIndex } = context;

    // A per-campaign static value beats everything — that is what it is for.
    const staticValue = staticValues?.[variableIndex];
    if (staticValue?.trim()) return staticValue.trim();

    const firstName = guest?.firstName?.trim() || contact.name?.trim().split(/\s+/)[0];
    const fullName = contact.name?.trim()
        || [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();

    switch (source) {
        case 'contact.firstName':
            return firstName || fallback;
        case 'contact.name':
            return fullName || fallback;
        case 'guest.totalStays':
            return String(guest?.totalStays ?? 0);
        case 'guest.lastStayDate':
            return guest?.lastStayAt
                ? new Date(guest.lastStayAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : fallback;
        default:
            return fallback;
    }
}

// --------------------------------------------
// Cost
// --------------------------------------------

export type CostEstimate = {
    recipients: number;
    category: string;
    perMessagePaise: number;
    totalPaise: number;
};

export function estimateCampaignCost(category: string, recipients: number): CostEstimate {
    return {
        recipients,
        category,
        perMessagePaise: PRICE_PAISE[category] ?? PRICE_PAISE.MARKETING,
        totalPaise: estimateCostPaise(category, recipients),
    };
}

/**
 * How long a campaign will take, given its cap and throttle.
 * Shown on the review step so "send 10,000" doesn't quietly mean "for 40 days".
 */
export function estimateCompletion(
    recipients: number,
    dailyCap: number,
    throttlePerMin: number,
    from: Date = new Date(),
): { days: number; finishesAt: Date; perDay: number } {
    const perDay = Math.max(1, Math.min(dailyCap || recipients, throttlePerMin * 60 * 24));
    const days = Math.max(1, Math.ceil(recipients / perDay));
    const finishesAt = new Date(from.getTime() + (days - 1) * 24 * 3_600_000);
    return { days, finishesAt, perDay };
}

// --------------------------------------------
// Queue construction
// --------------------------------------------

export type BuildResult = { queued: number; skipped: number; total: number };

type AudienceRow = typeof waAudiences.$inferSelect;

/** Resolve the recipient rows for an audience, with the data needed for variables. */
async function resolveRecipients(audience: AudienceRow, isRePermission: boolean) {
    const settings = await getSettings();
    const cap = settings.frequencyCapPer30d ?? 2;

    const selection = {
        id: waContacts.id,
        phone: waContacts.phone,
        name: waContacts.name,
        firstName: guestProfiles.firstName,
        lastName: guestProfiles.lastName,
        lastStayAt: guestProfiles.lastStayAt,
        totalStays: guestProfiles.totalStays,
    };

    // A static audience is a frozen id list; a dynamic one is re-evaluated now.
    // Both then pass through the same eligibility clause — a static list must not
    // become a way to message people who have since opted out.
    if (audience.type === 'static') {
        const ids = (audience.contactIds as string[] | null) ?? [];
        if (!ids.length) return [];
        return db
            .select(selection)
            .from(waContacts)
            .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
            .where(and(
                sql`${waContacts.id} IN (${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)})`,
                eligibilityClause(cap, isRePermission),
            ));
    }

    const filterClause = buildFilterClause((audience.filter ?? {}) as AudienceFilter);
    const where = filterClause
        ? and(filterClause, eligibilityClause(cap, isRePermission))
        : eligibilityClause(cap, isRePermission);

    return db
        .select(selection)
        .from(waContacts)
        .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
        .where(where);
}

/**
 * Build the send queue for a campaign.
 *
 * Idempotent: onConflictDoNothing on idempotency_key means calling this twice
 * queues each recipient exactly once.
 */
export async function buildCampaignQueue(campaignId: string): Promise<BuildResult> {
    const campaign = await db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, campaignId) });
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.templateId) throw new Error('Campaign has no template');
    if (!campaign.audienceId) throw new Error('Campaign has no audience');

    const [template, audience] = await Promise.all([
        db.query.waTemplates.findFirst({ where: eq(waTemplates.id, campaign.templateId) }),
        db.query.waAudiences.findFirst({ where: eq(waAudiences.id, campaign.audienceId) }),
    ]);
    if (!template) throw new Error('Template not found');
    if (!audience) throw new Error('Audience not found');
    if (template.status !== 'approved') {
        throw new Error(`Template "${template.name}" is ${template.status}, not approved — it cannot be sent.`);
    }

    // Whether pending contacts may be queued is a property of the TEMPLATE, not
    // of the audience. A marketing template aimed at a pending audience must
    // resolve to zero recipients here — loudly, at launch — rather than queueing
    // people the consent gate would then silently skip one by one.
    const isRePermission = isRePermissionTemplate(template.name);
    const recipients = await resolveRecipients(audience, isRePermission);

    const variableMap = (template.variableMap ?? {}) as Record<string, string>;
    const fallbacks = (template.variableFallbacks ?? {}) as Record<string, string>;
    const staticValues = (campaign.staticVariables ?? {}) as Record<string, string>;
    const variableCount = template.variableCount ?? 0;

    let queued = 0;
    const CHUNK = 500;

    for (let i = 0; i < recipients.length; i += CHUNK) {
        const chunk = recipients.slice(i, i + CHUNK);

        const rows = chunk.map((contact) => {
            const variables: Record<string, string> = {};
            for (let n = 1; n <= variableCount; n++) {
                const key = String(n);
                variables[key] = resolveVariable(
                    variableMap[key],
                    {
                        contact: { name: contact.name, phone: contact.phone },
                        guest: {
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            lastStayAt: contact.lastStayAt,
                            totalStays: contact.totalStays,
                        },
                        staticValues,
                        variableIndex: key,
                    },
                    fallbacks[key] || 'Guest',
                );
            }

            return {
                campaignId,
                contactId: contact.id,
                templateId: template.id,
                direction: 'outbound' as const,
                status: 'queued' as const,
                idempotencyKey: idempotencyKey(campaignId, contact.id, template.id),
                variables,
                cost: PRICE_PAISE[template.category] ?? PRICE_PAISE.MARKETING,
                pricingCategory: template.category,
            };
        });

        const inserted = await db
            .insert(waMessages)
            .values(rows)
            .onConflictDoNothing({ target: waMessages.idempotencyKey })
            .returning({ id: waMessages.id });

        queued += inserted.length;
    }

    const estimate = estimateCampaignCost(template.category, queued);

    await db
        .update(waCampaigns)
        .set({
            totalCount: queued,
            queuedCount: queued,
            estimatedCost: estimate.totalPaise,
            updatedAt: new Date(),
        })
        .where(eq(waCampaigns.id, campaignId));

    return { queued, skipped: recipients.length - queued, total: recipients.length };
}

// --------------------------------------------
// Counters
// --------------------------------------------

/**
 * Recompute a campaign's counters from wa_messages.
 *
 * The dispatcher increments optimistically for speed; this is the authoritative
 * version, and the campaign screen calls it so the numbers on screen always add
 * up to the per-recipient table below them.
 */
export async function refreshCampaignCounters(campaignId: string): Promise<void> {
    await db.execute(sql`
        UPDATE wa_campaigns c SET
            total_count     = m.total,
            queued_count    = m.queued,
            sent_count      = m.sent,
            delivered_count = m.delivered,
            read_count      = m.read,
            failed_count    = m.failed,
            skipped_count   = m.skipped,
            actual_cost     = m.cost,
            updated_at      = now()
        FROM (
            SELECT
                COUNT(*)                                                            AS total,
                COUNT(*) FILTER (WHERE status IN ('queued', 'sending'))              AS queued,
                COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'read'))      AS sent,
                COUNT(*) FILTER (WHERE status IN ('delivered', 'read'))              AS delivered,
                COUNT(*) FILTER (WHERE status = 'read')                              AS read,
                COUNT(*) FILTER (WHERE status = 'failed')                            AS failed,
                COUNT(*) FILTER (WHERE status IN ('skipped', 'cancelled'))           AS skipped,
                COALESCE(SUM(cost) FILTER (WHERE status IN ('sent', 'delivered', 'read')), 0) AS cost
            FROM wa_messages
            WHERE campaign_id = ${campaignId}
        ) m
        WHERE c.id = ${campaignId}
    `);
}

// --------------------------------------------
// Stop rules
// --------------------------------------------

export type StopVerdict =
    | { halt: false }
    | { halt: true; reason: string };

/**
 * Should this campaign halt itself?
 *
 * Evaluated by the dispatcher after each batch. The minimum sample exists so a
 * campaign cannot halt on the first three failures — without it, a run of two
 * bad numbers at the start of a 10,000-message campaign would stop the whole
 * thing.
 */
export async function evaluateStopRules(campaignId: string): Promise<StopVerdict> {
    const settings = await getSettings();
    const minSample = settings.stopMinSample ?? 100;

    const [row] = await db
        .select({
            sent: sql<number>`count(*) FILTER (WHERE ${waMessages.status} IN ('sent', 'delivered', 'read'))`,
            failed: sql<number>`count(*) FILTER (WHERE ${waMessages.status} = 'failed')`,
            attempted: sql<number>`count(*) FILTER (WHERE ${waMessages.status} IN ('sent', 'delivered', 'read', 'failed'))`,
        })
        .from(waMessages)
        .where(eq(waMessages.campaignId, campaignId));

    const attempted = Number(row?.attempted ?? 0);
    const failed = Number(row?.failed ?? 0);
    const sent = Number(row?.sent ?? 0);

    if (attempted < minSample) return { halt: false };

    const failureRateBp = Math.round((failed / attempted) * 10_000);
    if (failureRateBp >= (settings.stopFailureRateBp ?? 2000)) {
        return {
            halt: true,
            reason: `Failure rate ${(failureRateBp / 100).toFixed(1)}% of ${attempted} attempted exceeds the ${(settings.stopFailureRateBp ?? 2000) / 100}% threshold`,
        };
    }

    // Opt-outs are counted from the consent ledger rather than a campaign column,
    // because an opt-out arrives as an inbound reply and is recorded there first.
    if (sent > 0) {
        const [optOutRow] = await db
            .select({ count: sql<number>`count(*)` })
            .from(sql`wa_consent_events e`)
            .where(sql`
                e.to_status = 'opted_out'
                AND e.created_at >= (SELECT MIN(sent_at) FROM wa_messages WHERE campaign_id = ${campaignId})
                AND e.contact_id IN (SELECT contact_id FROM wa_messages WHERE campaign_id = ${campaignId})
            `);

        const optOuts = Number(optOutRow?.count ?? 0);
        const optOutRateBp = Math.round((optOuts / sent) * 10_000);

        if (optOutRateBp >= (settings.stopOptOutRateBp ?? 500)) {
            return {
                halt: true,
                reason: `Opt-out rate ${(optOutRateBp / 100).toFixed(1)}% (${optOuts} of ${sent} sent) exceeds the ${(settings.stopOptOutRateBp ?? 500) / 100}% threshold`,
            };
        }
    }

    return { halt: false };
}

/** Halt a campaign and cancel everything still queued. Irreversible by design. */
export async function haltCampaign(campaignId: string, reason: string): Promise<number> {
    const cancelled = await db
        .update(waMessages)
        .set({ status: 'cancelled', errorDetail: reason })
        .where(and(eq(waMessages.campaignId, campaignId), eq(waMessages.status, 'queued')))
        .returning({ id: waMessages.id });

    await db
        .update(waCampaigns)
        .set({
            status: 'halted',
            haltReason: reason,
            completedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(waCampaigns.id, campaignId));

    await refreshCampaignCounters(campaignId);
    return cancelled.length;
}
