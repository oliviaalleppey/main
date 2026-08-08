import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    getThread, markRead, setThreadStatus, assignThread, setLabels, setInternalNotes,
} from '@/lib/services/whatsapp/inbox';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * GET — one conversation, with its full transcript and the current window state.
 *
 * Opening a thread marks it read. That is a side effect on a GET, which is
 * normally worth avoiding, but it matches what every inbox does and the
 * alternative (a second round trip from the client on mount) is worse.
 */
export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'inbox.read');
        const { id } = await params;

        const thread = await getThread(id);
        if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

        // Reported back so the conversation list can drop the badge immediately
        // instead of carrying a stale count until its next poll.
        const markedRead = (thread.unreadCount ?? 0) > 0;
        if (markedRead) await markRead(id);

        return NextResponse.json({ thread: { ...thread, unreadCount: 0 }, markedRead });
    } catch (error) {
        return errorResponse(error);
    }
}

const patchSchema = z.object({
    status: z.enum(['open', 'resolved']).optional(),
    assignedTo: z.string().uuid().nullish(),
    labels: z.array(z.string().max(50)).max(10).optional(),
    internalNotes: z.string().max(5000).optional(),
    markRead: z.boolean().optional(),
});

/** PATCH — resolve/reopen, assign, label, annotate. */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'inbox.reply');
        const { id } = await params;
        const body = patchSchema.parse(await request.json());

        const before = await getThread(id);
        if (!before) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

        if (body.status && body.status !== before.status) {
            await setThreadStatus(id, body.status);
            await audit({
                actor,
                action: `whatsapp.inbox.${body.status === 'resolved' ? 'resolved' : 'reopened'}`,
                entityType: 'wa_inbox_threads',
                entityId: id,
                before: { status: before.status },
                after: { status: body.status },
            });
        }

        if (body.assignedTo !== undefined) {
            await assignThread(id, body.assignedTo ?? null);
            await audit({
                actor,
                action: 'whatsapp.inbox.assigned',
                entityType: 'wa_inbox_threads',
                entityId: id,
                before: { assignedTo: before.assignedTo },
                after: { assignedTo: body.assignedTo ?? null },
            });
        }

        if (body.labels) await setLabels(id, body.labels);
        // Internal notes are staff-only and never leave our database, but they are
        // still a record about a guest, so the edit is audited like any other.
        if (body.internalNotes !== undefined) {
            await setInternalNotes(id, body.internalNotes);
            await audit({
                actor,
                action: 'whatsapp.inbox.notes_updated',
                entityType: 'wa_inbox_threads',
                entityId: id,
            });
        }
        if (body.markRead) await markRead(id);

        return NextResponse.json({ thread: await getThread(id) });
    } catch (error) {
        return errorResponse(error);
    }
}
