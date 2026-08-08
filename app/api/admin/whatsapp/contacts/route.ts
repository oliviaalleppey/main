import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waContacts, waConsentEvents, guestProfiles } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { normalizePhone, phoneMaskerFor } from '@/lib/services/whatsapp/phone';
import { shouldMaskPhones } from '@/lib/services/whatsapp/roles';
import { readContactFilters, contactWhere } from '@/lib/services/whatsapp/contact-query';

export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 200;

/**
 * GET — paginated, filterable contact list for the admin table.
 */
export async function GET(request: Request) {
    try {
        const actor = await requireCapability(request, 'contacts.read');
        const mask = phoneMaskerFor(actor.role);

        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get('pageSize') ?? 50)));

        const where = contactWhere(readContactFilters(url.searchParams));

        const [rows, countRows, statusRows, tagRows] = await Promise.all([
            db
                .select({
                    id: waContacts.id,
                    phone: waContacts.phone,
                    name: waContacts.name,
                    email: waContacts.email,
                    source: waContacts.source,
                    consentStatus: waContacts.consentStatus,
                    consentSource: waContacts.consentSource,
                    consentAt: waContacts.consentAt,
                    optedOutAt: waContacts.optedOutAt,
                    lastInboundAt: waContacts.lastInboundAt,
                    lastOutboundAt: waContacts.lastOutboundAt,
                    marketingSent30d: waContacts.marketingSent30d,
                    tags: waContacts.tags,
                    createdAt: waContacts.createdAt,
                    guestProfileId: waContacts.guestProfileId,
                    totalStays: guestProfiles.totalStays,
                    lastStayAt: guestProfiles.lastStayAt,
                    city: guestProfiles.city,
                })
                .from(waContacts)
                .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
                .where(where)
                .orderBy(desc(waContacts.createdAt))
                .limit(pageSize)
                .offset((page - 1) * pageSize),
            // The join is repeated here because the filter may reference
            // guest_profiles (city, has-booked); counting without it would error.
            db
                .select({ count: sql<number>`count(*)` })
                .from(waContacts)
                .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
                .where(where),
            // Counts per consent status for the filter chips — always unfiltered by
            // status so the chips don't disappear once one is selected.
            db
                .select({ status: sql<string>`${waContacts.consentStatus}::text`, count: sql<number>`count(*)` })
                .from(waContacts)
                .groupBy(sql`${waContacts.consentStatus}::text`),
            // Every tag in use, so the filter offers real values instead of asking
            // the operator to remember what they typed on a previous import.
            db.execute<{ tag: string; count: number }>(sql`
                SELECT tag, COUNT(*)::int AS count
                FROM wa_contacts, LATERAL jsonb_array_elements_text(COALESCE(tags::jsonb, '[]'::jsonb)) AS tag
                GROUP BY tag
                ORDER BY count DESC, tag ASC
                LIMIT 100
            `),
        ]);

        const total = Number(countRows[0]?.count ?? 0);
        const tagRowList = tagRows.rows as { tag: string; count: number }[];

        return NextResponse.json({
            // Masked at the boundary, not in the table component: the unmasked
            // value must never reach the client for a role that may not see it.
            contacts: rows.map((r) => ({ ...r, phone: mask(r.phone) })),
            canUnmask: !shouldMaskPhones(actor.role),
            pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
            statusCounts: Object.fromEntries(statusRows.map((r) => [r.status, Number(r.count)])),
            tags: tagRowList.map((r) => ({ tag: r.tag, count: Number(r.count) })),
        });
    } catch (error) {
        return errorResponse(error);
    }
}

const createSchema = z.object({
    phone: z.string().min(1),
    name: z.string().max(255).optional(),
    email: z.string().email().max(255).optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    /**
     * Consent must be stated explicitly, exactly as in the import wizard. A contact
     * cannot be created as opted-in without a source and a collection date.
     */
    consent: z.object({
        hasExplicitOptIn: z.boolean(),
        source: z.string().optional(),
        collectedAt: z.string().optional(),
    }),
    provenanceNote: z.string().min(1, 'A provenance note is required'),
});

/**
 * POST — add a single contact by hand (front desk taking consent in person).
 */
export async function POST(request: Request) {
    try {
        const actor = await requireCapability(request, 'contacts.write');
        const body = createSchema.parse(await request.json());

        const normalized = normalizePhone(body.phone);
        if (!normalized.ok) {
            return NextResponse.json(
                { error: `Invalid phone number: ${normalized.detail}` },
                { status: 400 },
            );
        }

        const optedIn =
            body.consent.hasExplicitOptIn &&
            !!body.consent.source?.trim() &&
            !!body.consent.collectedAt;

        const consentStatus = optedIn ? ('opted_in' as const) : ('pending' as const);
        const consentAt = optedIn && body.consent.collectedAt ? new Date(body.consent.collectedAt) : null;

        const existing = await db.query.waContacts.findFirst({
            where: eq(waContacts.phone, normalized.e164),
            columns: { id: true },
        });
        if (existing) {
            return NextResponse.json(
                { error: 'That number is already in contacts', contactId: existing.id },
                { status: 409 },
            );
        }

        const contact = await db.transaction(async (tx) => {
            const [row] = await tx
                .insert(waContacts)
                .values({
                    phone: normalized.e164,
                    name: body.name,
                    email: body.email || undefined,
                    source: 'manual',
                    consentStatus,
                    consentSource: optedIn ? body.consent.source : null,
                    consentAt,
                    provenanceNote: body.provenanceNote.trim(),
                    tags: body.tags ?? [],
                    notes: body.notes,
                })
                .returning();

            if (optedIn) {
                await tx.insert(waConsentEvents).values({
                    contactId: row.id,
                    phone: row.phone,
                    fromStatus: null,
                    toStatus: 'opted_in',
                    reason: body.provenanceNote.trim(),
                    source: body.consent.source ?? 'manual',
                    actorId: actor.id,
                    actorEmail: actor.email,
                    ip: actor.ip,
                });
            }

            return row;
        });

        await audit({
            actor,
            action: 'whatsapp.contact.created',
            entityType: 'wa_contacts',
            entityId: contact.id,
            after: { phone: contact.phone, consentStatus },
        });

        return NextResponse.json({ contact }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
