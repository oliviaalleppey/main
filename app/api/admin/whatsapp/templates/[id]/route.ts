import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waTemplates, waCampaigns } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { getProvider } from '@/lib/services/whatsapp';
import {
    buildComponents, lintTemplate, hasBlockingIssues, extractVariables,
} from '@/lib/services/whatsapp/template-lint';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'templates.read');
        const { id } = await params;

        const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const issues = lintTemplate({
            name: template.name,
            category: template.category,
            bodyText: template.bodyText ?? '',
            headerType: template.headerType ?? 'none',
            headerText: template.headerText ?? '',
            footerText: template.footerText ?? '',
            buttons: (template.buttons ?? []) as never,
            // Stored templates carry their examples inside `components`; the linter's
            // example check would otherwise fire spuriously on every saved template.
            exampleValues: Array.from({ length: template.variableCount ?? 0 }, () => 'stored'),
        });

        return NextResponse.json({ template, issues });
    } catch (error) {
        return errorResponse(error);
    }
}

const patchSchema = z.object({
    bodyText: z.string().trim().min(1).optional(),
    headerType: z.enum(['none', 'text', 'image', 'document', 'video']).optional(),
    headerText: z.string().max(60).optional(),
    footerText: z.string().max(60).optional(),
    buttons: z.array(z.record(z.string(), z.unknown())).max(10).optional(),
    exampleValues: z.array(z.string()).optional(),
    variableMap: z.record(z.string(), z.string()).optional(),
    variableFallbacks: z.record(z.string(), z.string()).optional(),
    category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']).optional(),
});

/**
 * PATCH — edit a draft, or remap variables on an approved template.
 *
 * Content edits are refused once Meta holds the template: what is approved
 * upstream and what we show must not diverge. Editing a rejected one is the
 * "edit & resubmit" path, which returns it to internal_review.
 */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'templates.write');
        const { id } = await params;
        const body = patchSchema.parse(await request.json());

        const before = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        if (!before) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const editsContent =
            body.bodyText !== undefined || body.headerText !== undefined ||
            body.footerText !== undefined || body.buttons !== undefined ||
            body.headerType !== undefined || body.category !== undefined;

        const editable = before.status === 'draft' || before.status === 'internal_review' || before.status === 'rejected';
        if (editsContent && !editable) {
            return NextResponse.json(
                {
                    error: `A ${before.status} template cannot be edited. Create a new version instead — Meta approves a specific wording, and changing it here would make the panel disagree with what actually sends.`,
                },
                { status: 400 },
            );
        }

        const patch: Record<string, unknown> = { updatedAt: new Date() };

        // Variable mapping is local metadata, so it stays editable at any status.
        if (body.variableMap !== undefined) patch.variableMap = body.variableMap;
        if (body.variableFallbacks !== undefined) patch.variableFallbacks = body.variableFallbacks;

        if (editsContent) {
            const merged = {
                name: before.name,
                category: body.category ?? before.category,
                bodyText: body.bodyText ?? before.bodyText ?? '',
                headerType: body.headerType ?? (before.headerType as 'none') ?? 'none',
                headerText: body.headerText ?? before.headerText ?? '',
                footerText: body.footerText ?? before.footerText ?? '',
                buttons: (body.buttons ?? before.buttons ?? []) as never,
                exampleValues: body.exampleValues ?? [],
            };

            const issues = lintTemplate(merged);
            if (hasBlockingIssues(issues)) {
                return NextResponse.json(
                    { error: 'The template has problems that Meta would reject', issues },
                    { status: 400 },
                );
            }

            const variableCount = extractVariables(`${merged.headerText} ${merged.bodyText}`).length;
            const components = buildComponents({ ...merged, variableCount });

            Object.assign(patch, {
                category: merged.category,
                bodyText: merged.bodyText,
                headerType: merged.headerType,
                headerText: merged.headerText,
                footerText: merged.footerText,
                buttons: (components.find((c) => (c as { type?: string }).type === 'BUTTONS') as { buttons?: unknown[] } | undefined)?.buttons ?? [],
                components,
                variableCount,
                // Editing a rejection is a resubmission, so it re-enters review and
                // the stale rejection reason is cleared.
                status: before.status === 'rejected' ? 'internal_review' : before.status,
                rejectionReason: before.status === 'rejected' ? null : before.rejectionReason,
            });
        }

        await db.update(waTemplates).set(patch).where(eq(waTemplates.id, id));

        await audit({
            actor,
            action: 'whatsapp.template.updated',
            entityType: 'wa_templates',
            entityId: id,
            before: { status: before.status, bodyText: before.bodyText },
            after: patch,
        });

        const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        return NextResponse.json({ template });
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * DELETE — remove locally, and from Meta when it exists there.
 *
 * Refused while a campaign still references the template: wa_messages rows point
 * at it for the audit trail, and deleting it would leave a campaign report unable
 * to say what was actually sent.
 */
export async function DELETE(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'templates.write');
        const { id } = await params;

        const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        const [{ count } = { count: 0 }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(waCampaigns)
            .where(eq(waCampaigns.templateId, id));

        if (Number(count) > 0) {
            return NextResponse.json(
                { error: `${count} campaign(s) use this template. It cannot be deleted while their history references it.` },
                { status: 400 },
            );
        }

        if (template.metaTemplateId) {
            try {
                await getProvider().deleteTemplate(template.name);
            } catch (error) {
                // A template already gone upstream must not block the local cleanup.
                console.error('[whatsapp] remote template delete failed', error);
            }
        }

        await db.delete(waTemplates).where(eq(waTemplates.id, id));

        await audit({
            actor,
            action: 'whatsapp.template.deleted',
            entityType: 'wa_templates',
            entityId: id,
            before: { name: template.name, status: template.status },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
