import { NextResponse } from 'next/server';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { listThreads, unreadTotal } from '@/lib/services/whatsapp/inbox';
import { phoneMaskerFor } from '@/lib/services/whatsapp/phone';

export const dynamic = 'force-dynamic';

/** GET — the conversation list. Unread first, then most recent. */
export async function GET(request: Request) {
    try {
        const actor = await requireCapability(request, 'inbox.read');
        const mask = phoneMaskerFor(actor.role);

        const url = new URL(request.url);
        const statusParam = url.searchParams.get('status');
        const status = statusParam === 'resolved' || statusParam === 'all' ? statusParam : 'open';

        const { total, threads } = await listThreads({
            status,
            unreadOnly: url.searchParams.get('unread') === '1',
            assignedTo: url.searchParams.get('assignedTo') ?? undefined,
            label: url.searchParams.get('label') ?? undefined,
            search: url.searchParams.get('q') ?? undefined,
            limit: Number(url.searchParams.get('limit')) || 50,
            offset: Number(url.searchParams.get('offset')) || 0,
        });

        return NextResponse.json({
            total,
            threads: threads.map((t) => ({ ...t, contact: { ...t.contact, phone: mask(t.contact.phone) } })),
            unreadTotal: await unreadTotal(),
        });
    } catch (error) {
        return errorResponse(error);
    }
}
