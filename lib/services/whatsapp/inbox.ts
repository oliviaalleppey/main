import { db } from '@/lib/db';
import {
    waInboxThreads, waInboxMessages, waContacts, waCannedReplies, waTemplates,
} from '@/lib/db/schema';
import { and, asc, desc, eq, inArray, ilike, or, sql } from 'drizzle-orm';
import { getProvider } from './index';
import { canSend, describeBlockReason } from './consent';
import { getSettings } from './settings';
import { WhatsAppError, classifyError, SERVICE_WINDOW_MS } from './types';
import { renderTemplateText } from './template-lint';

/**
 * The two-way inbox.
 *
 * The rule that shapes this whole file is Meta's **24-hour customer service
 * window**: for 24 hours after a guest messages us we may send free-form text,
 * and outside it we may send nothing but an approved template. Getting that
 * backwards is not a cosmetic bug — free-form outside the window is rejected by
 * Meta and counts against the account's quality rating, which is the one number
 * that decides whether the hotel can message anyone at all.
 *
 * So the window is checked on the server, in `sendReply`, and not merely
 * greyed out in the UI. The composer's state is a convenience; this is the gate.
 *
 * Consent is deliberately delegated to `canSend` rather than re-implemented.
 * That function already carries the kill switch, test-mode whitelist and
 * suppression list, and a second, subtly different copy of those rules is
 * exactly how a consent bypass gets shipped (see gotcha 9 in the plan).
 */

export { SERVICE_WINDOW_MS };

export type WindowState = {
    open: boolean;
    expiresAt: Date | null;
    /** Milliseconds left, floored at 0. The UI counts down from this. */
    msRemaining: number;
};

export function windowState(
    thread: { windowExpiresAt: Date | string | null },
    now: Date = new Date(),
): WindowState {
    if (!thread.windowExpiresAt) return { open: false, expiresAt: null, msRemaining: 0 };

    const expiresAt = new Date(thread.windowExpiresAt);
    const msRemaining = expiresAt.getTime() - now.getTime();

    return { open: msRemaining > 0, expiresAt, msRemaining: Math.max(0, msRemaining) };
}

// --------------------------------------------
// Reading
// --------------------------------------------

export type ThreadListOptions = {
    status?: 'open' | 'resolved' | 'all';
    unreadOnly?: boolean;
    assignedTo?: string;
    label?: string;
    search?: string;
    limit?: number;
    offset?: number;
};

/**
 * The conversation list.
 *
 * Ordered unread-first, then by most recent activity, which is how an operator
 * actually works through a queue. The last-message preview is fetched in a
 * second query with DISTINCT ON rather than a correlated subquery per row.
 */
export async function listThreads(options: ThreadListOptions = {}) {
    const limit = Math.min(options.limit ?? 50, 200);
    const offset = options.offset ?? 0;

    const conditions = [];

    if (options.status && options.status !== 'all') {
        conditions.push(eq(waInboxThreads.status, options.status));
    }
    if (options.unreadOnly) {
        conditions.push(sql`COALESCE(${waInboxThreads.unreadCount}, 0) > 0`);
    }
    if (options.assignedTo) {
        conditions.push(eq(waInboxThreads.assignedTo, options.assignedTo));
    }
    if (options.label) {
        // labels is a json array; ? tests membership of a top-level key/element.
        conditions.push(sql`${waInboxThreads.labels}::jsonb ? ${options.label}`);
    }
    if (options.search?.trim()) {
        const term = `%${options.search.trim()}%`;
        conditions.push(
            or(ilike(waContacts.name, term), ilike(waContacts.phone, term))!,
        );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
        .select({
            thread: waInboxThreads,
            contact: {
                id: waContacts.id,
                name: waContacts.name,
                phone: waContacts.phone,
                consentStatus: waContacts.consentStatus,
            },
        })
        .from(waInboxThreads)
        .innerJoin(waContacts, eq(waInboxThreads.contactId, waContacts.id))
        .where(where)
        // Unread first, then most recent. NULLS LAST keeps a thread with no
        // messages from floating to the top of the queue.
        .orderBy(
            desc(sql`COALESCE(${waInboxThreads.unreadCount}, 0) > 0`),
            sql`${waInboxThreads.lastMessageAt} DESC NULLS LAST`,
        )
        .limit(limit)
        .offset(offset);

    const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(waInboxThreads)
        .innerJoin(waContacts, eq(waInboxThreads.contactId, waContacts.id))
        .where(where);

    const previews = await lastMessagePerThread(rows.map((r) => r.thread.id));
    const now = new Date();

    return {
        total: count,
        threads: rows.map((row) => ({
            ...row.thread,
            contact: row.contact,
            window: windowState(row.thread, now),
            lastMessage: previews.get(row.thread.id) ?? null,
        })),
    };
}

/** Latest message for each of the given threads, in one round trip. */
async function lastMessagePerThread(threadIds: string[]) {
    const map = new Map<string, { body: string | null; direction: string; createdAt: Date | null; type: string }>();
    if (!threadIds.length) return map;

    const rows = await db
        .selectDistinctOn([waInboxMessages.threadId], {
            threadId: waInboxMessages.threadId,
            body: waInboxMessages.body,
            direction: waInboxMessages.direction,
            type: waInboxMessages.type,
            createdAt: waInboxMessages.createdAt,
        })
        .from(waInboxMessages)
        .where(inArray(waInboxMessages.threadId, threadIds))
        .orderBy(waInboxMessages.threadId, desc(waInboxMessages.createdAt));

    for (const row of rows) {
        map.set(row.threadId, {
            body: row.body,
            direction: row.direction,
            createdAt: row.createdAt,
            type: row.type,
        });
    }
    return map;
}

export async function getThread(threadId: string) {
    const row = await db
        .select({ thread: waInboxThreads, contact: waContacts })
        .from(waInboxThreads)
        .innerJoin(waContacts, eq(waInboxThreads.contactId, waContacts.id))
        .where(eq(waInboxThreads.id, threadId))
        .limit(1);

    if (!row.length) return null;

    const messages = await db.query.waInboxMessages.findMany({
        where: eq(waInboxMessages.threadId, threadId),
        orderBy: [asc(waInboxMessages.createdAt)],
        limit: 500,
    });

    return {
        ...row[0].thread,
        contact: row[0].contact,
        window: windowState(row[0].thread),
        messages,
    };
}

/** Thread for a contact, if one exists. Used by the contact detail screen. */
export async function getThreadByContact(contactId: string) {
    const thread = await db.query.waInboxThreads.findFirst({
        where: eq(waInboxThreads.contactId, contactId),
    });
    return thread ? { ...thread, window: windowState(thread) } : null;
}

export async function unreadTotal(): Promise<number> {
    const [row] = await db
        .select({ n: sql<number>`COALESCE(SUM(${waInboxThreads.unreadCount}), 0)::int` })
        .from(waInboxThreads)
        .where(eq(waInboxThreads.status, 'open'));
    return row?.n ?? 0;
}

// --------------------------------------------
// Thread state
// --------------------------------------------

export async function markRead(threadId: string) {
    await db
        .update(waInboxThreads)
        .set({ unreadCount: 0, updatedAt: new Date() })
        .where(eq(waInboxThreads.id, threadId));
}

export async function setThreadStatus(threadId: string, status: 'open' | 'resolved') {
    await db
        .update(waInboxThreads)
        .set({
            status,
            // Resolving is also an acknowledgement that it has been read.
            ...(status === 'resolved' ? { unreadCount: 0 } : {}),
            updatedAt: new Date(),
        })
        .where(eq(waInboxThreads.id, threadId));
}

export async function assignThread(threadId: string, assignedTo: string | null) {
    await db
        .update(waInboxThreads)
        .set({ assignedTo, updatedAt: new Date() })
        .where(eq(waInboxThreads.id, threadId));
}

export async function setLabels(threadId: string, labels: string[]) {
    await db
        .update(waInboxThreads)
        .set({ labels, updatedAt: new Date() })
        .where(eq(waInboxThreads.id, threadId));
}

export async function setInternalNotes(threadId: string, internalNotes: string) {
    await db
        .update(waInboxThreads)
        .set({ internalNotes, updatedAt: new Date() })
        .where(eq(waInboxThreads.id, threadId));
}

// --------------------------------------------
// Sending
// --------------------------------------------

export class WindowClosedError extends Error {
    constructor(public expiresAt: Date | null) {
        super(
            'The 24-hour reply window has closed. Only an approved template may be sent now.',
        );
        this.name = 'WindowClosedError';
    }
}

export class SendBlockedError extends Error {
    constructor(public reason: string, detail: string) {
        super(detail);
        this.name = 'SendBlockedError';
    }
}

type Actor = { id?: string; email?: string };

/**
 * Send a free-form reply inside the service window.
 *
 * Order matters: the window and consent are both checked before the provider is
 * called, and a provider failure is recorded as a failed message on the thread
 * rather than thrown away — an operator needs to see that their reply did not
 * land, in the place they typed it.
 */
export async function sendReply(params: {
    threadId: string;
    body: string;
    actor: Actor;
}) {
    const body = params.body?.trim();
    if (!body) throw new Error('Message body is required');
    if (body.length > 4096) throw new Error('Message must be 4096 characters or fewer');

    const row = await db
        .select({ thread: waInboxThreads, contact: waContacts })
        .from(waInboxThreads)
        .innerJoin(waContacts, eq(waInboxThreads.contactId, waContacts.id))
        .where(eq(waInboxThreads.id, params.threadId))
        .limit(1);

    if (!row.length) throw new Error('Thread not found');
    const { thread, contact } = row[0];

    // Gate 1: the window. Checked here, on the server, because the composer being
    // enabled is a UI state and this is the actual rule.
    const state = windowState(thread);
    if (!state.open) throw new WindowClosedError(state.expiresAt);

    // Gate 2: the shared consent chokepoint. UTILITY is the correct category for a
    // service-window reply — the guest opened the conversation, so this is not
    // marketing, and an opted-out guest asking a question still deserves an answer.
    const settings = await getSettings();
    const verdict = await canSend(contact, { category: 'UTILITY', settings });
    if (!verdict.allowed) {
        throw new SendBlockedError(verdict.reason, describeBlockReason(verdict.reason));
    }

    const provider = getProvider();

    try {
        const result = await provider.sendText({ to: contact.phone, body });

        const [message] = await db
            .insert(waInboxMessages)
            .values({
                threadId: thread.id,
                direction: 'outbound',
                type: 'text',
                body,
                wamid: result.wamid,
                status: 'sent',
                sentBy: params.actor.id,
            })
            .returning();

        await db
            .update(waInboxThreads)
            .set({ lastMessageAt: new Date(), updatedAt: new Date() })
            .where(eq(waInboxThreads.id, thread.id));

        await db
            .update(waContacts)
            .set({ lastOutboundAt: new Date(), updatedAt: new Date() })
            .where(eq(waContacts.id, contact.id));

        return { message, warnings: verdict.warnings };
    } catch (error) {
        const code = error instanceof WhatsAppError ? error.code : undefined;
        const spec = classifyError(code);
        const detail = error instanceof Error ? error.message : 'Send failed';

        // Recorded, not swallowed: the operator sees a failed bubble in the thread.
        await db.insert(waInboxMessages).values({
            threadId: thread.id,
            direction: 'outbound',
            type: 'text',
            body,
            status: 'failed',
            sentBy: params.actor.id,
            errorDetail: `${detail}${code ? ` (Meta ${code}, ${spec.class})` : ''}`,
        });

        throw error;
    }
}

/**
 * Send an approved template to a thread — the only thing permitted once the
 * window has closed.
 *
 * Templates are also allowed *inside* the window, so this deliberately does not
 * check the window at all; it checks that the template is approved, which is the
 * constraint that actually applies.
 */
export async function sendTemplateReply(params: {
    threadId: string;
    templateId: string;
    variables?: Record<string, string>;
    actor: Actor;
}) {
    const row = await db
        .select({ thread: waInboxThreads, contact: waContacts })
        .from(waInboxThreads)
        .innerJoin(waContacts, eq(waInboxThreads.contactId, waContacts.id))
        .where(eq(waInboxThreads.id, params.threadId))
        .limit(1);

    if (!row.length) throw new Error('Thread not found');
    const { thread, contact } = row[0];

    const template = await db.query.waTemplates.findFirst({
        where: eq(waTemplates.id, params.templateId),
    });
    if (!template) throw new Error('Template not found');
    if (template.status !== 'approved') {
        throw new Error(`Template "${template.name}" is ${template.status}, not approved`);
    }

    const settings = await getSettings();
    const verdict = await canSend(contact, { category: template.category, settings });
    if (!verdict.allowed) {
        throw new SendBlockedError(verdict.reason, describeBlockReason(verdict.reason));
    }

    const variables = params.variables ?? {};
    const provider = getProvider();

    // Runtime parameters, ordered by variable index. Built the same way as the
    // dispatcher does it — Meta matches {{1}}, {{2}} by position, not by name, so
    // the sort is load-bearing rather than cosmetic.
    const orderedValues = Object.keys(variables)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => variables[key]);

    try {
        const result = await provider.sendTemplate({
            to: contact.phone,
            templateName: template.name,
            language: template.language,
            components: orderedValues.length
                ? [{ type: 'body', parameters: orderedValues.map((text) => ({ type: 'text', text })) }]
                : undefined,
        });

        const [message] = await db
            .insert(waInboxMessages)
            .values({
                threadId: thread.id,
                direction: 'outbound',
                type: 'template',
                body: renderTemplateText(template.bodyText ?? '', variables),
                wamid: result.wamid,
                status: 'sent',
                sentBy: params.actor.id,
            })
            .returning();

        await db
            .update(waInboxThreads)
            .set({ lastMessageAt: new Date(), updatedAt: new Date() })
            .where(eq(waInboxThreads.id, thread.id));

        await db
            .update(waContacts)
            .set({ lastOutboundAt: new Date(), updatedAt: new Date() })
            .where(eq(waContacts.id, contact.id));

        return { message, warnings: verdict.warnings };
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'Send failed';
        await db.insert(waInboxMessages).values({
            threadId: thread.id,
            direction: 'outbound',
            type: 'template',
            body: renderTemplateText(template.bodyText ?? '', variables),
            status: 'failed',
            sentBy: params.actor.id,
            errorDetail: detail,
        });
        throw error;
    }
}

// --------------------------------------------
// Canned replies
// --------------------------------------------

export async function listCannedReplies(includeInactive = false) {
    return db.query.waCannedReplies.findMany({
        where: includeInactive ? undefined : eq(waCannedReplies.isActive, true),
        orderBy: [asc(waCannedReplies.sortOrder), asc(waCannedReplies.title)],
    });
}

export async function createCannedReply(params: {
    title: string;
    body: string;
    category?: string;
    sortOrder?: number;
}) {
    const [reply] = await db.insert(waCannedReplies).values(params).returning();
    return reply;
}

export async function updateCannedReply(
    id: string,
    patch: Partial<{ title: string; body: string; category: string; sortOrder: number; isActive: boolean }>,
) {
    const [reply] = await db
        .update(waCannedReplies)
        .set(patch)
        .where(eq(waCannedReplies.id, id))
        .returning();
    return reply;
}

export async function deleteCannedReply(id: string) {
    await db.delete(waCannedReplies).where(eq(waCannedReplies.id, id));
}
