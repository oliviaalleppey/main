import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waAudiences } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    explainAudience, ensureSystemAudiences, resolveAudienceContactIds, type AudienceFilter,
} from '@/lib/services/whatsapp/audiences';
import { filterSchema, isRePermissionAudience } from '@/lib/services/whatsapp/audience-schema';

export const dynamic = 'force-dynamic';

/**
 * GET — the audience list with live eligible counts.
 *
 * Counts are recomputed on read rather than served from `last_count`. A stale
 * number here is worse than a slow page: it is the figure someone uses to decide
 * whether to spend money on a campaign.
 */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'audiences.read');

        // Idempotent, so the prebuilt audiences exist from the first page view.
        await ensureSystemAudiences();

        const rows = await db
            .select()
            .from(waAudiences)
            .orderBy(desc(waAudiences.isSystem), desc(waAudiences.createdAt));

        const audiences = await Promise.all(
            rows.map(async (row) => {
                const filter = (row.filter ?? {}) as AudienceFilter;

                if (row.type === 'static') {
                    return {
                        ...row,
                        breakdown: null,
                        eligible: ((row.contactIds as string[] | null) ?? []).length,
                        isRePermission: isRePermissionAudience(filter),
                    };
                }

                try {
                    const breakdown = await explainAudience(filter, {
                        isRePermission: isRePermissionAudience(filter),
                    });
                    return {
                        ...row,
                        breakdown,
                        eligible: breakdown.eligible,
                        isRePermission: isRePermissionAudience(filter),
                    };
                } catch (error) {
                    // One malformed saved filter must not take down the whole list.
                    return {
                        ...row,
                        breakdown: null,
                        eligible: 0,
                        isRePermission: isRePermissionAudience(filter),
                        error: error instanceof Error ? error.message : 'Could not evaluate',
                    };
                }
            }),
        );

        return NextResponse.json({ audiences });
    } catch (error) {
        return errorResponse(error);
    }
}

const createSchema = z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional(),
    type: z.enum(['dynamic', 'static']).default('dynamic'),
    filter: filterSchema.default({}),
});

/**
 * POST — save a new audience.
 *
 * A static audience is frozen at creation time by resolving the filter to a
 * contact-id list. That is the point of static, and also its danger: it will not
 * pick up opt-outs afterwards, which is why the dispatcher re-checks consent per
 * message regardless of how the audience was built.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'audiences.write');
        const body = createSchema.parse(await request.json());

        const filter = body.filter as AudienceFilter;
        const isRePermission = isRePermissionAudience(filter);

        const contactIds = body.type === 'static'
            ? await resolveAudienceContactIds(filter, { isRePermission })
            : null;

        const breakdown = await explainAudience(filter, { isRePermission });

        const [audience] = await db
            .insert(waAudiences)
            .values({
                name: body.name,
                description: body.description,
                type: body.type,
                filter: filter as unknown as Record<string, unknown>,
                contactIds,
                lastCount: body.type === 'static' ? (contactIds?.length ?? 0) : breakdown.eligible,
                lastEvaluatedAt: new Date(),
                createdBy: actor.id,
            })
            .returning();

        await audit({
            actor,
            action: 'whatsapp.audience.created',
            entityType: 'wa_audiences',
            entityId: audience.id,
            after: { name: audience.name, type: audience.type, filter, eligible: audience.lastCount },
        });

        return NextResponse.json({ audience, breakdown }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
