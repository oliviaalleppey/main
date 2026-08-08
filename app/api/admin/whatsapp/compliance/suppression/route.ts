import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { addSuppression, removeSuppression } from '@/lib/services/whatsapp/compliance';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
    phone: z.string().min(3),
    reason: z.string().min(1).max(500),
});

export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'compliance.erase');
        const body = addSchema.parse(await request.json());

        const entry = await addSuppression(body.phone, body.reason, actor.id);

        await audit({
            actor,
            action: 'whatsapp.suppression.added',
            entityType: 'wa_suppression',
            entityId: entry?.id,
            after: { phone: body.phone, reason: body.reason },
        });

        return NextResponse.json({ entry, alreadyPresent: entry === null });
    } catch (error) {
        return errorResponse(error);
    }
}

const removeSchema = z.object({
    phone: z.string().min(3),
    /** Typed confirmation: this makes a do-not-contact number contactable again. */
    confirm: z.literal('REMOVE'),
});

/**
 * DELETE — take a number off the suppression list.
 *
 * The most dangerous button in the module: suppression is what stops an opt-out
 * being resurrected by the next CSV import, so removing an entry undoes someone's
 * withdrawal of consent. Confirmed explicitly and audited loudly.
 */
export async function DELETE(request: Request) {
    try {
        const actor = await requireCapability(request, 'compliance.erase');
        const body = removeSchema.parse(await request.json());

        await removeSuppression(body.phone);

        await audit({
            actor,
            action: 'whatsapp.suppression.removed',
            entityType: 'wa_suppression',
            before: { phone: body.phone, suppressed: true },
            after: { suppressed: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
