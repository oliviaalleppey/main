import { NextResponse } from 'next/server';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { analyticsOverview, defaultRange } from '@/lib/services/whatsapp/analytics';

export const dynamic = 'force-dynamic';

/** GET — the whole analytics screen in one call. `?days=` selects the window. */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'analytics.read');

        const url = new URL(request.url);
        const daysParam = Number(url.searchParams.get('days'));
        // Clamped: an unbounded range is a table scan over the whole send log.
        const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;

        return NextResponse.json(await analyticsOverview(defaultRange(days)));
    } catch (error) {
        return errorResponse(error);
    }
}
