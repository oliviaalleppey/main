import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { waAutomations, waContacts, waMessages, waTemplates } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { canSend, describeBlockReason } from './consent';
import { getSettings } from './settings';
import { normalizePhone } from './phone';
import { isRePermissionTemplate } from './template-lint';
import { estimateCostPaise } from './types';

/**
 * Transactional automations — utility templates fired by events in the hotel's
 * own systems: a booking confirmed, a payment failed, a check-out today.
 *
 * Two decisions shape this file.
 *
 * **They queue, they do not send.** `fireAutomation` writes a `wa_messages` row
 * and returns; the existing dispatcher picks it up on its next run (every five
 * minutes). That reuses the machinery that already exists and is tested — the
 * per-send consent re-check, the Meta error taxonomy, backoff, throttling and
 * auto-halt — instead of growing a second, subtly different send path beside it.
 * It also means a WhatsApp problem can never slow down or fail a booking.
 *
 * **Every fire is idempotent.** The key is derived from the automation and the
 * thing that triggered it, so a retried webhook or a re-run cron cannot send a
 * guest their booking confirmation twice. `wa_messages.idempotency_key` is
 * UNIQUE, so the guarantee is the database's, not this code's.
 */

export const AUTOMATION_KEYS = [
    'booking_confirmation',
    'payment_failed',
    'prearrival',
    'checkout_review',
    'booking_cancelled',
    'event_inquiry_ack',
    'birthday_greeting',
] as const;

export type AutomationKey = (typeof AUTOMATION_KEYS)[number];

export type FireResult =
    | { queued: true; messageId: string }
    | { queued: false; reason: string; detail: string };

/** sha256 of the identity triple, mirroring campaigns.ts. */
function automationIdempotencyKey(key: string, contactId: string, dedupe: string): string {
    return createHash('sha256').update(`auto|${key}|${contactId}|${dedupe}`).digest('hex').slice(0, 64);
}

/**
 * Find the contact for a phone number, creating it if this is the first time we
 * have seen them.
 *
 * Created as `pending`, never `opted_in`: having booked a room is a transactional
 * relationship that justifies utility messages, and is not consent to marketing.
 * Conflating the two is the single most expensive mistake available here.
 */
async function findOrCreateContact(phone: string, name?: string, guestProfileId?: string) {
    const normalized = normalizePhone(phone);
    if (!normalized.ok) return null;

    const existing = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, normalized.e164),
    });
    if (existing) return existing;

    const [created] = await db
        .insert(waContacts)
        .values({
            phone: normalized.e164,
            name: name ?? null,
            source: 'booking',
            consentStatus: 'pending',
            guestProfileId: guestProfileId ?? null,
            provenanceNote: 'Created automatically from a booking event',
        })
        .onConflictDoNothing({ target: waContacts.phone })
        .returning();

    // A concurrent insert won the race; re-read rather than fail the automation.
    return created ?? (await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, normalized.e164),
    })) ?? null;
}

export async function getAutomation(key: AutomationKey) {
    return db.query.waAutomations.findFirst({ where: eq(waAutomations.key, key) });
}

export async function listAutomations() {
    const rows = await db
        .select({
            automation: waAutomations,
            template: {
                id: waTemplates.id,
                name: waTemplates.name,
                status: waTemplates.status,
                category: waTemplates.category,
                bodyText: waTemplates.bodyText,
                variableCount: waTemplates.variableCount,
            },
        })
        .from(waAutomations)
        .leftJoin(waTemplates, eq(waAutomations.templateId, waTemplates.id))
        .orderBy(waAutomations.key);

    return rows.map((row) => ({
        ...row.automation,
        template: row.template?.id ? row.template : null,
        // Surfaced so the UI can explain an automation that is on but inert.
        ready: Boolean(row.automation.enabled && row.template?.id && row.template.status === 'approved'),
    }));
}

export async function updateAutomation(
    key: AutomationKey,
    patch: Partial<{ enabled: boolean; templateId: string | null; offsetHours: number; config: Record<string, unknown> }>,
) {
    const [updated] = await db
        .update(waAutomations)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(waAutomations.key, key))
        .returning();
    return updated;
}

/** Recent sends for one automation, for the "recent fires" log in the UI. */
export async function recentFires(key: AutomationKey, limit = 20) {
    return db
        .select({
            id: waMessages.id,
            status: waMessages.status,
            skipReason: waMessages.skipReason,
            errorDetail: waMessages.errorDetail,
            queuedAt: waMessages.queuedAt,
            sentAt: waMessages.sentAt,
            deliveredAt: waMessages.deliveredAt,
            readAt: waMessages.readAt,
            phone: waContacts.phone,
            name: waContacts.name,
        })
        .from(waMessages)
        .innerJoin(waContacts, eq(waMessages.contactId, waContacts.id))
        .where(eq(waMessages.automationKey, key))
        .orderBy(desc(waMessages.queuedAt))
        .limit(limit);
}

/**
 * Queue one automated message.
 *
 * Never throws: callers are booking flows, and a WhatsApp problem must not fail
 * a booking. Every refusal comes back as `{ queued: false, reason }` so the
 * caller can log it, and blocked sends are additionally recorded as `skipped`
 * rows so the automation's own log shows what was suppressed and why.
 */
export async function fireAutomation(
    key: AutomationKey,
    params: {
        phone: string;
        name?: string;
        guestProfileId?: string;
        /** What makes this fire unique — a booking id, or a date for recurring ones. */
        dedupe: string;
        variables?: Record<string, string>;
    },
): Promise<FireResult> {
    try {
        const automation = await getAutomation(key);
        if (!automation) return { queued: false, reason: 'unknown_automation', detail: `No automation "${key}"` };
        if (!automation.enabled) return { queued: false, reason: 'disabled', detail: 'Automation is switched off' };
        if (!automation.templateId) {
            return { queued: false, reason: 'no_template', detail: 'No template has been chosen for this automation' };
        }

        const template = await db.query.waTemplates.findFirst({
            where: eq(waTemplates.id, automation.templateId),
        });
        if (!template) return { queued: false, reason: 'no_template', detail: 'The chosen template no longer exists' };
        if (template.status !== 'approved') {
            return { queued: false, reason: 'template_not_approved', detail: `Template is ${template.status}` };
        }

        const contact = await findOrCreateContact(params.phone, params.name, params.guestProfileId);
        if (!contact) return { queued: false, reason: 'invalid_phone', detail: `Not a valid number: ${params.phone}` };

        const settings = await getSettings();
        const verdict = await canSend(contact, {
            category: template.category,
            // A property of the template, never of the contact — see gotcha 9.
            isRePermission: isRePermissionTemplate(template.name),
            settings,
            // Quiet hours are the dispatcher's business: it defers rather than drops.
            ignoreQuietHours: true,
        });

        const idempotencyKey = automationIdempotencyKey(key, contact.id, params.dedupe);

        if (!verdict.allowed) {
            // Recorded rather than silently dropped, so "why did this guest not get
            // their confirmation?" is answerable from the automation's own log.
            await db
                .insert(waMessages)
                .values({
                    contactId: contact.id,
                    templateId: template.id,
                    automationKey: key,
                    idempotencyKey,
                    status: 'skipped',
                    skipReason: verdict.reason,
                    errorDetail: describeBlockReason(verdict.reason),
                    variables: params.variables ?? {},
                })
                .onConflictDoNothing({ target: waMessages.idempotencyKey });

            return { queued: false, reason: verdict.reason, detail: describeBlockReason(verdict.reason) };
        }

        const [message] = await db
            .insert(waMessages)
            .values({
                contactId: contact.id,
                templateId: template.id,
                automationKey: key,
                idempotencyKey,
                status: 'queued',
                variables: params.variables ?? {},
                cost: estimateCostPaise(template.category, 1),
            })
            .onConflictDoNothing({ target: waMessages.idempotencyKey })
            .returning({ id: waMessages.id });

        // Empty means the unique index caught a duplicate: this exact automation has
        // already fired for this contact and trigger. That is a success, not a fault.
        if (!message) {
            return { queued: false, reason: 'already_fired', detail: 'This automation has already fired for this event' };
        }

        await db
            .update(waAutomations)
            .set({
                lastFiredAt: new Date(),
                fireCount: sql`COALESCE(${waAutomations.fireCount}, 0) + 1`,
            })
            .where(eq(waAutomations.key, key));

        return { queued: true, messageId: message.id };
    } catch (error) {
        // The whole point of this function is that it cannot break its caller.
        console.error(`[whatsapp/automations] ${key} failed to queue`, error);
        return {
            queued: false,
            reason: 'error',
            detail: error instanceof Error ? error.message : 'Automation failed',
        };
    }
}

/**
 * Contacts due a scheduled automation, for the automations cron.
 *
 * `prearrival` and `checkout_review` are not triggered by an event in our own
 * code — they are triggered by a date arriving — so they need a sweep rather
 * than a hook.
 */
export async function dueForSchedule(key: 'prearrival' | 'checkout_review', now: Date = new Date()) {
    const automation = await getAutomation(key);
    if (!automation?.enabled) return [];

    const offsetHours = automation.offsetHours ?? 0;
    // The target date is the event date the offset points at: -24h before check-in
    // means "find bookings whose check-in is 24 hours from now".
    const target = new Date(now.getTime() + Math.abs(offsetHours) * 3_600_000);
    const targetDate = target.toISOString().slice(0, 10);

    const column = key === 'prearrival' ? 'check_in' : 'check_out';

    // Raw because `bookings` is not part of the wa_* schema surface and the date
    // comparison has to happen on the DB side to use the index.
    const rows = await db.execute<{
        id: string; guest_name: string; guest_phone: string; booking_number: string;
        check_in: string; check_out: string;
    }>(sql`
        SELECT id, guest_name, guest_phone, booking_number, check_in, check_out
        FROM bookings
        WHERE status = 'confirmed'
          AND guest_phone IS NOT NULL
          AND ${sql.raw(`"${column}"`)}::date = ${targetDate}::date
    `);

    return rows.rows ?? [];
}
