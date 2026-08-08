import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waTemplates, waAudiences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { explainAudience, type AudienceFilter } from '@/lib/services/whatsapp/audiences';
import { isRePermissionAudience } from '@/lib/services/whatsapp/audience-schema';
import { estimateCampaignCost, estimateCompletion } from '@/lib/services/whatsapp/campaigns';
import { getSettings, budgetState } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

const schema = z.object({
    templateId: z.string().uuid(),
    audienceId: z.string().uuid(),
    dailyCap: z.number().int().min(1).optional(),
    throttlePerMin: z.number().int().min(1).max(600).optional(),
});

/**
 * POST — cost and duration for a template + audience combination.
 *
 * Used live by the wizard's review step, before the campaign row exists, which
 * is why it takes ids in the body rather than reading a saved campaign. The
 * route id is the draft it will become, or `new`.
 */
export async function POST(request: Request) {
    try {
        await requireCapability(request, 'campaigns.read');
        const body = schema.parse(await request.json());
        const settings = await getSettings();

        const [template, audience] = await Promise.all([
            db.query.waTemplates.findFirst({ where: eq(waTemplates.id, body.templateId) }),
            db.query.waAudiences.findFirst({ where: eq(waAudiences.id, body.audienceId) }),
        ]);

        if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        if (!audience) return NextResponse.json({ error: 'Audience not found' }, { status: 404 });

        const filter = (audience.filter ?? {}) as AudienceFilter;
        const isRePermission = isRePermissionAudience(filter);

        const breakdown = audience.type === 'static'
            ? {
                matched: ((audience.contactIds as string[] | null) ?? []).length,
                eligible: ((audience.contactIds as string[] | null) ?? []).length,
                excluded: { notOptedIn: 0, optedOut: 0, suppressed: 0, frequencyCapped: 0, invalidPhone: 0, noConsentRecord: 0 },
            }
            : await explainAudience(filter, { isRePermission });

        const cost = estimateCampaignCost(template.category, breakdown.eligible);
        const dailyCap = body.dailyCap ?? settings.dailyCap ?? breakdown.eligible;
        const throttle = body.throttlePerMin ?? settings.throttlePerMin ?? 60;
        const completion = estimateCompletion(breakdown.eligible, dailyCap, throttle);

        // Budget is a month-to-date figure; real spend arrives with the dispatcher,
        // so today this shows the campaign against the full monthly budget.
        const budget = budgetState(settings, 0);

        return NextResponse.json({
            breakdown,
            isRePermission,
            cost,
            completion,
            dailyCap,
            throttlePerMin: throttle,
            budget: {
                monthly: budget.budget,
                remaining: budget.budget - cost.totalPaise,
                wouldExceed: cost.totalPaise > budget.budget,
            },
            requiresSecondApproval: breakdown.eligible > (settings.approvalThreshold ?? 1000),
            approvalThreshold: settings.approvalThreshold ?? 1000,
            frequencyCap: settings.frequencyCapPer30d ?? 2,
            quietHours: settings.quietHoursEnabled
                ? { start: settings.quietHoursStart, end: settings.quietHoursEnd }
                : null,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
