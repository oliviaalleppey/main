import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db';
import {
    waMessages, waContacts, waEvents, waInboxThreads, waInboxMessages, waTemplates,
} from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { detectStopIntent, isOptOutButton, isOptInButton, recordConsentChange } from './consent';
import { normalizePhone } from './phone';
import { SERVICE_WINDOW_MS } from './types';

/**
 * Meta webhook processing.
 *
 * Three payload shapes arrive on one endpoint:
 *   - `statuses[]`  — sent / delivered / read / failed transitions
 *   - `messages[]`  — inbound replies from guests
 *   - `message_template_status_update` — Meta approving, rejecting or pausing
 *
 * Everything here must be **idempotent**. Meta retries aggressively on any
 * non-200, and delivers out of order often enough that it cannot be treated as
 * an edge case: a `read` regularly arrives before the `delivered` it implies.
 * Every status write is therefore guarded so it can only move a message forward.
 *
 * The consent path is the part that matters most. A guest replying STOP must end
 * up opted out even if the rest of the payload is malformed, so that write is
 * done first and independently.
 */

// --------------------------------------------
// Signature verification
// --------------------------------------------

/**
 * Verify Meta's X-Hub-Signature-256 over the RAW request body.
 *
 * Must be the raw bytes: re-serialising the parsed JSON changes key order and
 * whitespace, and the signature will never match. Comparison is timing-safe.
 */
export function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
    if (!signatureHeader?.startsWith('sha256=')) return false;

    const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
    const received = signatureHeader.slice('sha256='.length);

    if (expected.length !== received.length) return false;

    try {
        return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
    } catch {
        return false;
    }
}

// --------------------------------------------
// Status transitions
// --------------------------------------------

/**
 * Rank of each status, so an out-of-order webhook cannot move a message
 * backwards. `read` outranks `delivered`; a late `delivered` after a `read` is
 * recorded as a timestamp but does not downgrade the status.
 */
const STATUS_RANK: Record<string, number> = {
    queued: 0, sending: 1, sent: 2, delivered: 3, read: 4,
    failed: 5, skipped: 5, cancelled: 5,
};

type StatusPayload = {
    id?: string;
    status?: string;
    timestamp?: string;
    recipient_id?: string;
    errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
    conversation?: { id?: string };
    pricing?: { category?: string };
};

export async function handleStatus(status: StatusPayload): Promise<'updated' | 'unknown' | 'ignored'> {
    const wamid = status.id;
    if (!wamid || !status.status) return 'ignored';

    const incoming = status.status.toLowerCase();
    const at = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();

    const message = await db.query.waMessages.findFirst({
        where: eq(waMessages.wamid, wamid),
        columns: { id: true, status: true, contactId: true, campaignId: true },
    });

    // A status for a message we never sent — most likely from another system on
    // the same number. Recorded as an event, but nothing to update.
    if (!message) return 'unknown';

    const patch: Record<string, unknown> = {};

    // Timestamps are always recorded, even when the status does not advance:
    // a late `delivered` after a `read` still tells us when delivery happened.
    if (incoming === 'sent') patch.sentAt = at;
    if (incoming === 'delivered') patch.deliveredAt = at;
    if (incoming === 'read') patch.readAt = at;
    if (incoming === 'failed') {
        patch.failedAt = at;
        const error = status.errors?.[0];
        if (error) {
            patch.errorCode = error.code ?? null;
            patch.errorDetail = error.error_data?.details || error.message || error.title || 'Failed at Meta';
        }
    }

    if (status.conversation?.id) patch.conversationId = status.conversation.id;
    if (status.pricing?.category) patch.pricingCategory = status.pricing.category;

    // Only advance the status itself.
    const currentRank = STATUS_RANK[message.status] ?? 0;
    const incomingRank = STATUS_RANK[incoming] ?? -1;
    if (incomingRank > currentRank) {
        patch.status = incoming;
    }

    if (!Object.keys(patch).length) return 'ignored';

    await db.update(waMessages).set(patch).where(eq(waMessages.id, message.id));
    return 'updated';
}

// --------------------------------------------
// Inbound messages
// --------------------------------------------

type InboundPayload = {
    id?: string;
    from?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
    button?: { text?: string; payload?: string };
    interactive?: {
        button_reply?: { title?: string; id?: string };
        list_reply?: { title?: string; id?: string };
    };
    image?: { id?: string; mime_type?: string; caption?: string };
    document?: { id?: string; mime_type?: string; filename?: string };
};

function extractBody(message: InboundPayload): { body: string; type: string; buttonText?: string } {
    if (message.type === 'text') return { body: message.text?.body ?? '', type: 'text' };

    if (message.type === 'button') {
        const text = message.button?.text ?? '';
        return { body: text, type: 'button', buttonText: text };
    }

    if (message.type === 'interactive') {
        const text = message.interactive?.button_reply?.title
            ?? message.interactive?.list_reply?.title
            ?? '';
        return { body: text, type: 'button', buttonText: text };
    }

    if (message.type === 'image') return { body: message.image?.caption ?? '[image]', type: 'image' };
    if (message.type === 'document') return { body: message.document?.filename ?? '[document]', type: 'document' };

    return { body: `[${message.type ?? 'unsupported'}]`, type: 'text' };
}

export async function handleInbound(inbound: InboundPayload): Promise<'processed' | 'ignored'> {
    if (!inbound.from || !inbound.id) return 'ignored';

    const normalized = normalizePhone(`+${inbound.from.replace(/^\+/, '')}`);
    const phone = normalized.ok ? normalized.e164 : `+${inbound.from.replace(/^\+/, '')}`;
    const at = inbound.timestamp ? new Date(Number(inbound.timestamp) * 1000) : new Date();
    const { body, type, buttonText } = extractBody(inbound);

    // An inbound message from an unknown number still has to be captured — it is
    // a guest talking to the hotel. Created as `pending`: writing to us is not
    // marketing consent.
    let contact = await db.query.waContacts.findFirst({
        where: eq(waContacts.phone, phone),
        columns: { id: true, consentStatus: true },
    });

    if (!contact) {
        const [created] = await db
            .insert(waContacts)
            .values({
                phone,
                source: 'inbound',
                consentStatus: 'pending',
                provenanceNote: 'Created automatically from an inbound WhatsApp message',
                lastInboundAt: at,
            })
            .onConflictDoNothing({ target: waContacts.phone })
            .returning({ id: waContacts.id, consentStatus: waContacts.consentStatus });

        contact = created ?? await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, phone),
            columns: { id: true, consentStatus: true },
        });
    }

    if (!contact) return 'ignored';

    // --- Consent first, before anything that could fail. ---
    const wantsOut = isOptOutButton(buttonText) || detectStopIntent(body);
    const wantsIn = isOptInButton(buttonText);

    if (wantsOut && contact.consentStatus !== 'opted_out' && contact.consentStatus !== 'suppressed') {
        await recordConsentChange({
            contactId: contact.id,
            toStatus: 'opted_out',
            reason: `Guest replied: "${body.slice(0, 200)}"`,
            source: isOptOutButton(buttonText) ? 'opt-out button' : 'STOP reply',
            optOutMethod: isOptOutButton(buttonText) ? 'button' : 'stop_reply',
        });
    } else if (wantsIn && contact.consentStatus === 'pending') {
        // The affirmative reply to the re-permission ask. This is the only path
        // that grants marketing consent without a human recording it.
        await recordConsentChange({
            contactId: contact.id,
            toStatus: 'opted_in',
            reason: `Guest replied "${body.slice(0, 200)}" to the re-permission message`,
            source: 'WhatsApp opt-in reply',
        });
    }

    // --- Thread + message ---
    const windowExpiresAt = new Date(at.getTime() + SERVICE_WINDOW_MS);

    // Step 1: make sure a thread row exists, and nothing more. None of the
    // "the guest just said something" effects belong here, because at this point
    // we still do not know whether this delivery is the guest or Meta repeating
    // itself. That is settled by the message insert below.
    const [thread] = await db
        .insert(waInboxThreads)
        .values({
            contactId: contact.id,
            status: 'open',
            windowExpiresAt,
            lastMessageAt: at,
            lastInboundAt: at,
            unreadCount: 0,
        })
        .onConflictDoUpdate({
            target: waInboxThreads.contactId,
            set: { updatedAt: new Date() },
        })
        .returning({ id: waInboxThreads.id });

    if (!thread) return 'ignored';

    // Step 2: the message insert is the idempotency gate. `returning()` comes
    // back empty when the conflict clause swallowed the row, and that is the
    // only reliable signal that Meta is re-delivering something we already have.
    const inserted = await db
        .insert(waInboxMessages)
        .values({
            threadId: thread.id,
            direction: 'inbound',
            type,
            body,
            mediaMimeType: inbound.image?.mime_type ?? inbound.document?.mime_type,
            wamid: inbound.id,
            status: 'delivered',
            createdAt: at,
        })
        // Meta retries: the same wamid must not create a duplicate.
        .onConflictDoNothing({ target: waInboxMessages.wamid })
        .returning({ id: waInboxMessages.id });

    // A replay: the thread already reflects this message. Returning early is what
    // keeps the unread badge honest — incrementing it inside the upsert above
    // reads as equivalent and is not, because it counts Meta's retries as guest
    // messages and the badge then drifts upward and never comes back down.
    if (inserted.length === 0) return 'processed';

    // Step 3: genuinely new. Now the activity effects are safe to apply.
    await db
        .update(waInboxThreads)
        .set({
            // An inbound message reopens a resolved thread — the guest is still
            // talking, whatever an operator marked earlier.
            status: 'open',
            windowExpiresAt,
            lastMessageAt: at,
            lastInboundAt: at,
            unreadCount: sql`COALESCE(${waInboxThreads.unreadCount}, 0) + 1`,
            updatedAt: new Date(),
        })
        .where(eq(waInboxThreads.id, thread.id));

    await db
        .update(waContacts)
        .set({ lastInboundAt: at, updatedAt: new Date() })
        .where(eq(waContacts.id, contact.id));

    return 'processed';
}

// --------------------------------------------
// Template status updates
// --------------------------------------------

type TemplateUpdatePayload = {
    message_template_id?: string | number;
    message_template_name?: string;
    message_template_language?: string;
    event?: string;
    reason?: string;
};

function mapTemplateEvent(event: string): 'approved' | 'rejected' | 'paused' | 'disabled' | 'pending_meta' | null {
    switch (event.toUpperCase()) {
        case 'APPROVED': return 'approved';
        case 'REJECTED': return 'rejected';
        case 'PAUSED': return 'paused';
        case 'DISABLED': return 'disabled';
        case 'PENDING': case 'IN_APPEAL': return 'pending_meta';
        default: return null;
    }
}

export async function handleTemplateUpdate(update: TemplateUpdatePayload): Promise<'updated' | 'ignored'> {
    const name = update.message_template_name;
    const event = update.event;
    if (!name || !event) return 'ignored';

    const status = mapTemplateEvent(event);
    if (!status) return 'ignored';

    const template = await db.query.waTemplates.findFirst({
        where: eq(waTemplates.name, name),
        columns: { id: true },
    });
    if (!template) return 'ignored';

    await db
        .update(waTemplates)
        .set({
            status,
            // `reason` is only meaningful for a rejection; clearing it otherwise
            // stops a stale rejection message lingering on an approved template.
            rejectionReason: status === 'rejected' ? (update.reason ?? 'No reason supplied') : null,
            syncedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(waTemplates.id, template.id));

    return 'updated';
}

// --------------------------------------------
// Entry point
// --------------------------------------------

export type WebhookResult = {
    statuses: number;
    inbound: number;
    templateUpdates: number;
    unknown: number;
    errors: string[];
};

type WebhookBody = {
    object?: string;
    entry?: {
        id?: string;
        changes?: {
            field?: string;
            value?: {
                statuses?: StatusPayload[];
                messages?: InboundPayload[];
                message_template_id?: string | number;
                message_template_name?: string;
                event?: string;
                reason?: string;
            };
        }[];
    }[];
};

/**
 * Process one webhook delivery.
 *
 * Each item is handled independently and failures are collected rather than
 * thrown: one malformed status must not cost us the inbound STOP sitting next to
 * it in the same payload. The route always answers 200 regardless, because a
 * non-200 makes Meta retry the whole batch — including the parts that succeeded.
 */
export async function processWebhook(body: WebhookBody): Promise<WebhookResult> {
    const result: WebhookResult = { statuses: 0, inbound: 0, templateUpdates: 0, unknown: 0, errors: [] };

    for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
            const value = change.value ?? {};

            for (const status of value.statuses ?? []) {
                try {
                    const outcome = await handleStatus(status);
                    if (outcome === 'updated') result.statuses += 1;
                    else if (outcome === 'unknown') result.unknown += 1;
                } catch (error) {
                    result.errors.push(`status ${status.id}: ${error instanceof Error ? error.message : 'failed'}`);
                }
            }

            for (const message of value.messages ?? []) {
                try {
                    if ((await handleInbound(message)) === 'processed') result.inbound += 1;
                } catch (error) {
                    result.errors.push(`inbound ${message.id}: ${error instanceof Error ? error.message : 'failed'}`);
                }
            }

            if (change.field === 'message_template_status_update' || value.message_template_name) {
                try {
                    if ((await handleTemplateUpdate(value)) === 'updated') result.templateUpdates += 1;
                } catch (error) {
                    result.errors.push(`template: ${error instanceof Error ? error.message : 'failed'}`);
                }
            }
        }
    }

    return result;
}

/** Append-only record of the raw payload, for debugging and replay. */
export async function recordEvent(
    eventType: string,
    payload: Record<string, unknown>,
    outcome?: { processed: boolean; error?: string },
): Promise<void> {
    try {
        await db.insert(waEvents).values({
            eventType,
            payload,
            processed: outcome?.processed ?? false,
            processingError: outcome?.error,
        });
    } catch (error) {
        // Never let the audit trail's own failure drop a real webhook.
        console.error('[whatsapp/webhook] could not record event', error);
    }
}
