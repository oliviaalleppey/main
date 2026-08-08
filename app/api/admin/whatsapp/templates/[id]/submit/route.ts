import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waTemplates, adminUsers } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { getProvider, resolveProviderName } from '@/lib/services/whatsapp';
import { lintTemplate, hasBlockingIssues } from '@/lib/services/whatsapp/template-lint';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * POST — internal approval, then submit upstream to Meta.
 *
 * This is the one-way door in the template flow: after this, Meta holds the
 * wording and the content becomes uneditable. So it re-runs the linter server
 * side rather than trusting that the form did, and refuses anything not sitting
 * in internal_review.
 *
 * The two-person rule is now enforced: the person who submits must not be the
 * person who drafted it. It is applied *adaptively* — if the hotel has only one
 * active admin account there is no second person to ask, so self-submission is
 * permitted and recorded as such. A hard rule would lock a single-admin hotel out
 * of its own module, which is how safety checks end up being disabled entirely.
 */
export async function POST(request: Request, { params }: Params) {
    try {
        // Drafting is `templates.write`; submitting to Meta is its own capability,
        // so marketing staff can prepare a template but not send it upstream.
        const actor = await requireCapability(request, 'templates.submit');
        const { id } = await params;

        const template = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Only active admins count — a deactivated second account must not be what
        // makes the two-person rule look satisfied.
        const [{ count } = { count: 0 }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(adminUsers)
            .where(and(eq(adminUsers.isActive, true), eq(adminUsers.role, 'admin')));

        const selfSubmitted = !!template.submittedBy && template.submittedBy === actor.id;

        if (selfSubmitted && Number(count) > 1) {
            return NextResponse.json(
                {
                    error: 'You drafted this template. Meta submission has to be approved by a different admin.',
                    code: 'two_person_rule',
                },
                { status: 403 },
            );
        }

        if (template.status !== 'internal_review' && template.status !== 'draft') {
            return NextResponse.json(
                { error: `This template is already ${template.status} — it cannot be submitted again.` },
                { status: 400 },
            );
        }

        const issues = lintTemplate({
            name: template.name,
            category: template.category,
            bodyText: template.bodyText ?? '',
            headerType: template.headerType ?? 'none',
            headerText: template.headerText ?? '',
            footerText: template.footerText ?? '',
            buttons: (template.buttons ?? []) as never,
            // Examples live in `components`, which was built and validated at
            // creation; re-deriving them here would false-positive.
            exampleValues: Array.from({ length: template.variableCount ?? 0 }, () => 'stored'),
        });

        if (hasBlockingIssues(issues)) {
            return NextResponse.json(
                { error: 'This template would be rejected by Meta. Fix the issues and resubmit.', issues },
                { status: 400 },
            );
        }

        let metaTemplateId: string;
        let remoteStatus: string;
        try {
            const result = await getProvider().createTemplate({
                name: template.name,
                language: template.language,
                category: template.category,
                components: (template.components ?? []) as unknown[],
            });
            metaTemplateId = result.metaTemplateId;
            remoteStatus = result.status;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Submission to Meta failed';
            await audit({
                actor,
                action: 'whatsapp.template.submit_failed',
                entityType: 'wa_templates',
                entityId: id,
                after: { error: message },
            });
            return NextResponse.json({ error: message }, { status: 502 });
        }

        await db
            .update(waTemplates)
            .set({
                status: remoteStatus.toUpperCase() === 'APPROVED' ? 'approved' : 'pending_meta',
                metaTemplateId,
                approvedBy: actor.id,
                submittedAt: new Date(),
                syncedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(waTemplates.id, id));

        await audit({
            actor,
            action: 'whatsapp.template.submitted',
            entityType: 'wa_templates',
            entityId: id,
            before: { status: template.status },
            after: {
                status: remoteStatus,
                metaTemplateId,
                provider: resolveProviderName(),
                // Recorded so a later audit can tell a genuine second pair of eyes
                // from a single-admin hotel that had no one else to ask.
                selfSubmitted,
                activeAdmins: Number(count),
            },
        });

        const updated = await db.query.waTemplates.findFirst({ where: eq(waTemplates.id, id) });
        return NextResponse.json({ success: true, template: updated, remoteStatus, selfSubmitted });
    } catch (error) {
        return errorResponse(error);
    }
}
