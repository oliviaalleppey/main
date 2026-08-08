import { db } from '@/lib/db';
import {
    waContacts, waConsentEvents, waMessages, waSuppression, waInboxThreads,
    waInboxMessages, waEvents, waAuditLog,
} from '@/lib/db/schema';
import { and, asc, desc, eq, gte, ilike, lt, sql } from 'drizzle-orm';
import { normalizePhone } from './phone';

/**
 * DPDP tooling: answering "what do you hold about me", "delete it", and
 * "prove this person agreed".
 *
 * The one rule worth stating plainly, because it is easy to get backwards:
 * **erasing someone must never make them contactable again.** A naive delete
 * removes the contact row and with it the opt-out that row was carrying, so the
 * next CSV import re-adds them as a fresh prospect. Every erasure here therefore
 * writes a suppression tombstone *before* deleting anything, in the same
 * transaction, and `wa_suppression` is checked by `canSend` on every send.
 */

export type SubjectExport = {
    phone: string;
    found: boolean;
    contact: Record<string, unknown> | null;
    consentEvents: Record<string, unknown>[];
    messages: Record<string, unknown>[];
    conversation: { thread: Record<string, unknown> | null; messages: Record<string, unknown>[] };
    suppression: Record<string, unknown> | null;
    exportedAt: string;
};

/**
 * Everything we hold about one phone number.
 *
 * Deliberately keyed on the number rather than an internal id: a data subject
 * request arrives as "here is my phone number", and asking the operator to find
 * an internal id first is how these requests get answered wrongly.
 */
export async function dataSubjectExport(rawPhone: string): Promise<SubjectExport> {
    const normalized = normalizePhone(rawPhone);
    const phone = normalized.ok ? normalized.e164 : rawPhone.trim();

    const contact = await db.query.waContacts.findFirst({ where: eq(waContacts.phone, phone) });
    const suppression = await db.query.waSuppression.findFirst({ where: eq(waSuppression.phone, phone) });

    const base: SubjectExport = {
        phone,
        found: !!contact || !!suppression,
        contact: contact ?? null,
        consentEvents: [],
        messages: [],
        conversation: { thread: null, messages: [] },
        suppression: suppression ?? null,
        exportedAt: new Date().toISOString(),
    };

    if (!contact) {
        // The consent ledger is still searchable by number, so a request about
        // someone already erased returns the suppression tombstone rather than
        // a bare "not found", which would read as though we never held anything.
        base.consentEvents = await db.query.waConsentEvents.findMany({
            where: eq(waConsentEvents.phone, phone),
            orderBy: [asc(waConsentEvents.createdAt)],
        });
        return base;
    }

    const [consentEvents, messages, thread] = await Promise.all([
        db.query.waConsentEvents.findMany({
            where: eq(waConsentEvents.contactId, contact.id),
            orderBy: [asc(waConsentEvents.createdAt)],
        }),
        db.query.waMessages.findMany({
            where: eq(waMessages.contactId, contact.id),
            orderBy: [asc(waMessages.queuedAt)],
        }),
        db.query.waInboxThreads.findFirst({ where: eq(waInboxThreads.contactId, contact.id) }),
    ]);

    base.consentEvents = consentEvents;
    base.messages = messages;

    if (thread) {
        base.conversation = {
            thread,
            messages: await db.query.waInboxMessages.findMany({
                where: eq(waInboxMessages.threadId, thread.id),
                orderBy: [asc(waInboxMessages.createdAt)],
            }),
        };
    }

    return base;
}

export type EraseResult = {
    erased: boolean;
    phone: string;
    removed: { contact: boolean; messages: number; consentEvents: number; inboxMessages: number };
};

/**
 * Erase a data subject, leaving a suppression tombstone.
 *
 * Counts are gathered before the delete so the caller — and the audit log — can
 * state what was actually removed. Everything runs in one transaction: a
 * tombstone without a delete, or a delete without a tombstone, are both worse
 * than doing nothing.
 */
export async function dataSubjectErase(
    rawPhone: string,
    actor: { id?: string; email?: string },
    reason = 'Erased on data subject request (DPDP)',
): Promise<EraseResult> {
    const normalized = normalizePhone(rawPhone);
    const phone = normalized.ok ? normalized.e164 : rawPhone.trim();

    const contact = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, phone),
        columns: { id: true },
    });

    if (!contact) {
        // Still worth suppressing: "delete me and never contact me" is one request,
        // and the number may arrive in a future import even if it is unknown today.
        await db
            .insert(waSuppression)
            .values({ phone, reason, addedBy: actor.id })
            .onConflictDoNothing();

        return {
            erased: false,
            phone,
            removed: { contact: false, messages: 0, consentEvents: 0, inboxMessages: 0 },
        };
    }

    const [messageCount] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waMessages)
        .where(eq(waMessages.contactId, contact.id));

    const [consentCount] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waConsentEvents)
        .where(eq(waConsentEvents.contactId, contact.id));

    const thread = await db.query.waInboxThreads.findFirst({
        where: eq(waInboxThreads.contactId, contact.id),
        columns: { id: true },
    });

    let inboxCount = 0;
    if (thread) {
        const [row] = await db
            .select({ n: sql<number>`count(*)::int` })
            .from(waInboxMessages)
            .where(eq(waInboxMessages.threadId, thread.id));
        inboxCount = row?.n ?? 0;
    }

    await db.transaction(async (tx) => {
        // Tombstone first. If the delete then fails, we are left over-suppressing,
        // which is the safe direction to fail in.
        await tx
            .insert(waSuppression)
            .values({ phone, reason, addedBy: actor.id })
            .onConflictDoNothing();

        // wa_messages, wa_consent_events and wa_inbox_threads all cascade from the
        // contact; wa_inbox_messages cascades from the thread.
        await tx.delete(waContacts).where(eq(waContacts.id, contact.id));
    });

    return {
        erased: true,
        phone,
        removed: {
            contact: true,
            messages: messageCount?.n ?? 0,
            consentEvents: consentCount?.n ?? 0,
            inboxMessages: inboxCount,
        },
    };
}

// --------------------------------------------
// Suppression list
// --------------------------------------------

export async function listSuppression(options: { search?: string; limit?: number; offset?: number } = {}) {
    const limit = Math.min(options.limit ?? 50, 200);
    const where = options.search?.trim()
        ? ilike(waSuppression.phone, `%${options.search.trim()}%`)
        : undefined;

    const [rows, [count]] = await Promise.all([
        db
            .select()
            .from(waSuppression)
            .where(where)
            .orderBy(desc(waSuppression.createdAt))
            .limit(limit)
            .offset(options.offset ?? 0),
        db.select({ n: sql<number>`count(*)::int` }).from(waSuppression).where(where),
    ]);

    return { total: count?.n ?? 0, entries: rows };
}

export async function addSuppression(rawPhone: string, reason: string, actorId?: string) {
    const normalized = normalizePhone(rawPhone);
    if (!normalized.ok) throw new Error(`Not a valid phone number: ${rawPhone}`);

    const [entry] = await db
        .insert(waSuppression)
        .values({ phone: normalized.e164, reason, addedBy: actorId })
        .onConflictDoNothing()
        .returning();

    return entry ?? null;
}

/**
 * Remove a number from the suppression list.
 *
 * This is the one destructive operation in the compliance surface — it makes a
 * previously un-contactable number contactable again — so the caller is expected
 * to audit it, and the UI asks for confirmation.
 */
export async function removeSuppression(phone: string) {
    await db.delete(waSuppression).where(eq(waSuppression.phone, phone));
}

// --------------------------------------------
// Consent ledger
// --------------------------------------------

export async function consentLedger(options: {
    phone?: string;
    toStatus?: 'pending' | 'opted_in' | 'opted_out' | 'suppressed';
    limit?: number;
    offset?: number;
} = {}) {
    const limit = Math.min(options.limit ?? 100, 500);
    const conditions = [];

    if (options.phone?.trim()) conditions.push(ilike(waConsentEvents.phone, `%${options.phone.trim()}%`));
    if (options.toStatus) conditions.push(eq(waConsentEvents.toStatus, options.toStatus));
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [count]] = await Promise.all([
        db
            .select()
            .from(waConsentEvents)
            .where(where)
            .orderBy(desc(waConsentEvents.createdAt))
            .limit(limit)
            .offset(options.offset ?? 0),
        db.select({ n: sql<number>`count(*)::int` }).from(waConsentEvents).where(where),
    ]);

    return { total: count?.n ?? 0, events: rows };
}

// --------------------------------------------
// Audit log
// --------------------------------------------

export async function auditLog(options: {
    action?: string;
    actorEmail?: string;
    limit?: number;
    offset?: number;
} = {}) {
    const limit = Math.min(options.limit ?? 100, 500);
    const conditions = [];

    if (options.action?.trim()) conditions.push(ilike(waAuditLog.action, `%${options.action.trim()}%`));
    if (options.actorEmail?.trim()) conditions.push(ilike(waAuditLog.actorEmail, `%${options.actorEmail.trim()}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [count]] = await Promise.all([
        db
            .select()
            .from(waAuditLog)
            .where(where)
            .orderBy(desc(waAuditLog.createdAt))
            .limit(limit)
            .offset(options.offset ?? 0),
        db.select({ n: sql<number>`count(*)::int` }).from(waAuditLog).where(where),
    ]);

    return { total: count?.n ?? 0, entries: rows };
}

// --------------------------------------------
// Retention
// --------------------------------------------

export type RetentionReport = { rawEventsDeleted: number; cutoff: string };

/**
 * Purge raw webhook payloads older than `days`.
 *
 * `wa_events` stores Meta's payloads verbatim for debugging and replay, which
 * means it accumulates message bodies and phone numbers indefinitely. Keeping
 * that for ever is the kind of quiet over-retention DPDP is aimed at, so it is
 * swept on a schedule. Nothing else is purged here: the send log and the consent
 * ledger are the records the hotel may need to defend.
 */
export async function purgeRawEvents(days = 30): Promise<RetentionReport> {
    const cutoff = new Date(Date.now() - days * 86_400_000);

    const deleted = await db
        .delete(waEvents)
        .where(lt(waEvents.receivedAt, cutoff))
        .returning({ id: waEvents.id });

    return { rawEventsDeleted: deleted.length, cutoff: cutoff.toISOString() };
}

/** Counts for the compliance dashboard. */
export async function complianceSnapshot() {
    const [contacts] = await db
        .select({
            total: sql<number>`count(*)::int`,
            optedIn: sql<number>`count(*) FILTER (WHERE ${waContacts.consentStatus} = 'opted_in')::int`,
            withProof: sql<number>`count(*) FILTER (WHERE ${waContacts.consentStatus} = 'opted_in' AND ${waContacts.consentAt} IS NOT NULL)::int`,
            optedOut: sql<number>`count(*) FILTER (WHERE ${waContacts.consentStatus} = 'opted_out')::int`,
        })
        .from(waContacts);

    const [suppression] = await db.select({ n: sql<number>`count(*)::int` }).from(waSuppression);
    const [ledger] = await db.select({ n: sql<number>`count(*)::int` }).from(waConsentEvents);
    const [rawEvents] = await db.select({ n: sql<number>`count(*)::int` }).from(waEvents);

    const [oldEvents] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waEvents)
        .where(lt(waEvents.receivedAt, new Date(Date.now() - 30 * 86_400_000)));

    const [recentOptOuts] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waConsentEvents)
        .where(
            and(
                eq(waConsentEvents.toStatus, 'opted_out'),
                gte(waConsentEvents.createdAt, new Date(Date.now() - 30 * 86_400_000)),
            ),
        );

    const optedIn = contacts?.optedIn ?? 0;
    const withProof = contacts?.withProof ?? 0;

    return {
        contacts: contacts?.total ?? 0,
        optedIn,
        withProof,
        proofPercent: optedIn ? Math.round((withProof / optedIn) * 100) : 100,
        optedOut: contacts?.optedOut ?? 0,
        suppressed: suppression?.n ?? 0,
        ledgerEntries: ledger?.n ?? 0,
        rawEvents: rawEvents?.n ?? 0,
        rawEventsOver30Days: oldEvents?.n ?? 0,
        optOutsLast30Days: recentOptOuts?.n ?? 0,
    };
}
