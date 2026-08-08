import { db } from '@/lib/db';
import { waContacts, waConsentEvents, waSuppression } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getSettings, isWithinQuietHours, type WaSettings } from './settings';

/**
 * The consent chokepoint.
 *
 * Every outbound send path — campaigns, automations, inbox, single test sends —
 * MUST call canSend() and honour its verdict. This is the file that stands
 * between the hotel and a banned WhatsApp number, so it is written to fail
 * closed: an unknown state is treated as "do not send".
 *
 * Nothing here trusts wa_contacts.consent_status alone for auditing purposes.
 * That column is a fast-read projection; wa_consent_events is the ledger.
 */

export type Contact = typeof waContacts.$inferSelect;

export type MessageCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

/**
 * Machine-readable reasons a send was blocked. Stored on wa_messages.skip_reason
 * so the campaign screen can show operators exactly why their 10,000 became 6,200.
 */
export type BlockReason =
    | 'kill_switch_off'
    | 'suppressed'
    | 'opted_out'
    | 'not_opted_in'
    | 'frequency_capped'
    | 'quiet_hours'
    | 'invalid_phone'
    | 'no_consent_record'
    | 'test_mode_not_whitelisted';

export type SendVerdict =
    | { allowed: true; warnings: string[] }
    | { allowed: false; reason: BlockReason; detail: string };

const BLOCK_DETAIL: Record<BlockReason, string> = {
    kill_switch_off: 'WhatsApp sending is switched off in settings',
    suppressed: 'On the permanent do-not-contact list',
    opted_out: 'Withdrew consent',
    not_opted_in: 'No documented WhatsApp opt-in — only the re-permission template may be sent',
    frequency_capped: 'Already received the maximum marketing messages for this period',
    quiet_hours: 'Within quiet hours — marketing is held until morning',
    invalid_phone: 'Phone number is not a valid E.164 number',
    no_consent_record: 'Marked opted-in but has no consent timestamp',
    test_mode_not_whitelisted: 'Test mode is on and this number is not in the test list',
};

export function describeBlockReason(reason: BlockReason): string {
    return BLOCK_DETAIL[reason];
}

/**
 * The single gate. Marketing is held to a much higher bar than utility:
 * a utility message is justified by the guest's own transaction, whereas a
 * marketing message needs documented, current consent.
 */
export async function canSend(
    contact: Pick<Contact,
        | 'phone' | 'consentStatus' | 'consentAt' | 'marketingSent30d' | 'optedOutAt'>,
    options: {
        category: MessageCategory;
        /** The re-permission template is the one marketing message a 'pending' contact may receive. */
        isRePermission?: boolean;
        settings?: WaSettings;
        now?: Date;
        /** Skip the quiet-hours check when the caller intends to defer rather than drop. */
        ignoreQuietHours?: boolean;
    },
): Promise<SendVerdict> {
    const settings = options.settings ?? (await getSettings());
    const now = options.now ?? new Date();
    const warnings: string[] = [];

    // 1. Global kill switch — beats everything.
    if (!settings.enabled) {
        return { allowed: false, reason: 'kill_switch_off', detail: BLOCK_DETAIL.kill_switch_off };
    }

    // 2. Basic sanity on the number itself.
    if (!/^\+[1-9]\d{6,14}$/.test(contact.phone)) {
        return { allowed: false, reason: 'invalid_phone', detail: BLOCK_DETAIL.invalid_phone };
    }

    // 3. Test mode: nothing leaves the building except to whitelisted numbers.
    if (settings.testMode) {
        const whitelist = (settings.testNumbers as string[] | null) ?? [];
        if (!whitelist.includes(contact.phone)) {
            return {
                allowed: false,
                reason: 'test_mode_not_whitelisted',
                detail: BLOCK_DETAIL.test_mode_not_whitelisted,
            };
        }
    }

    // 4. Suppression list — permanent, and checked against the DB rather than the
    //    contact row, because suppression survives contact deletion.
    if (await isSuppressed(contact.phone)) {
        return { allowed: false, reason: 'suppressed', detail: BLOCK_DETAIL.suppressed };
    }

    if (contact.consentStatus === 'suppressed') {
        return { allowed: false, reason: 'suppressed', detail: BLOCK_DETAIL.suppressed };
    }

    // 5. Opted out. Utility messages are still permitted where a live transaction
    //    justifies them (a guest who opted out of marketing still needs their
    //    booking confirmation), but marketing never is.
    if (contact.consentStatus === 'opted_out') {
        if (options.category === 'MARKETING') {
            return { allowed: false, reason: 'opted_out', detail: BLOCK_DETAIL.opted_out };
        }
        warnings.push('Contact opted out of marketing; sending utility message on transactional grounds');
    }

    // 6. Marketing-specific gates.
    if (options.category === 'MARKETING') {
        if (contact.consentStatus === 'pending') {
            // The one permitted exception: asking for permission.
            if (!options.isRePermission) {
                return { allowed: false, reason: 'not_opted_in', detail: BLOCK_DETAIL.not_opted_in };
            }
        } else if (contact.consentStatus === 'opted_in') {
            // Fail closed: 'opted_in' without a timestamp means the ledger and the
            // projection disagree, which we cannot defend if challenged.
            if (!contact.consentAt) {
                return { allowed: false, reason: 'no_consent_record', detail: BLOCK_DETAIL.no_consent_record };
            }
        }

        // Frequency cap — the main defence against the opt-out spiral.
        const cap = settings.frequencyCapPer30d ?? 2;
        if (cap > 0 && (contact.marketingSent30d ?? 0) >= cap) {
            return { allowed: false, reason: 'frequency_capped', detail: BLOCK_DETAIL.frequency_capped };
        }

        // Quiet hours apply to marketing only; a booking confirmation at 23:00 is
        // expected and welcome.
        if (!options.ignoreQuietHours && isWithinQuietHours(settings, now)) {
            return { allowed: false, reason: 'quiet_hours', detail: BLOCK_DETAIL.quiet_hours };
        }
    }

    return { allowed: true, warnings };
}

export async function isSuppressed(phone: string): Promise<boolean> {
    const row = await db.query.waSuppression.findFirst({
        where: eq(waSuppression.phone, phone),
        columns: { id: true },
    });
    return !!row;
}

// --------------------------------------------
// Consent transitions
// --------------------------------------------

type ConsentStatus = Contact['consentStatus'];

/**
 * Change a contact's consent state and append to the ledger, in one transaction.
 * The ledger write is not optional — a status change without a recorded reason is
 * exactly the gap that makes a DPDP request impossible to answer.
 */
export async function recordConsentChange(params: {
    contactId: string;
    toStatus: ConsentStatus;
    reason: string;
    source: string;
    actorId?: string;
    actorEmail?: string;
    ip?: string;
    optOutMethod?: string;
}): Promise<void> {
    await db.transaction(async (tx) => {
        const contact = await tx.query.waContacts.findFirst({
            where: eq(waContacts.id, params.contactId),
            columns: { id: true, phone: true, consentStatus: true },
        });
        if (!contact) throw new Error(`Contact ${params.contactId} not found`);

        const fromStatus = contact.consentStatus;
        if (fromStatus === params.toStatus) return; // idempotent

        const isOptOut = params.toStatus === 'opted_out' || params.toStatus === 'suppressed';

        await tx
            .update(waContacts)
            .set({
                consentStatus: params.toStatus,
                consentAt: params.toStatus === 'opted_in' ? new Date() : undefined,
                consentSource: params.toStatus === 'opted_in' ? params.source : undefined,
                optedOutAt: isOptOut ? new Date() : null,
                optOutMethod: isOptOut ? (params.optOutMethod ?? 'manual') : null,
                updatedAt: new Date(),
            })
            .where(eq(waContacts.id, params.contactId));

        await tx.insert(waConsentEvents).values({
            contactId: contact.id,
            phone: contact.phone,
            fromStatus,
            toStatus: params.toStatus,
            reason: params.reason,
            source: params.source,
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            ip: params.ip,
        });

        // Suppression must outlive the contact row, so it gets its own record.
        if (params.toStatus === 'suppressed') {
            await tx
                .insert(waSuppression)
                .values({ phone: contact.phone, reason: params.reason, addedBy: params.actorId })
                .onConflictDoNothing();
        }
    });
}

// --------------------------------------------
// Inbound STOP detection
// --------------------------------------------

/**
 * Opt-out intent in a free-text reply.
 *
 * Deliberately conservative on both sides. A false positive silently loses a
 * guest we were allowed to contact; a false negative keeps messaging someone who
 * asked us to stop, which is both rude and a block-report risk. The phrase list
 * covers English and transliterated Malayalam/Hindi, since that is what guests
 * in Kerala actually type.
 */
const STOP_PATTERNS: RegExp[] = [
    /^\s*stop\s*$/i,
    /^\s*unsubscribe\s*$/i,
    /^\s*opt\s*-?\s*out\s*$/i,
    /^\s*cancel\s*$/i,
    /^\s*remove\s*(me)?\s*$/i,
    /^\s*no\s*thanks?\s*$/i,
    /\bstop\s+(sending|messaging|these|this|promotions?|offers?)\b/i,
    /\b(unsubscribe|opt\s*-?\s*out)\b/i,
    /\bdo\s*n[o']?t\s+(send|message|contact|text)\b/i,
    /\bremove\s+(me|my\s+number)\b/i,
    /\bnot\s+interested\b/i,
    /\bleave\s+me\s+alone\b/i,
    /\bstop\s+it\b/i,
    // Transliterated: "venda" (don't want), "ayakkanda" (don't send)
    /\bvenda\b/i,
    /\bayakkand[ae]\b/i,
    /\bmath[ie]\b/i,
    /\bband\s*kar/i,
    /\bmat\s+bhej/i,
];

export function detectStopIntent(text: string | null | undefined): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) return false; // long messages are conversation, not commands
    return STOP_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** The quick-reply button payload our marketing templates carry. */
const OPT_OUT_BUTTON_TEXTS = ['stop promotions', 'no thanks', 'unsubscribe'];

export function isOptOutButton(buttonText: string | null | undefined): boolean {
    if (!buttonText) return false;
    return OPT_OUT_BUTTON_TEXTS.includes(buttonText.trim().toLowerCase());
}

/** The affirmative reply to olivia_reengage_v1. */
export function isOptInButton(buttonText: string | null | undefined): boolean {
    if (!buttonText) return false;
    return ['yes, keep me posted', 'yes', 'keep me posted'].includes(buttonText.trim().toLowerCase());
}

// --------------------------------------------
// Frequency-cap bookkeeping
// --------------------------------------------

/**
 * Recompute marketing_sent_30d from wa_messages.
 *
 * The counter is incremented on send for speed, but it drifts (deleted campaigns,
 * failed sends that were counted optimistically). The sync cron calls this to
 * bring it back in line with the actual message history.
 */
export async function recomputeMarketingWindow(contactId?: string): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 3_600_000);

    const result = await db.execute(sql`
        UPDATE wa_contacts c
        SET marketing_sent_30d = COALESCE(m.cnt, 0)
        FROM (
            SELECT ct.id AS contact_id, COUNT(msg.id) AS cnt
            FROM wa_contacts ct
            LEFT JOIN wa_messages msg
                ON msg.contact_id = ct.id
                AND msg.sent_at >= ${cutoff}
                AND msg.status IN ('sent', 'delivered', 'read')
                AND msg.template_id IN (SELECT id FROM wa_templates WHERE category = 'MARKETING')
            ${contactId ? sql`WHERE ct.id = ${contactId}` : sql``}
            GROUP BY ct.id
        ) m
        WHERE c.id = m.contact_id AND c.marketing_sent_30d IS DISTINCT FROM COALESCE(m.cnt, 0)
    `);

    return result.rowCount ?? 0;
}

/** Called by the dispatcher immediately after a successful marketing send. */
export async function incrementMarketingCounters(contactId: string): Promise<void> {
    await db
        .update(waContacts)
        .set({
            marketingSentCount: sql`COALESCE(${waContacts.marketingSentCount}, 0) + 1`,
            marketingSent30d: sql`COALESCE(${waContacts.marketingSent30d}, 0) + 1`,
            lastOutboundAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(waContacts.id, contactId));
}

/** Count of contacts eligible for a marketing send right now, for audience previews. */
export async function countMarketingEligible(): Promise<number> {
    const settings = await getSettings();
    const cap = settings.frequencyCapPer30d ?? 2;

    const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(waContacts)
        .where(
            and(
                eq(waContacts.consentStatus, 'opted_in'),
                sql`${waContacts.consentAt} IS NOT NULL`,
                cap > 0 ? sql`COALESCE(${waContacts.marketingSent30d}, 0) < ${cap}` : sql`true`,
                sql`NOT EXISTS (SELECT 1 FROM wa_suppression s WHERE s.phone = ${waContacts.phone})`,
            ),
        );

    return Number(row?.count ?? 0);
}

/** Contacts whose 30-day marketing window has rolled over since a given date. */
export async function contactsWithExpiredWindow(since: Date) {
    return db.query.waContacts.findMany({
        where: and(
            eq(waContacts.consentStatus, 'opted_in'),
            gte(waContacts.updatedAt, since),
        ),
        columns: { id: true, phone: true, marketingSent30d: true },
        limit: 1000,
    });
}
