import { NextResponse } from 'next/server';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { analyticsOverview, defaultRange } from '@/lib/services/whatsapp/analytics';
import { buildAnalyticsWorkbook, analyticsFilename } from '@/lib/services/whatsapp/analytics-export';

export const dynamic = 'force-dynamic';

/**
 * GET — the analytics screen as an XLSX workbook.
 *
 * Gated on `analytics.read` rather than `contacts.unmask`: this export is
 * aggregate-only — funnel counts, daily totals, per-template rates and hour-of-day
 * buckets. No phone number, name or message body appears in it, so it is not a
 * route out of the phone masking.
 */
export async function GET(request: Request) {
    try {
        const actor = await requireCapability(request, 'analytics.read');

        const url = new URL(request.url);
        const daysParam = Number(url.searchParams.get('days'));
        // Clamped exactly as the JSON route is: an unbounded range is a table
        // scan over the whole send log.
        const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;

        const overview = await analyticsOverview(defaultRange(days));
        const workbook = buildAnalyticsWorkbook(overview);

        // Exports are audited: it is the one analytics action that takes data out
        // of the panel, and "who pulled the numbers, and for what window" is the
        // question asked afterwards.
        await audit({
            actor,
            action: 'analytics.export',
            entityType: 'analytics',
            after: { days, rows: overview.trends.length, templates: overview.templates.length },
        });

        return new NextResponse(new Uint8Array(workbook), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${analyticsFilename(overview)}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        return errorResponse(error);
    }
}
