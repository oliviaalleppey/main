import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waAudiences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    explainAudience, previewAudience, resolveAudienceContactIds, type AudienceFilter,
} from '@/lib/services/whatsapp/audiences';
import { filterSchema, isRePermissionAudience } from '@/lib/services/whatsapp/audience-schema';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** GET — one audience with a fresh count, breakdown and sample. */
export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'audiences.read');
        const { id } = await params;

        const audience = await db.query.waAudiences.findFirst({ where: eq(waAudiences.id, id) });
        if (!audience) {
            return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
        }

        const filter = (audience.filter ?? {}) as AudienceFilter;
        const isRePermission = isRePermissionAudience(filter);

        const [breakdown, samples] = await Promise.all([
            explainAudience(filter, { isRePermission }),
            previewAudience(filter, { limit: 20, isRePermission }),
        ]);

        return NextResponse.json({ audience, breakdown, samples, isRePermission });
    } catch (error) {
        return errorResponse(error);
    }
}

const patchSchema = z.object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).nullish(),
    filter: filterSchema.optional(),
    /** Static audiences only: re-resolve the frozen list against the filter now. */
    refreshStatic: z.boolean().optional(),
});

/**
 * PATCH — rename, re-describe or re-filter.
 *
 * System audiences accept a rename but not a filter change: they are the
 * definitions the rest of the module reasons about ("Pending re-permission" must
 * keep meaning pending), and silently redefining one would change who a saved
 * campaign targets.
 */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'audiences.write');
        const { id } = await params;
        const body = patchSchema.parse(await request.json());

        const before = await db.query.waAudiences.findFirst({ where: eq(waAudiences.id, id) });
        if (!before) {
            return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
        }
        if (before.isSystem && body.filter) {
            return NextResponse.json(
                { error: 'A prebuilt audience keeps its filter. Duplicate it to build a variant.' },
                { status: 400 },
            );
        }

        const patch: Record<string, unknown> = { updatedAt: new Date() };
        if (body.name !== undefined) patch.name = body.name;
        if (body.description !== undefined) patch.description = body.description;

        const filter = (body.filter ?? before.filter ?? {}) as AudienceFilter;
        const isRePermission = isRePermissionAudience(filter);

        if (body.filter) {
            patch.filter = body.filter;
        }

        if (body.filter || body.refreshStatic) {
            if (before.type === 'static') {
                const contactIds = await resolveAudienceContactIds(filter, { isRePermission });
                patch.contactIds = contactIds;
                patch.lastCount = contactIds.length;
            } else {
                patch.lastCount = (await explainAudience(filter, { isRePermission })).eligible;
            }
            patch.lastEvaluatedAt = new Date();
        }

        await db.update(waAudiences).set(patch).where(eq(waAudiences.id, id));

        await audit({
            actor,
            action: 'whatsapp.audience.updated',
            entityType: 'wa_audiences',
            entityId: id,
            before: { name: before.name, filter: before.filter, lastCount: before.lastCount },
            after: patch,
        });

        const audience = await db.query.waAudiences.findFirst({ where: eq(waAudiences.id, id) });
        return NextResponse.json({ audience });
    } catch (error) {
        return errorResponse(error);
    }
}

/** DELETE — user-created audiences only. Prebuilt ones are part of the module. */
export async function DELETE(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'audiences.write');
        const { id } = await params;

        const audience = await db.query.waAudiences.findFirst({
            where: eq(waAudiences.id, id),
            columns: { id: true, name: true, isSystem: true },
        });
        if (!audience) {
            return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
        }
        if (audience.isSystem) {
            return NextResponse.json({ error: 'Prebuilt audiences cannot be deleted' }, { status: 400 });
        }

        await db.delete(waAudiences).where(eq(waAudiences.id, id));

        await audit({
            actor,
            action: 'whatsapp.audience.deleted',
            entityType: 'wa_audiences',
            entityId: id,
            before: { name: audience.name },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
