import { NextResponse } from 'next/server';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { syncTemplates } from '@/lib/services/whatsapp/templates';
import { resolveProviderName } from '@/lib/services/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * POST — pull every template from Meta into the local mirror.
 *
 * Remote state wins. Meta can pause, reject or reclassify a template without
 * telling anyone who is watching the panel, so a sync must be able to move a
 * template *backwards* out of `approved`.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'templates.write');

        const result = await syncTemplates();

        await audit({
            actor,
            action: 'whatsapp.templates.synced',
            entityType: 'wa_templates',
            after: { ...result, provider: resolveProviderName() },
        });

        return NextResponse.json({ success: true, ...result, provider: resolveProviderName() });
    } catch (error) {
        return errorResponse(error);
    }
}
