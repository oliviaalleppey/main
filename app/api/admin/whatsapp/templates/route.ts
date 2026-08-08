import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waTemplates } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import {
    buildComponents, lintTemplate, hasBlockingIssues, extractVariables, isValidTemplateName,
} from '@/lib/services/whatsapp/template-lint';

export const dynamic = 'force-dynamic';

const buttonSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('QUICK_REPLY'), text: z.string().trim().min(1).max(25) }),
    z.object({ type: z.literal('URL'), text: z.string().trim().min(1).max(25), url: z.string().url() }),
    z.object({ type: z.literal('PHONE_NUMBER'), text: z.string().trim().min(1).max(25), phone_number: z.string().trim().min(1) }),
]);

/** GET — the local mirror, newest first, with counts per status for the tabs. */
export async function GET(request: Request) {
    try {
        await requireCapability(request, 'templates.read');
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const rows = await db
            .select()
            .from(waTemplates)
            .where(status ? sql`${waTemplates.status}::text = ${status}` : undefined)
            .orderBy(sql`${waTemplates.updatedAt} DESC`);

        const statusRows = await db
            .select({ status: sql<string>`${waTemplates.status}::text`, count: sql<number>`count(*)` })
            .from(waTemplates)
            .groupBy(sql`${waTemplates.status}::text`);

        return NextResponse.json({
            templates: rows,
            statusCounts: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)])),
        });
    } catch (error) {
        return errorResponse(error);
    }
}

const createSchema = z.object({
    name: z.string().trim().min(1).max(512),
    language: z.string().trim().min(2).max(10).default('en'),
    category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
    bodyText: z.string().trim().min(1),
    headerType: z.enum(['none', 'text', 'image', 'document', 'video']).default('none'),
    headerText: z.string().max(60).default(''),
    footerText: z.string().max(60).default(''),
    buttons: z.array(buttonSchema).max(10).default([]),
    exampleValues: z.array(z.string()).default([]),
    variableMap: z.record(z.string(), z.string()).default({}),
    variableFallbacks: z.record(z.string(), z.string()).default({}),
});

/**
 * POST — create a draft.
 *
 * Nothing is sent to Meta here. A draft goes to `internal_review` and a second
 * person submits it upstream (see .../[id]/submit). That gate exists because
 * rejected templates accumulate against the account's reputation, and the
 * rejection takes hours to come back.
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'templates.write');
        const body = createSchema.parse(await request.json());

        if (!isValidTemplateName(body.name)) {
            return NextResponse.json(
                { error: 'Template name must be lower_snake_case — letters, digits and underscores only.' },
                { status: 400 },
            );
        }

        const issues = lintTemplate(body);
        if (hasBlockingIssues(issues)) {
            return NextResponse.json(
                { error: 'The template has problems that Meta would reject', issues },
                { status: 400 },
            );
        }

        const duplicate = await db.query.waTemplates.findFirst({
            where: and(eq(waTemplates.name, body.name), eq(waTemplates.language, body.language)),
            columns: { id: true },
        });
        if (duplicate) {
            return NextResponse.json(
                { error: `A ${body.language} template named "${body.name}" already exists`, templateId: duplicate.id },
                { status: 409 },
            );
        }

        const components = buildComponents({
            ...body,
            variableCount: extractVariables(`${body.headerText} ${body.bodyText}`).length,
        });

        const [template] = await db
            .insert(waTemplates)
            .values({
                name: body.name,
                language: body.language,
                category: body.category,
                status: 'internal_review',
                components,
                bodyText: body.bodyText,
                headerType: body.headerType,
                headerText: body.headerText,
                footerText: body.footerText,
                // Read back from the built components so the stored buttons include
                // the auto-added marketing opt-out rather than only what was typed.
                buttons: (components.find((c) => (c as { type?: string }).type === 'BUTTONS') as { buttons?: unknown[] } | undefined)?.buttons ?? [],
                variableCount: extractVariables(`${body.headerText} ${body.bodyText}`).length,
                variableMap: body.variableMap,
                variableFallbacks: body.variableFallbacks,
                submittedBy: actor.id,
            })
            .returning();

        await audit({
            actor,
            action: 'whatsapp.template.drafted',
            entityType: 'wa_templates',
            entityId: template.id,
            after: { name: template.name, category: template.category, status: template.status },
        });

        return NextResponse.json({ template, issues }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
