import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { updateCannedReply, deleteCannedReply } from '@/lib/services/whatsapp/inbox';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    body: z.string().min(1).max(4096).optional(),
    category: z.string().max(100).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'settings.write');
        const { id } = await params;
        const patch = patchSchema.parse(await request.json());

        const reply = await updateCannedReply(id, patch);
        if (!reply) return NextResponse.json({ error: 'Canned reply not found' }, { status: 404 });

        await audit({
            actor,
            action: 'whatsapp.canned_reply.updated',
            entityType: 'wa_canned_replies',
            entityId: id,
            after: patch,
        });

        return NextResponse.json({ reply });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'settings.write');
        const { id } = await params;

        await deleteCannedReply(id);
        await audit({
            actor,
            action: 'whatsapp.canned_reply.deleted',
            entityType: 'wa_canned_replies',
            entityId: id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
