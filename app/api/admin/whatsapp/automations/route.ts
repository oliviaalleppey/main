import { NextResponse } from 'next/server';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { listAutomations } from '@/lib/services/whatsapp/automations';
import { listSendableTemplates } from '@/lib/services/whatsapp/templates';

export const dynamic = 'force-dynamic';

/** GET — every automation with its chosen template, plus the pickable templates. */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'automations.read');

        const [automations, templates] = await Promise.all([
            listAutomations(),
            listSendableTemplates(),
        ]);

        return NextResponse.json({ automations, templates });
    } catch (error) {
        return errorResponse(error);
    }
}
