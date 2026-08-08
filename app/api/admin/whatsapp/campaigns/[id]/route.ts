import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waCampaigns, waTemplates, waAudiences, waMessages, waContacts } from '@/lib/db/schema';
import { desc, eq, sql, type SQL } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { refreshCampaignCounters } from '@/lib/services/whatsapp/campaigns';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const RECIPIENT_PAGE = 100;

/**
 * GET — campaign detail plus a page of the per-recipient table.
 *
 * Counters are recomputed before returning, so the totals on screen always agree
 * with the rows underneath them. The optimistic counters the dispatcher keeps are
 * for speed, not for display.
 */
export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'campaigns.read');
        const { id } = await params;
        const url = new URL(request.url);
        const statusFilter = url.searchParams.get('status');
        const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

        const [row] = await db
            .select({
                campaign: waCampaigns,
                template: {
                    id: waTemplates.id,
                    name: waTemplates.name,
                    category: waTemplates.category,
                    status: waTemplates.status,
                    bodyText: waTemplates.bodyText,
                    headerType: waTemplates.headerType,
                    headerText: waTemplates.headerText,
                    footerText: waTemplates.footerText,
                    buttons: waTemplates.buttons,
                    variableCount: waTemplates.variableCount,
                },
                audience: { id: waAudiences.id, name: waAudiences.name, type: waAudiences.type },
            })
            .from(waCampaigns)
            .leftJoin(waTemplates, eq(waCampaigns.templateId, waTemplates.id))
            .leftJoin(waAudiences, eq(waCampaigns.audienceId, waAudiences.id))
            .where(eq(waCampaigns.id, id))
            .limit(1);

        if (!row) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Only worth recomputing once the queue exists.
        if (row.campaign.status !== 'draft') {
            await refreshCampaignCounters(id);
        }

        const clauses: SQL[] = [eq(waMessages.campaignId, id)];
        if (statusFilter) {
            clauses.push(sql`${waMessages.status}::text = ${statusFilter}`);
        }
        const where = clauses.length > 1 ? sql`${clauses[0]} AND ${clauses[1]}` : clauses[0];

        const [recipients, countRows, statusRows, campaign] = await Promise.all([
            db
                .select({
                    id: waMessages.id,
                    status: waMessages.status,
                    errorCode: waMessages.errorCode,
                    errorDetail: waMessages.errorDetail,
                    skipReason: waMessages.skipReason,
                    attempts: waMessages.attempts,
                    cost: waMessages.cost,
                    queuedAt: waMessages.queuedAt,
                    sentAt: waMessages.sentAt,
                    deliveredAt: waMessages.deliveredAt,
                    readAt: waMessages.readAt,
                    failedAt: waMessages.failedAt,
                    contactId: waContacts.id,
                    phone: waContacts.phone,
                    name: waContacts.name,
                })
                .from(waMessages)
                .innerJoin(waContacts, eq(waMessages.contactId, waContacts.id))
                .where(where)
                .orderBy(desc(waMessages.queuedAt))
                .limit(RECIPIENT_PAGE)
                .offset((page - 1) * RECIPIENT_PAGE),
            db.select({ count: sql<number>`count(*)` }).from(waMessages).where(where),
            db
                .select({ status: sql<string>`${waMessages.status}::text`, count: sql<number>`count(*)` })
                .from(waMessages)
                .where(eq(waMessages.campaignId, id))
                .groupBy(sql`${waMessages.status}::text`),
            db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, id) }),
        ]);

        const total = Number(countRows[0]?.count ?? 0);

        return NextResponse.json({
            campaign: campaign ?? row.campaign,
            template: row.template,
            audience: row.audience,
            recipients,
            recipientStatusCounts: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)])),
            pagination: { page, pageSize: RECIPIENT_PAGE, total, pages: Math.ceil(total / RECIPIENT_PAGE) },
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/** DELETE — drafts only. A campaign that has queued anything is a permanent record. */
export async function DELETE(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'campaigns.create');
        const { id } = await params;

        const campaign = await db.query.waCampaigns.findFirst({ where: eq(waCampaigns.id, id) });
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        if (campaign.status !== 'draft' && campaign.status !== 'pending_approval') {
            return NextResponse.json(
                { error: `A ${campaign.status} campaign cannot be deleted — its message history is the audit record of what was sent.` },
                { status: 400 },
            );
        }

        await db.delete(waCampaigns).where(eq(waCampaigns.id, id));

        await audit({
            actor,
            action: 'whatsapp.campaign.deleted',
            entityType: 'wa_campaigns',
            entityId: id,
            before: { name: campaign.name, status: campaign.status },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
