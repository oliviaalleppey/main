import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waContacts } from '@/lib/db/schema';
import { and, inArray, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { recordConsentChange } from '@/lib/services/whatsapp/consent';

export const dynamic = 'force-dynamic';

/**
 * Bulk actions on selected contacts.
 *
 * Consent changes are routed through recordConsentChange() one contact at a time
 * rather than a single UPDATE. That is deliberately the slower option: it is the
 * only way each contact gets its own ledger entry, and a bulk consent change with
 * no per-contact evidence is exactly the record that cannot be defended under
 * DPDP. Selection is capped at one page of the table, so the cost is bounded.
 */

const MAX_IDS = 500;

const schema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('add_tag'),
        contactIds: z.array(z.string().uuid()).min(1).max(MAX_IDS),
        tag: z.string().trim().min(1).max(64),
    }),
    z.object({
        action: z.literal('remove_tag'),
        contactIds: z.array(z.string().uuid()).min(1).max(MAX_IDS),
        tag: z.string().trim().min(1).max(64),
    }),
    z.object({
        action: z.literal('set_consent'),
        contactIds: z.array(z.string().uuid()).min(1).max(MAX_IDS),
        consentStatus: z.enum(['pending', 'opted_in', 'opted_out', 'suppressed']),
        // Never optional. A status change without a stated reason is unauditable.
        reason: z.string().trim().min(1, 'A reason is required when changing consent status'),
        consentSource: z.string().trim().max(255).optional(),
    }),
]);

export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'contacts.write');
        const body = schema.parse(await request.json());
        const ids = [...new Set(body.contactIds)];

        if (body.action === 'add_tag') {
            const result = await db
                .update(waContacts)
                .set({
                    tags: sql`(COALESCE(${waContacts.tags}::jsonb, '[]'::jsonb) || jsonb_build_array(${body.tag}::text))::json`,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        inArray(waContacts.id, ids),
                        // Skip rows that already carry the tag, so re-tagging is
                        // idempotent instead of producing duplicates in the array.
                        sql`NOT (COALESCE(${waContacts.tags}::jsonb, '[]'::jsonb) ? ${body.tag})`,
                    ),
                );

            await audit({
                actor,
                action: 'whatsapp.contacts.bulk_tag_added',
                entityType: 'wa_contacts',
                after: { tag: body.tag, contactIds: ids.length, changed: result.rowCount ?? 0 },
            });

            return NextResponse.json({ success: true, changed: result.rowCount ?? 0 });
        }

        if (body.action === 'remove_tag') {
            const result = await db
                .update(waContacts)
                .set({
                    tags: sql`(
                        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
                        FROM jsonb_array_elements(COALESCE(${waContacts.tags}::jsonb, '[]'::jsonb)) AS elem
                        WHERE elem <> to_jsonb(${body.tag}::text)
                    )::json`,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        inArray(waContacts.id, ids),
                        sql`COALESCE(${waContacts.tags}::jsonb, '[]'::jsonb) ? ${body.tag}`,
                    ),
                );

            await audit({
                actor,
                action: 'whatsapp.contacts.bulk_tag_removed',
                entityType: 'wa_contacts',
                after: { tag: body.tag, contactIds: ids.length, changed: result.rowCount ?? 0 },
            });

            return NextResponse.json({ success: true, changed: result.rowCount ?? 0 });
        }

        // set_consent
        const before = await db
            .select({ id: waContacts.id, consentStatus: waContacts.consentStatus })
            .from(waContacts)
            .where(inArray(waContacts.id, ids));

        const beforeById = new Map(before.map((c) => [c.id, c.consentStatus]));
        let changed = 0;
        const failures: { contactId: string; error: string }[] = [];

        for (const id of ids) {
            const from = beforeById.get(id);
            if (from === undefined) {
                failures.push({ contactId: id, error: 'Contact not found' });
                continue;
            }
            if (from === body.consentStatus) continue; // recordConsentChange is a no-op here

            try {
                await recordConsentChange({
                    contactId: id,
                    toStatus: body.consentStatus,
                    reason: body.reason,
                    source: body.consentSource || 'admin panel (bulk)',
                    actorId: actor.id,
                    actorEmail: actor.email,
                    ip: actor.ip,
                    optOutMethod: 'manual',
                });
                changed += 1;
            } catch (error) {
                // One bad row must not abandon the rest of the selection.
                failures.push({ contactId: id, error: error instanceof Error ? error.message : 'Failed' });
            }
        }

        await audit({
            actor,
            action: 'whatsapp.contacts.bulk_consent_changed',
            entityType: 'wa_contacts',
            before: { statuses: Object.fromEntries(beforeById) },
            after: {
                toStatus: body.consentStatus,
                reason: body.reason,
                selected: ids.length,
                changed,
                failed: failures.length,
            },
        });

        return NextResponse.json({
            success: true,
            changed,
            unchanged: ids.length - changed - failures.length,
            failures,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
