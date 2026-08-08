import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waCampaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { haltCampaign } from '@/lib/services/whatsapp/campaigns';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
    reason: z.string().trim().min(1, 'A reason is required when halting a campaign').max(500),
});

/**
 * POST — halt a campaign permanently.
 *
 * Irreversible: every queued message is cancelled, so there is no queue left to
 * resume. Anything already sent stays sent — this stops the remainder, it does
 * not unsend.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'campaigns.send');
        const { id } = await params;
        const body = schema.parse(await request.json());

        const campaign = await db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, id) });
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (campaign.status === 'completed' || campaign.status === 'halted') {
            return NextResponse.json(
                { error: `This campaign is already ${campaign.status}.` },
                { status: 400 },
            );
        }

        const cancelled = await haltCampaign(id, body.reason);

        await audit({
            actor,
            action: 'whatsapp.campaign.halted',
            entityType: 'wa_campaigns',
            entityId: id,
            before: { status: campaign.status, sent: campaign.sentCount },
            after: { status: 'halted', reason: body.reason, cancelled },
        });

        return NextResponse.json({ success: true, cancelled });
    } catch (error) {
        return errorResponse(error);
    }
}
