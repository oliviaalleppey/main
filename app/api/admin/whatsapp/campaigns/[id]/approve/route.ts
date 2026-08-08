import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waCampaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — second-admin approval for a campaign above the threshold.
 *
 * Records who approved and when. /start is where the "must be a different
 * person" check happens, because that is the moment the recipient count is
 * actually known.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'campaigns.approve');
        const { id } = await params;

        const campaign = await db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, id) });
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (campaign.status === 'sending' || campaign.status === 'completed') {
            return NextResponse.json(
                { error: `This campaign is already ${campaign.status}.` },
                { status: 400 },
            );
        }

        await db
            .update(waCampaigns)
            .set({ approvedBy: actor.id, updatedAt: new Date() })
            .where(eq(waCampaigns.id, id));

        await audit({
            actor,
            action: 'whatsapp.campaign.approved',
            entityType: 'wa_campaigns',
            entityId: id,
            before: { approvedBy: campaign.approvedBy, status: campaign.status },
            after: { approvedBy: actor.id, approverEmail: actor.email },
        });

        return NextResponse.json({ success: true, approvedBy: actor.email });
    } catch (error) {
        return errorResponse(error);
    }
}
