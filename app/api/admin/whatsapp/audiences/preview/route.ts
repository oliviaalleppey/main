import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability, errorResponse } from '@/lib/services/whatsapp/admin-guard';
import { explainAudience, previewAudience, type AudienceFilter } from '@/lib/services/whatsapp/audiences';
import { filterSchema, isRePermissionAudience } from '@/lib/services/whatsapp/audience-schema';
import { getSettings } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

const schema = z.object({
    filter: filterSchema.default({}),
    /**
     * Forced on for the re-permission template, which is the one marketing message
     * a pending contact may lawfully receive. Otherwise inferred from the filter.
     */
    isRePermission: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).default(20),
});

/**
 * POST — live count, exclusion breakdown and sample contacts. Writes nothing.
 *
 * The exclusion breakdown is the point of this endpoint. Showing only the final
 * number is what produces "why did just 6,200 of my 10,000 send?" a week later;
 * showing the reasons up front turns that into a decision the operator makes
 * knowingly.
 */
export async function POST(request: Request) {
    try {
        await requireCapability(request, 'audiences.read');
        const body = schema.parse(await request.json());

        const filter = body.filter as AudienceFilter;
        const isRePermission = body.isRePermission ?? isRePermissionAudience(filter);

        const [breakdown, samples, settings] = await Promise.all([
            explainAudience(filter, { isRePermission }),
            previewAudience(filter, { limit: body.limit, isRePermission }),
            getSettings(),
        ]);

        return NextResponse.json({
            breakdown,
            samples,
            isRePermission,
            // Surfaced so the UI can explain *why* contacts were frequency-capped
            // rather than just reporting the number.
            frequencyCap: settings.frequencyCapPer30d ?? 2,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
