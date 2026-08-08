import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { dataSubjectExport, dataSubjectErase } from '@/lib/services/whatsapp/compliance';

export const dynamic = 'force-dynamic';

/**
 * GET — the data subject access request tool.
 *
 * Looking someone up is itself worth auditing: this returns every message a guest
 * ever received, and "who read this guest's conversation" is a fair question.
 */
export async function GET(request: Request) {
    try {
        const actor = await requireCapability(request, 'compliance.read');
        const url = new URL(request.url);
        const phone = url.searchParams.get('phone');

        if (!phone?.trim()) {
            return NextResponse.json({ error: 'A phone number is required' }, { status: 400 });
        }

        const result = await dataSubjectExport(phone);

        await audit({
            actor,
            action: 'whatsapp.dsr.exported',
            entityType: 'wa_contacts',
            entityId: result.contact?.id as string | undefined,
            after: { phone: result.phone, found: result.found },
        });

        return NextResponse.json(result);
    } catch (error) {
        return errorResponse(error);
    }
}

const eraseSchema = z.object({
    phone: z.string().min(3),
    reason: z.string().max(500).optional(),
    /** Typed confirmation, so an erasure cannot be a mis-click. */
    confirm: z.literal('ERASE'),
});

/**
 * POST — erasure.
 *
 * Irreversible, so it demands an explicit `confirm: "ERASE"` in the body rather
 * than relying on the UI having asked. The suppression tombstone is written by
 * the service in the same transaction as the delete.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'compliance.erase');
        const body = eraseSchema.parse(await request.json());

        const result = await dataSubjectErase(body.phone, actor, body.reason);

        await audit({
            actor,
            action: 'whatsapp.dsr.erased',
            entityType: 'wa_contacts',
            // The number is recorded deliberately: an erasure that does not say
            // which number was erased is an erasure nobody can verify happened.
            before: { phone: result.phone },
            after: { ...result.removed, suppressed: true, reason: body.reason },
        });

        return NextResponse.json(result);
    } catch (error) {
        return errorResponse(error);
    }
}
