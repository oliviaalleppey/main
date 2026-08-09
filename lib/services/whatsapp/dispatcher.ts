import { db } from '@/lib/db';
import { waMessages, waCampaigns, waContacts, waTemplates } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getProvider } from './index';
import { canSend, incrementMarketingCounters, type MessageCategory } from './consent';
import { getSettings, isWithinQuietHours, quietHoursEndAt, setEnabled } from './settings';
import { evaluateStopRules, haltCampaign, refreshCampaignCounters } from './campaigns';
import {
    renderTemplateText, isRePermissionTemplate, parseComponents, dynamicUrlButtonIndex,
} from './template-lint';
import { classifyError, WhatsAppError, type TemplateComponent } from './types';

/**
 * The queue worker.
 *
 * Runs on a cron, claims a batch, sends it, and stops. Everything about it is
 * built to fail closed — if anything is uncertain, nothing goes out.
 *
 * The four rules that matter:
 *
 *  1. **Consent is re-checked per message, immediately before sending.** The
 *     queue was built earlier, possibly hours earlier. A queue row is not
 *     permission. This is the check that actually protects guests, and it is
 *     the reason a blocked message becomes `skipped` rather than `failed` — the
 *     guest did nothing wrong and it must not count against quality metrics.
 *
 *  2. **Claiming uses `FOR UPDATE SKIP LOCKED`.** Two overlapping cron
 *     invocations must never claim the same row. Combined with the unique
 *     idempotency_key, that gives exactly-once delivery without an external
 *     queue service.
 *
 *  3. **Errors are classified, never switched on raw.** `classifyError` decides
 *     retry / skip / fail / halt. A config or policy error stops everything,
 *     because continuing to hammer a locked account makes the situation worse.
 *
 *  4. **Quiet hours defer rather than drop.** A marketing message caught in
 *     quiet hours gets `send_after` set to the morning, not a failure.
 */

export type DispatchResult = {
    claimed: number;
    sent: number;
    failed: number;
    skipped: number;
    deferred: number;
    retrying: number;
    halted: string[];
    stopped?: string;
};

type ClaimedRow = {
    id: string;
    campaignId: string | null;
    contactId: string;
    templateId: string | null;
    variables: Record<string, string> | null;
    attempts: number | null;
    cost: number | null;
    phone: string;
    consentStatus: string;
    consentAt: Date | null;
    marketingSent30d: number | null;
    optedOutAt: Date | null;
    templateName: string | null;
    templateLanguage: string | null;
    templateCategory: string | null;
    templateStatus: string | null;
    templateBody: string | null;
    clickToken: string | null;
    templateComponents: unknown[] | null;
};

/**
 * Claim a batch of due messages.
 *
 * The inner SELECT does the locking; the outer UPDATE flips them to `sending` so
 * no other invocation can see them even after the transaction ends. Ordering by
 * queued_at keeps it FIFO so an early recipient isn't starved by later ones.
 */
async function claimBatch(limit: number): Promise<ClaimedRow[]> {
    const result = await db.execute<ClaimedRow>(sql`
        WITH claimed AS (
            SELECT m.id
            FROM wa_messages m
            LEFT JOIN wa_campaigns c ON c.id = m.campaign_id
            WHERE m.status = 'queued'
              AND m.direction = 'outbound'
              AND (m.send_after IS NULL OR m.send_after <= now())
              -- Two kinds of message live in this queue. A campaign message is
              -- only due while its campaign is actually sending, so pausing a
              -- campaign stops it mid-flight. A transactional one (an automation:
              -- booking confirmation, pre-arrival) has no campaign at all, and an
              -- INNER JOIN here silently excluded every one of them — they sat
              -- queued for ever while looking perfectly healthy.
              AND (m.campaign_id IS NULL OR c.status = 'sending')
            ORDER BY m.queued_at ASC
            LIMIT ${limit}
            FOR UPDATE OF m SKIP LOCKED
        )
        UPDATE wa_messages msg
        SET status = 'sending'
        FROM claimed
        WHERE msg.id = claimed.id
        RETURNING
            msg.id                       AS "id",
            msg.campaign_id              AS "campaignId",
            msg.contact_id               AS "contactId",
            msg.template_id              AS "templateId",
            msg.variables                AS "variables",
            msg.attempts                 AS "attempts",
            msg.cost                     AS "cost",
            msg.click_token              AS "clickToken",
            (SELECT phone              FROM wa_contacts WHERE id = msg.contact_id)  AS "phone",
            (SELECT consent_status::text FROM wa_contacts WHERE id = msg.contact_id) AS "consentStatus",
            (SELECT consent_at         FROM wa_contacts WHERE id = msg.contact_id)  AS "consentAt",
            (SELECT marketing_sent_30d FROM wa_contacts WHERE id = msg.contact_id)  AS "marketingSent30d",
            (SELECT opted_out_at       FROM wa_contacts WHERE id = msg.contact_id)  AS "optedOutAt",
            (SELECT name               FROM wa_templates WHERE id = msg.template_id) AS "templateName",
            (SELECT language           FROM wa_templates WHERE id = msg.template_id) AS "templateLanguage",
            (SELECT category::text     FROM wa_templates WHERE id = msg.template_id) AS "templateCategory",
            (SELECT status::text       FROM wa_templates WHERE id = msg.template_id) AS "templateStatus",
            (SELECT body_text          FROM wa_templates WHERE id = msg.template_id) AS "templateBody",
            (SELECT components         FROM wa_templates WHERE id = msg.template_id) AS "templateComponents"
    `);

    return result.rows as ClaimedRow[];
}

/** Messages already sent today, for the daily cap. */
async function sentToday(): Promise<number> {
    const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(waMessages)
        .where(sql`${waMessages.sentAt} >= date_trunc('day', now())`);
    return Number(row?.count ?? 0);
}

/** Put a message back in the queue for later, without consuming an attempt. */
async function defer(messageId: string, until: Date, reason: string): Promise<void> {
    await db
        .update(waMessages)
        .set({ status: 'queued', sendAfter: until, errorDetail: reason })
        .where(eq(waMessages.id, messageId));
}

/** Exponential backoff, capped. Attempt 1 -> 1min, 2 -> 4min, 3 -> 9min… */
function backoffUntil(attempts: number): Date {
    const minutes = Math.min(60, Math.max(1, attempts * attempts));
    return new Date(Date.now() + minutes * 60_000);
}

/**
 * Run one dispatch tick.
 *
 * Returns a summary rather than throwing, because it is called from a cron route
 * that must always answer 200 with a report — a 500 from a cron is invisible.
 */
export async function dispatch(options: { limit?: number } = {}): Promise<DispatchResult> {
    const result: DispatchResult = {
        claimed: 0, sent: 0, failed: 0, skipped: 0, deferred: 0, retrying: 0, halted: [],
    };

    const settings = await getSettings({ fresh: true });

    // The kill switch beats everything, and is checked once per tick rather than
    // once per message — flipping it takes effect on the next tick either way.
    if (!settings.enabled) {
        result.stopped = 'Sending is switched off (kill switch)';
        return result;
    }

    const cap = settings.dailyCap ?? 1000;
    const already = await sentToday();
    if (already >= cap) {
        result.stopped = `Daily cap reached (${already}/${cap})`;
        return result;
    }

    const batchSize = Math.min(
        options.limit ?? settings.batchSize ?? 50,
        cap - already,
        // Never claim more than a minute's worth of throughput in one tick.
        settings.throttlePerMin ?? 60,
    );
    if (batchSize <= 0) {
        result.stopped = 'Throttle or cap leaves no room this tick';
        return result;
    }

    const claimed = await claimBatch(batchSize);
    result.claimed = claimed.length;
    if (!claimed.length) {
        await completeFinishedCampaigns();
        return result;
    }

    const provider = getProvider();
    const touchedCampaigns = new Set<string>();
    const now = new Date();

    for (const message of claimed) {
        if (message.campaignId) touchedCampaigns.add(message.campaignId);

        const category = (message.templateCategory ?? 'MARKETING') as MessageCategory;

        // The template can have been paused or rejected by Meta since queueing.
        if (message.templateStatus !== 'approved') {
            await db
                .update(waMessages)
                .set({
                    status: 'skipped',
                    skipReason: 'template_not_approved',
                    errorDetail: `Template is ${message.templateStatus ?? 'missing'}`,
                })
                .where(eq(waMessages.id, message.id));
            result.skipped += 1;
            continue;
        }

        // Rule 1: re-check consent immediately before sending.
        const verdict = await canSend(
            {
                phone: message.phone,
                consentStatus: message.consentStatus as 'pending' | 'opted_in' | 'opted_out' | 'suppressed',
                consentAt: message.consentAt,
                marketingSent30d: message.marketingSent30d,
                optedOutAt: message.optedOutAt,
            },
            {
                category,
                // Determined by the TEMPLATE, never by the contact's status.
                // Deriving it from the contact would mean "this person is pending,
                // so this must be the re-permission ask" — which lets any marketing
                // template through to precisely the people who never opted in.
                isRePermission: isRePermissionTemplate(message.templateName),
                settings,
                now,
                // Quiet hours are handled below as a deferral, not a drop.
                ignoreQuietHours: true,
            },
        );

        if (!verdict.allowed) {
            await db
                .update(waMessages)
                .set({ status: 'skipped', skipReason: verdict.reason, errorDetail: verdict.detail })
                .where(eq(waMessages.id, message.id));
            result.skipped += 1;
            continue;
        }

        // Rule 4: quiet hours defer marketing rather than dropping it.
        if (category === 'MARKETING' && isWithinQuietHours(settings, now)) {
            await defer(message.id, quietHoursEndAt(settings, now), 'Held until quiet hours end');
            result.deferred += 1;
            continue;
        }

        const variables = (message.variables ?? {}) as Record<string, string>;
        const orderedValues = Object.keys(variables)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => variables[key]);

        const components: TemplateComponent[] = [];
        if (orderedValues.length) {
            components.push({
                type: 'body',
                parameters: orderedValues.map((text) => ({ type: 'text', text })),
            });
        }

        // The click token rides in the template's dynamic URL button. Both
        // conditions have to hold: the message must carry a token, and the
        // template must actually have a dynamic button to put it in. Sending a
        // button parameter for a static button is not ignored — Meta rejects the
        // whole message — so this is an AND, never an assumption either way.
        const buttonIndex = message.clickToken
            ? dynamicUrlButtonIndex(parseComponents(message.templateComponents ?? []).buttons)
            : null;
        if (message.clickToken && buttonIndex !== null) {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: String(buttonIndex),
                parameters: [{ type: 'text', text: message.clickToken }],
            });
        }

        try {
            const sendResult = await provider.sendTemplate({
                to: message.phone,
                templateName: message.templateName!,
                language: message.templateLanguage ?? 'en',
                components: components.length ? components : undefined,
            });

            await db
                .update(waMessages)
                .set({
                    status: 'sent',
                    wamid: sendResult.wamid,
                    sentAt: new Date(),
                    attempts: (message.attempts ?? 0) + 1,
                    errorCode: null,
                    errorDetail: null,
                    // Stored so a campaign report can show exactly what each guest saw.
                    renderedBody: renderTemplateText(message.templateBody ?? '', variables),
                })
                .where(eq(waMessages.id, message.id));

            if (category === 'MARKETING') {
                await incrementMarketingCounters(message.contactId);
            } else {
                await db
                    .update(waContacts)
                    .set({ lastOutboundAt: new Date(), updatedAt: new Date() })
                    .where(eq(waContacts.id, message.contactId));
            }

            result.sent += 1;
        } catch (error) {
            const handled = await handleSendError(error, message);
            if (handled === 'retry') result.retrying += 1;
            else if (handled === 'skip') result.skipped += 1;
            else result.failed += 1;

            // Rule 3: a config or policy error means nothing else will work either.
            if (error instanceof WhatsAppError && error.shouldHalt) {
                const reason = `${error.errorClass === 'config' ? 'Configuration' : 'Policy'} error from Meta: ${error.message}`;

                if (error.errorClass === 'halt') {
                    // Reputation is at risk — stop the entire module, not just this campaign.
                    await setEnabled(false);
                    result.stopped = `All sending stopped. ${reason}`;
                }
                if (message.campaignId) {
                    await haltCampaign(message.campaignId, reason);
                    result.halted.push(message.campaignId);
                }
                break;
            }
        }
    }

    // Stop rules, evaluated once per campaign per tick rather than per message.
    for (const campaignId of touchedCampaigns) {
        if (result.halted.includes(campaignId)) continue;
        await refreshCampaignCounters(campaignId);

        const verdict = await evaluateStopRules(campaignId);
        if (verdict.halt) {
            await haltCampaign(campaignId, `Auto-halted: ${verdict.reason}`);
            result.halted.push(campaignId);
        }
    }

    await completeFinishedCampaigns();

    return result;
}

/** Map a send failure onto a message state. */
async function handleSendError(
    error: unknown,
    message: ClaimedRow,
): Promise<'retry' | 'skip' | 'fail'> {
    const settings = await getSettings();
    const maxAttempts = settings.maxAttempts ?? 3;
    const attempts = (message.attempts ?? 0) + 1;

    const whatsAppError = error instanceof WhatsAppError
        ? error
        : null;

    const spec = whatsAppError
        ? { class: whatsAppError.errorClass, message: whatsAppError.message }
        : classifyError(undefined, undefined);

    const errorCode = whatsAppError?.code ?? null;
    const detail = whatsAppError?.message ?? (error instanceof Error ? error.message : 'Unknown error');

    // A skip is not the guest's fault and must not count as a quality failure.
    if (spec.class === 'skip') {
        await db
            .update(waMessages)
            .set({ status: 'skipped', attempts, errorCode, errorDetail: detail, skipReason: 'provider_skip' })
            .where(eq(waMessages.id, message.id));
        return 'skip';
    }

    if (spec.class === 'retryable' && attempts < maxAttempts) {
        await db
            .update(waMessages)
            .set({ status: 'queued', attempts, errorCode, errorDetail: detail, sendAfter: backoffUntil(attempts) })
            .where(eq(waMessages.id, message.id));
        return 'retry';
    }

    await db
        .update(waMessages)
        .set({ status: 'failed', attempts, errorCode, errorDetail: detail, failedAt: new Date() })
        .where(eq(waMessages.id, message.id));

    await db
        .update(waContacts)
        .set({ failureCount: sql`COALESCE(${waContacts.failureCount}, 0) + 1` })
        .where(eq(waContacts.id, message.contactId));

    return 'fail';
}

/**
 * Mark campaigns complete once nothing is left in flight.
 *
 * A campaign is done when it has no queued or sending rows — not when the
 * dispatcher happens to find nothing, which would complete a campaign that is
 * merely deferred past quiet hours.
 */
export async function completeFinishedCampaigns(): Promise<number> {
    const result = await db.execute(sql`
        UPDATE wa_campaigns c
        SET status = 'completed', completed_at = now(), updated_at = now()
        WHERE c.status = 'sending'
          AND NOT EXISTS (
              SELECT 1 FROM wa_messages m
              WHERE m.campaign_id = c.id
                AND m.status IN ('queued', 'sending')
          )
    `);
    return result.rowCount ?? 0;
}

/** Promote scheduled campaigns whose time has come. Called by the same cron. */
export async function activateScheduledCampaigns(): Promise<number> {
    const result = await db
        .update(waCampaigns)
        .set({ status: 'sending', startedAt: sql`COALESCE(${waCampaigns.startedAt}, now())`, updatedAt: new Date() })
        .where(and(
            eq(waCampaigns.status, 'scheduled'),
            sql`${waCampaigns.scheduledAt} IS NOT NULL AND ${waCampaigns.scheduledAt} <= now()`,
        ))
        .returning({ id: waCampaigns.id });
    return result.length;
}

/** Re-check that referenced templates are still approved. Cheap safety net. */
export async function pauseCampaignsWithBadTemplates(): Promise<string[]> {
    const rows = await db
        .select({ id: waCampaigns.id, name: waCampaigns.name, templateStatus: waTemplates.status })
        .from(waCampaigns)
        .innerJoin(waTemplates, eq(waCampaigns.templateId, waTemplates.id))
        .where(and(
            eq(waCampaigns.status, 'sending'),
            sql`${waTemplates.status}::text IN ('paused', 'disabled', 'rejected')`,
        ));

    for (const row of rows) {
        await db
            .update(waCampaigns)
            .set({ status: 'paused', haltReason: `Template became ${row.templateStatus}`, updatedAt: new Date() })
            .where(eq(waCampaigns.id, row.id));
    }

    return rows.map((r) => r.id);
}
