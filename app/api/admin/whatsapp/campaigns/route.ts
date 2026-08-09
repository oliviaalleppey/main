import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waCampaigns, waTemplates, waAudiences, offers } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { getSettings } from '@/lib/services/whatsapp/settings';
import { normalizeCode, hotelToday } from '@/lib/services/offers';

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

    // Where the tracked button sends the guest. Constrained to a site-relative
    // path at the edge as well as in buildDestination(), so a stored value can
    // never become an off-site redirect even if the redirect guard is later
    // refactored. A single leading slash, never two — '//evil.com' is a
    // protocol-relative URL that resolves to another host.
    destinationPath: z.string().trim().regex(/^\/(?!\/)[^\s]*$/, {
        message: 'The destination must be a path on this site, starting with a single "/".',
    }).max(500).optional(),
    utmCampaign: z.string().trim().max(100).regex(/^[A-Za-z0-9._-]+$/, {
        message: 'Use letters, numbers, dots, dashes and underscores only.',
    }).optional(),

    // The promo code this campaign advertises, applied automatically to the
    // booking session of a guest who follows its link. Validated against a real,
    // active offer below — a code that does not exist would silently produce no
    // discount for every recipient, which is the kind of failure nobody notices
    // until a guest complains.
    offerCode: z.string().trim().max(50).optional(),
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

        // A promo code that does not resolve to a live offer is refused at
        // creation rather than at send time. The failure it prevents is silent:
        // every recipient follows the link, the code auto-applies to nothing,
        // and they pay full price on an offer the hotel believes it is running.
        let resolvedOfferCode: string | null = null;
        if (body.offerCode) {
            const code = normalizeCode(body.offerCode);
            const offer = await db.query.offers.findFirst({
                where: sql`upper(${offers.code}) = ${code}`,
            });
            if (!offer) {
                return NextResponse.json(
                    { error: `Promo code ${code} does not exist. Create it under Promo Codes first.` },
                    { status: 400 },
                );
            }
            if (!offer.isActive) {
                return NextResponse.json(
                    { error: `Promo code ${code} is inactive, so it would give no discount.` },
                    { status: 400 },
                );
            }
            if (offer.validTo < hotelToday()) {
                return NextResponse.json(
                    { error: `Promo code ${code} expired on ${offer.validTo}.` },
                    { status: 400 },
                );
            }
            resolvedOfferCode = offer.code;
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
                destinationPath: body.destinationPath ?? null,
                utmCampaign: body.utmCampaign ?? null,
                offerCode: resolvedOfferCode,
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
