import { db } from '@/lib/db';
import { waContacts, guestProfiles } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { readContactFilters, contactWhere } from '@/lib/services/whatsapp/contact-query';

export const dynamic = 'force-dynamic';

/** Matches the import cap — an export should always be re-importable. */
const MAX_EXPORT = 50_000;

const COLUMNS = [
    'Phone',
    'Name',
    'Email',
    'Consent status',
    'Consent source',
    'Consent date',
    'Opted out at',
    'Source',
    'Tags',
    'City',
    'Total stays',
    'Last stay',
    'Last message sent',
    'Last reply',
    'Marketing sent (30d)',
    'Added',
] as const;

function csvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = value instanceof Date ? value.toISOString() : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

/**
 * GET — CSV of the current contact selection.
 *
 * Takes the same filter params as the list endpoint, so "export" always means
 * "export exactly what is on screen". An explicit `ids` param overrides them for
 * exporting a hand-picked selection.
 *
 * This hands personal data to whoever clicks it, so it is audited like a
 * mutation rather than treated as a harmless read.
 */
export async function GET(request: Request) {
    try {
        const actor = await requireCapability(request, 'contacts.unmask');
        const url = new URL(request.url);

        // Filtered to real UUIDs: anything else would reach Postgres as a cast
        // error rather than an empty result.
        const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const ids = url.searchParams
            .getAll('ids')
            .flatMap((v) => v.split(','))
            .map((v) => v.trim())
            .filter((v) => UUID.test(v));

        const filters = readContactFilters(url.searchParams);
        const where = ids.length
            ? inArray(waContacts.id, ids.slice(0, MAX_EXPORT))
            : contactWhere(filters);

        const rows = await db
            .select({
                phone: waContacts.phone,
                name: waContacts.name,
                email: waContacts.email,
                consentStatus: waContacts.consentStatus,
                consentSource: waContacts.consentSource,
                consentAt: waContacts.consentAt,
                optedOutAt: waContacts.optedOutAt,
                source: waContacts.source,
                tags: waContacts.tags,
                lastInboundAt: waContacts.lastInboundAt,
                lastOutboundAt: waContacts.lastOutboundAt,
                marketingSent30d: waContacts.marketingSent30d,
                createdAt: waContacts.createdAt,
                city: guestProfiles.city,
                totalStays: guestProfiles.totalStays,
                lastStayAt: guestProfiles.lastStayAt,
            })
            .from(waContacts)
            .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
            .where(where)
            .orderBy(desc(waContacts.createdAt))
            .limit(MAX_EXPORT);

        const lines = [COLUMNS.join(',')];
        for (const row of rows) {
            lines.push([
                csvCell(row.phone),
                csvCell(row.name),
                csvCell(row.email),
                csvCell(row.consentStatus),
                csvCell(row.consentSource),
                csvCell(row.consentAt),
                csvCell(row.optedOutAt),
                csvCell(row.source),
                csvCell((row.tags ?? []).join(' | ')),
                csvCell(row.city),
                csvCell(row.totalStays),
                csvCell(row.lastStayAt),
                csvCell(row.lastOutboundAt),
                csvCell(row.lastInboundAt),
                csvCell(row.marketingSent30d),
                csvCell(row.createdAt),
            ].join(','));
        }

        await audit({
            actor,
            action: 'whatsapp.contacts.exported',
            entityType: 'wa_contacts',
            after: { rows: rows.length, filters: ids.length ? { ids: ids.length } : filters },
        });

        const filename = `whatsapp-contacts-${new Date().toISOString().slice(0, 10)}.csv`;

        // The BOM makes Excel open UTF-8 names correctly instead of mangling them.
        return new Response(`﻿${lines.join('\n')}`, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        return errorResponse(error);
    }
}
