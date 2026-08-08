import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { waContacts, waConsentEvents, waMessages, waSuppression, waInboxThreads, guestProfiles } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { requireCapability, errorResponse, audit } from '@/lib/services/whatsapp/admin-guard';
import { recordConsentChange } from '@/lib/services/whatsapp/consent';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * GET — contact detail: profile, full message timeline, and consent history.
 * The consent history is the part that answers "prove this person agreed".
 */
export async function GET(request: Request, { params }: Params) {
    try {
        await requireCapability(request, 'contacts.read');
        const { id } = await params;

        const contact = await db
            .select({
                contact: waContacts,
                guest: {
                    id: guestProfiles.id,
                    firstName: guestProfiles.firstName,
                    lastName: guestProfiles.lastName,
                    totalStays: guestProfiles.totalStays,
                    totalSpent: guestProfiles.totalSpent,
                    lastStayAt: guestProfiles.lastStayAt,
                    vipLevel: guestProfiles.vipLevel,
                    city: guestProfiles.city,
                },
            })
            .from(waContacts)
            .leftJoin(guestProfiles, eq(waContacts.guestProfileId, guestProfiles.id))
            .where(eq(waContacts.id, id))
            .limit(1);

        if (!contact.length) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        const [messages, consentHistory, thread] = await Promise.all([
            db.query.waMessages.findMany({
                where: eq(waMessages.contactId, id),
                orderBy: [desc(waMessages.queuedAt)],
                limit: 100,
            }),
            db.query.waConsentEvents.findMany({
                where: eq(waConsentEvents.contactId, id),
                orderBy: [asc(waConsentEvents.createdAt)],
            }),
            db.query.waInboxThreads.findFirst({
                where: eq(waInboxThreads.contactId, id),
            }),
        ]);

        return NextResponse.json({
            ...contact[0],
            messages,
            consentHistory,
            thread: thread ?? null,
        });
    } catch (error) {
        return errorResponse(error);
    }
}

const patchSchema = z.object({
    name: z.string().max(255).nullish(),
    email: z.string().max(255).nullish(),
    tags: z.array(z.string()).optional(),
    notes: z.string().nullish(),
    /** Consent changes go through the ledger, never a bare column write. */
    consentStatus: z.enum(['pending', 'opted_in', 'opted_out', 'suppressed']).optional(),
    consentReason: z.string().optional(),
    consentSource: z.string().optional(),
});

/**
 * PATCH — edit contact details, and/or move consent state.
 *
 * A consent change is delegated to recordConsentChange() so the ledger entry and
 * the projection update happen in one transaction. There is deliberately no path
 * here that writes consent_status directly.
 */
export async function PATCH(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'contacts.write');
        const { id } = await params;
        const body = patchSchema.parse(await request.json());

        const before = await db.query.waContacts.findFirst({ where: eq(waContacts.id, id) });
        if (!before) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        if (body.consentStatus && body.consentStatus !== before.consentStatus) {
            if (!body.consentReason?.trim()) {
                return NextResponse.json(
                    { error: 'A reason is required when changing consent status' },
                    { status: 400 },
                );
            }

            await recordConsentChange({
                contactId: id,
                toStatus: body.consentStatus,
                reason: body.consentReason.trim(),
                source: body.consentSource ?? 'admin panel',
                actorId: actor.id,
                actorEmail: actor.email,
                ip: actor.ip,
                optOutMethod: 'manual',
            });

            await audit({
                actor,
                action: 'whatsapp.contact.consent_changed',
                entityType: 'wa_contacts',
                entityId: id,
                before: { consentStatus: before.consentStatus },
                after: { consentStatus: body.consentStatus, reason: body.consentReason },
            });
        }

        const detailPatch: Record<string, unknown> = {};
        if (body.name !== undefined) detailPatch.name = body.name;
        if (body.email !== undefined) detailPatch.email = body.email;
        if (body.tags !== undefined) detailPatch.tags = body.tags;
        if (body.notes !== undefined) detailPatch.notes = body.notes;

        if (Object.keys(detailPatch).length) {
            detailPatch.updatedAt = new Date();
            await db.update(waContacts).set(detailPatch).where(eq(waContacts.id, id));
            await audit({
                actor,
                action: 'whatsapp.contact.updated',
                entityType: 'wa_contacts',
                entityId: id,
                before: { name: before.name, email: before.email, tags: before.tags },
                after: detailPatch,
            });
        }

        const contact = await db.query.waContacts.findFirst({ where: eq(waContacts.id, id) });
        return NextResponse.json({ contact });
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * DELETE — DPDP erasure.
 *
 * Hard-deletes the contact and everything cascading from it, but leaves a
 * tombstone on wa_suppression so the number can never be re-added by a future
 * import. Erasing someone must not have the side effect of making them
 * contactable again.
 */
export async function DELETE(request: Request, { params }: Params) {
    try {
        const actor = await requireCapability(request, 'contacts.erase');
        const { id } = await params;

        const contact = await db.query.waContacts.findFirst({
            where: eq(waContacts.id, id),
            columns: { id: true, phone: true, name: true },
        });
        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }

        await db.transaction(async (tx) => {
            await tx
                .insert(waSuppression)
                .values({
                    phone: contact.phone,
                    reason: 'Erased on data subject request (DPDP)',
                    addedBy: actor.id,
                })
                .onConflictDoNothing();

            // wa_messages, wa_consent_events and wa_inbox_threads all cascade on
            // contact deletion (see the FKs in 0006_whatsapp_module.sql).
            await tx.delete(waContacts).where(eq(waContacts.id, id));
        });

        await audit({
            actor,
            action: 'whatsapp.contact.erased',
            entityType: 'wa_contacts',
            entityId: id,
            // Deliberately records the phone number: the audit log has to show which
            // number was erased, or the erasure itself is unverifiable.
            before: { phone: contact.phone, name: contact.name },
            after: { suppressed: true },
        });

        return NextResponse.json({ success: true, suppressed: contact.phone });
    } catch (error) {
        return errorResponse(error);
    }
}
