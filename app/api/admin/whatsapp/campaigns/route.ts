import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waCampaigns, waTemplates, waAudiences } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { getSettings } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

/** GET — campaign list with the template and audience names joined in. */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'campaigns.read');

        const rows = await db
            .select({
                campaign: waCampaigns,
                templateName: waTemplates.name,
                templateCategory: waTemplates.category,
                audienceName: waAudiences.name,
            })
            .from(waCampaigns)
            .leftJoin(waTemplates, eq(waCampaigns.templateId, waTemplates.id))
            .leftJoin(waAudiences, eq(waCampaigns.audienceId, waAudiences.id))
            .orderBy(desc(waCampaigns.createdAt));

        const statusRows = await db
            .select({ status: sql<string>`${waCampaigns.status}::text`, count: sql<number>`count(*)` })
            .from(waCampaigns)
            .groupBy(sql`${waCampaigns.status}::text`);

        return NextResponse.json({
            campaigns: rows,
            statusCounts: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)])),
        });
    } catch (error) {
        return errorResponse(error);
    }
}

const createSchema = z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional(),
    templateId: z.string().uuid(),
    audienceId: z.string().uuid(),
    staticVariables: z.record(z.string(), z.string()).default({}),
    dailyCap: z.number().int().min(1).optional(),
    throttlePerMin: z.number().int().min(1).max(600).optional(),
    scheduledAt: z.string().datetime().optional(),
});

/**
 * POST — create a campaign as a draft.
 *
 * Creating never queues or sends anything; that is /launch. Splitting them is
 * what makes the wizard's review step meaningful — the campaign exists and can
 * be inspected before a single message is committed to the queue.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'campaigns.create');
        const body = createSchema.parse(await request.json());
        const settings = await getSettings();

        const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, body.templateId) });
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        if (template.status !== 'approved') {
            return NextResponse.json(
                { error: `Template "${template.name}" is ${template.status}. Only approved templates can be sent.` },
                { status: 400 },
            );
        }

        // An unmapped variable would render as a fallback for every recipient,
        // which is a silent quality problem rather than a loud failure — so it is
        // refused at creation instead.
        const variableMap = (template.variableMap ?? {}) as Record<string, string>;
        const unmapped: string[] = [];
        for (let n = 1; n <= (template.variableCount ?? 0); n++) {
            const key = String(n);
            if (!variableMap[key] && !body.staticVariables[key]) unmapped.push(`{{${key}}}`);
        }
        if (unmapped.length) {
            return NextResponse.json(
                { error: `These template variables have no data source: ${unmapped.join(', ')}. Map them on the template, or set a fixed value for this campaign.` },
                { status: 400 },
            );
        }

        const audience = await db.query.waAudiences.findFirst({ where: eq(waAudiences.id, body.audienceId) });
        if (!audience) {
            return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
        }

        const [campaign] = await db
            .insert(waCampaigns)
            .values({
                name: body.name,
                description: body.description,
                templateId: body.templateId,
                audienceId: body.audienceId,
                status: 'draft',
                staticVariables: body.staticVariables,
                dailyCap: body.dailyCap ?? settings.dailyCap,
                throttlePerMin: body.throttlePerMin ?? settings.throttlePerMin,
                scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
                createdBy: actor.id,
            })
            .returning();

        await audit({
            actor,
            action: 'whatsapp.campaign.created',
            entityType: 'wa_campaigns',
            entityId: campaign.id,
            after: { name: campaign.name, templateId: body.templateId, audienceId: body.audienceId },
        });

        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
