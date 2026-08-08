import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waCampaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { refreshCampaignCounters } from '@/lib/services/whatsapp/campaigns';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — pause a sending campaign.
 *
 * Reversible: the queue is left intact and the dispatcher simply stops claiming
 * from it, so /start resumes exactly where it stopped. Halt is the irreversible
 * one.
 *
 * Never gated behind a confirmation — an operator stopping a campaign that is
 * going wrong must not be slowed down by a dialog.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'campaigns.send');
        const { id } = await params;

        const campaign = await db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, id) });
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (campaign.status !== 'sending' && campaign.status !== 'scheduled') {
            return NextResponse.json(
                { error: `A ${campaign.status} campaign is not running, so it cannot be paused.` },
                { status: 400 },
            );
        }

        await db
            .update(waCampaigns)
            .set({ status: 'paused', updatedAt: new Date() })
            .where(eq(waCampaigns.id, id));

        await refreshCampaignCounters(id);

        await audit({
            actor,
            action: 'whatsapp.campaign.paused',
            entityType: 'wa_campaigns',
            entityId: id,
            before: { status: campaign.status },
            after: { status: 'paused' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
