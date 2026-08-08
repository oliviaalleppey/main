import { db } from '@/lib/db';
import { waTemplates } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getProvider } from './index';
import { parseComponents } from './template-lint';
import type { RemoteTemplate } from './types';

/**
 * Server-side template operations: sync with Meta, and the sendable list.
 *
 * The pure helpers — parsing, the linter, preview rendering — live in
 * ./template-lint so the request form can run the identical linter in the
 * browser. This file is the half that touches the database and the provider.
 *
 * Meta's component array is the source of truth for what a template *is*, but a
 * terrible thing to render a form from, so we parse it into flat columns for the
 * UI and rebuild the array on submit.
 */

// Re-exported so callers have one import site for templates.
export * from './template-lint';

// --------------------------------------------
// Sync with Meta
// --------------------------------------------

export type SyncResult = { created: number; updated: number; total: number };

/** Meta's status strings -> our enum. */
function mapRemoteStatus(status: string): 'approved' | 'rejected' | 'pending_meta' | 'paused' | 'disabled' {
    switch (status.toUpperCase()) {
        case 'APPROVED': return 'approved';
        case 'REJECTED': return 'rejected';
        case 'PAUSED': return 'paused';
        case 'DISABLED': return 'disabled';
        default: return 'pending_meta'; // PENDING, IN_APPEAL, PENDING_DELETION…
    }
}

/**
 * Pull every template from Meta and mirror it locally.
 *
 * Remote state wins for status, category and content — Meta can pause, reject or
 * reclassify a template at any time and the panel must show that rather than a
 * stale local guess. Local-only fields (variableMap, submittedBy) are preserved.
 */
export async function syncTemplates(): Promise<SyncResult> {
    const remote: RemoteTemplate[] = await getProvider().listTemplates();
    let created = 0;
    let updated = 0;

    for (const template of remote) {
        const parsed = parseComponents(template.components);
        const existing = await db.query.waTemplates.findFirst({
            where: and(eq(waTemplates.name, template.name), eq(waTemplates.language, template.language)),
            columns: { id: true },
        });

        const values = {
            name: template.name,
            language: template.language,
            category: template.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
            status: mapRemoteStatus(template.status),
            metaTemplateId: template.metaTemplateId,
            components: template.components,
            bodyText: parsed.bodyText,
            headerType: parsed.headerType,
            headerText: parsed.headerText,
            footerText: parsed.footerText,
            buttons: parsed.buttons,
            variableCount: parsed.variableCount,
            rejectionReason: template.rejectionReason ?? null,
            qualityScore: template.qualityScore ?? null,
            syncedAt: new Date(),
            updatedAt: new Date(),
        };

        if (existing) {
            await db.update(waTemplates).set(values).where(eq(waTemplates.id, existing.id));
            updated += 1;
        } else {
            await db.insert(waTemplates).values(values);
            created += 1;
        }
    }

    return { created, updated, total: remote.length };
}

/** Approved templates only — the picker in the campaign wizard must never offer anything else. */
export async function listSendableTemplates() {
    return db
        .select()
        .from(waTemplates)
        .where(eq(waTemplates.status, 'approved'))
        .orderBy(sql`${waTemplates.category}, ${waTemplates.name}`);
}
