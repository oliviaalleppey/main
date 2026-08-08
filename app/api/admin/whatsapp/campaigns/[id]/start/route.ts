import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waCampaigns, waTemplates, adminUsers } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { buildCampaignQueue } from '@/lib/services/whatsapp/campaigns';
import { getSettings } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
    /** The user must retype the campaign name. Deliberate friction on the spend button. */
    confirmName: z.string(),
});

/**
 * POST — build the queue and start sending.
 *
 * The two-person rule: above `approvalThreshold` recipients a second admin must
 * have approved before this will start. It is enforced adaptively, because roles
 * are still one binary `admin` gate:
 *
 *   - more than one admin account exists -> the approver must be someone else
 *   - exactly one admin account exists    -> self-approval is allowed, and the
 *     audit entry records it as self-approved
 *
 * A hard requirement for a second person would make the module unusable for a
 * hotel running a single admin login, which is the likely situation here. Making
 * it adaptive keeps the control real where it can be, and honest where it can't.
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

        if (body.confirmName.trim() !== campaign.name.trim()) {
            return NextResponse.json(
                { error: 'The typed name does not match the campaign name.' },
                { status: 400 },
            );
        }

        if (!['draft', 'pending_approval', 'scheduled', 'paused'].includes(campaign.status)) {
            return NextResponse.json(
                { error: `A ${campaign.status} campaign cannot be started.` },
                { status: 400 },
            );
        }

        const settings = await getSettings();

        if (!settings.enabled) {
            return NextResponse.json(
                { error: 'WhatsApp sending is switched off. Turn the kill switch back on before starting a campaign.' },
                { status: 400 },
            );
        }

        // Re-check the template at launch: Meta can pause or reject it between
        // the campaign being built and someone pressing start.
        if (campaign.templateId) {
            const template = await db.query.waTemplates.findFirst({
                where: eq(waTemplates.id, campaign.templateId),
                columns: { name: true, status: true },
            });
            if (!template || template.status !== 'approved') {
                return NextResponse.json(
                    { error: `Template "${template?.name ?? 'unknown'}" is ${template?.status ?? 'missing'} — it cannot be sent.` },
                    { status: 400 },
                );
            }
        }

        // Resuming a paused campaign keeps its existing queue.
        const isResume = campaign.status === 'paused';
        const build = isResume
            ? { queued: campaign.queuedCount ?? 0, skipped: 0, total: campaign.totalCount ?? 0 }
            : await buildCampaignQueue(id);

        if (!isResume && build.queued === 0) {
            return NextResponse.json(
                { error: 'Nobody in this audience is eligible to receive this message, so there is nothing to send.' },
                { status: 400 },
            );
        }

        const threshold = settings.approvalThreshold ?? 1000;
        let selfApproved = false;

        if (build.queued > threshold && !isResume) {
            // Only active admins count — a deactivated second account must not be
            // what makes the two-person rule look satisfied.
            const [{ count } = { count: 0 }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(adminUsers)
                .where(and(eq(adminUsers.isActive, true), eq(adminUsers.role, 'admin')));
            const adminCount = Number(count);

            if (!campaign.approvedBy) {
                await db
                    .update(waCampaigns)
                    .set({ status: 'pending_approval', updatedAt: new Date() })
                    .where(eq(waCampaigns.id, id));

                return NextResponse.json(
                    {
                        error: `${build.queued.toLocaleString('en-IN')} recipients is above the ${threshold.toLocaleString('en-IN')} approval threshold. A second admin must approve this campaign before it can start.`,
                        requiresApproval: true,
                        queued: build.queued,
                    },
                    { status: 409 },
                );
            }

            if (campaign.approvedBy === actor.id) {
                if (adminCount > 1) {
                    return NextResponse.json(
                        { error: 'This campaign was approved by you. Above the approval threshold it must be approved by a different admin.' },
                        { status: 403 },
                    );
                }
                selfApproved = true;
            }
        }

        // A campaign scheduled for later is queued but not yet sending: the queue
        // is built now (so the recipient list is fixed and reviewable), and the
        // dispatcher leaves it alone until scheduledAt passes.
        const scheduledForLater = !!campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date();
        const nextStatus = scheduledForLater ? 'scheduled' : 'sending';

        await db
            .update(waCampaigns)
            .set({
                status: nextStatus,
                startedAt: scheduledForLater ? campaign.startedAt : (campaign.startedAt ?? new Date()),
                haltReason: null,
                updatedAt: new Date(),
            })
            .where(eq(waCampaigns.id, id));

        await audit({
            actor,
            action: isResume ? 'whatsapp.campaign.resumed' : 'whatsapp.campaign.started',
            entityType: 'wa_campaigns',
            entityId: id,
            before: { status: campaign.status },
            after: {
                status: nextStatus,
                queued: build.queued,
                estimatedCost: campaign.estimatedCost,
                selfApproved,
                aboveThreshold: build.queued > threshold,
            },
        });

        return NextResponse.json({
            success: true,
            ...build,
            selfApproved,
            status: nextStatus,
            message: isResume
                ? 'Campaign resumed. Sending continues on the next dispatch run.'
                : scheduledForLater
                    ? `${build.queued.toLocaleString('en-IN')} messages queued. Sending starts at ${new Date(campaign.scheduledAt!).toLocaleString('en-IN')}.`
                    : `${build.queued.toLocaleString('en-IN')} messages queued. Sending begins on the next dispatch run.`,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
