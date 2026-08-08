import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { listCannedReplies, createCannedReply } from '@/lib/services/whatsapp/inbox';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await requireCapability(request, 'inbox.read');
        const url = new URL(request.url);
        const replies = await listCannedReplies(url.searchParams.get('all') === '1');
        return NextResponse.json({ replies });
    } catch (error) {
        return errorResponse(error);
    }
}

const createSchema = z.object({
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(4096),
    category: z.string().max(100).optional(),
    sortOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'settings.write');
        const input = createSchema.parse(await request.json());

        const reply = await createCannedReply(input);
        await audit({
            actor,
            action: 'whatsapp.canned_reply.created',
            entityType: 'wa_canned_replies',
            entityId: reply?.id,
            after: { title: input.title },
        });

        return NextResponse.json({ reply }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
