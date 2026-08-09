/**
 * Stage the submission-ready template drafts into wa_templates.
 *
 *   npx esbuild scripts/seed-templates.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/seed.cjs && node --env-file=.env /tmp/seed.cjs
 *
 * Run this the day Meta credentials arrive. It inserts every draft from
 * template-drafts.ts as `status: 'draft'` so the templates screen has them ready
 * to review and submit — turning submission day into a few clicks rather than an
 * afternoon of typing copy into a form.
 *
 * It does NOT submit anything to Meta. Submission stays a deliberate act behind
 * the `templates.submit` capability and the two-person rule.
 *
 * Idempotent: a template that already exists is left alone unless --force is
 * passed, and --force still refuses to overwrite anything past `draft`. Once a
 * template has been submitted, Meta's copy is the source of truth and silently
 * rewriting ours would put the two out of step.
 *
 *   --dry   print what would happen, write nothing
 *   --force refresh existing rows that are still drafts
 */

import { db } from '@/lib/db';
import { waTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TEMPLATE_DRAFTS, type TemplateDraft } from '@/lib/services/whatsapp/template-drafts';
import { buildComponents, lintTemplate, extractVariables } from '@/lib/services/whatsapp/template-lint';

const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');

/**
 * Which data source fills each {{n}} for a campaign send.
 *
 * Only the MARKETING templates need this: their variables are resolved per
 * recipient at queue-build time. The UTILITY ones are fired by automations that
 * pass their variables explicitly, so a map would be ignored — and setting one
 * would imply a resolution path that does not exist.
 */
function variableMapFor(draft: TemplateDraft): Record<string, string> {
    if (draft.category !== 'MARKETING') return {};

    const map: Record<string, string> = { '1': 'contact.firstName' };
    // Any further marketing variable is a per-campaign static value, set in the
    // wizard — e.g. {{2}} = "Onam" on olivia_offer_v1.
    return map;
}

function rowFor(draft: TemplateDraft) {
    const parsed = {
        bodyText: draft.bodyText,
        headerType: draft.headerType ?? ('none' as const),
        headerText: draft.headerText ?? '',
        footerText: draft.footerText ?? '',
        buttons: draft.buttons ?? [],
        variableCount: extractVariables(draft.bodyText).length,
    };

    return {
        name: draft.name,
        language: draft.language,
        category: draft.category,
        status: 'draft' as const,
        // buildComponents appends the opt-out button for MARKETING, so the stored
        // components are exactly what would go to Meta — not what was typed.
        components: buildComponents({ ...parsed, category: draft.category, exampleValues: draft.exampleValues }),
        bodyText: parsed.bodyText,
        headerType: parsed.headerType,
        headerText: parsed.headerText || null,
        footerText: parsed.footerText || null,
        buttons: parsed.buttons,
        variableCount: parsed.variableCount,
        variableMap: variableMapFor(draft),
        // "there" rather than "Guest": a contact with no recorded first name
        // reads "Hello there," which sounds like a person wrote it, where
        // "Hello Guest," announces a mail merge.
        variableFallbacks: (draft.category === 'MARKETING'
            ? { '1': 'there' }
            : {}) as Record<string, string>,
    };
}

async function main() {
    console.log(`Seeding ${TEMPLATE_DRAFTS.length} templates${DRY ? ' (dry run)' : ''}${FORCE ? ' (force)' : ''}\n`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let blocked = 0;

    for (const draft of TEMPLATE_DRAFTS) {
        // Refuse to stage anything our own linter would reject. Seeding a
        // template that cannot be submitted just moves the failure to a worse
        // moment — the one where someone is waiting on Meta.
        const issues = lintTemplate({
            name: draft.name,
            category: draft.category,
            bodyText: draft.bodyText,
            headerType: draft.headerType,
            headerText: draft.headerText,
            footerText: draft.footerText,
            buttons: draft.buttons,
            exampleValues: draft.exampleValues,
        });
        const errors = issues.filter((i) => i.severity === 'error');
        if (errors.length) {
            console.log(`  BLOCKED  ${draft.name}`);
            for (const e of errors) console.log(`           ${e.field}: ${e.message}`);
            blocked += 1;
            continue;
        }

        const existing = await db.query.waTemplates.findFirst({
            where: eq(waTemplates.name, draft.name),
        });

        if (existing && !FORCE) {
            console.log(`  SKIP     ${draft.name} (already exists, status: ${existing.status})`);
            skipped += 1;
            continue;
        }

        if (existing && existing.status !== 'draft') {
            console.log(`  REFUSED  ${draft.name} is ${existing.status}, not draft — Meta's copy is authoritative once submitted`);
            skipped += 1;
            continue;
        }

        if (DRY) {
            console.log(`  WOULD ${existing ? 'UPDATE' : 'INSERT'}  ${draft.name} (${draft.category}, ${extractVariables(draft.bodyText).length} vars)`);
            continue;
        }

        if (existing) {
            await db.update(waTemplates)
                .set({ ...rowFor(draft), updatedAt: new Date() })
                .where(eq(waTemplates.id, existing.id));
            console.log(`  UPDATED  ${draft.name}`);
            updated += 1;
        } else {
            await db.insert(waTemplates).values(rowFor(draft));
            console.log(`  INSERTED ${draft.name} (${draft.category})`);
            inserted += 1;
        }
    }

    console.log(`\n${inserted} inserted, ${updated} updated, ${skipped} skipped, ${blocked} blocked`);
    if (blocked) {
        console.log('\nFix the blocked templates before submission day — they cannot be sent to Meta as they are.');
        process.exit(1);
    }
    console.log('\nNext: review each on /admin/whatsapp/templates, then submit to Meta.');
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
