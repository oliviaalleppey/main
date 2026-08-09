import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings, offers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

/**
 * The code itself is deliberately NOT editable.
 *
 * It has been printed in WhatsApp messages, typed into checkout and stored on
 * `bookings.promo_code` as a historical record of what a guest was given.
 * Renaming it would break links between bookings and the offer they used, and
 * would silently invalidate a code guests are still holding. To change a code,
 * deactivate this one and make another.
 */
const patchSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
    minBookingAmountRupees: z.number().min(0).optional(),
    maxDiscountRupees: z.number().min(0).nullable().optional(),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
});

async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') return null;
    return session;
}

export async function PATCH(request: Request, { params }: Params) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = patchSchema.parse(await request.json());

        const existing = await db.query.offers.findFirst({ where: eq(offers.id, id) });
        if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

        const validFrom = body.validFrom ?? existing.validFrom;
        const validTo = body.validTo ?? existing.validTo;
        if (validTo < validFrom) {
            return NextResponse.json({ error: 'The end date cannot be before the start date.' }, { status: 400 });
        }

        const discountType = body.discountType ?? existing.discountType;
        if (body.discountValue !== undefined && discountType === 'percentage' && body.discountValue > 100) {
            return NextResponse.json({ error: 'A percentage discount cannot exceed 100%.' }, { status: 400 });
        }

        // Lowering the limit below what has already been claimed would make the
        // offer read as over-redeemed. Refused rather than silently clamped: the
        // admin should know the code has already been used more than that.
        if (body.usageLimit != null && body.usageLimit < (existing.usageCount ?? 0)) {
            return NextResponse.json(
                { error: `This code has already been used ${existing.usageCount} times. The limit cannot be lower than that.` },
                { status: 400 },
            );
        }

        const [updated] = await db.update(offers).set({
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.discountType !== undefined ? { discountType: body.discountType } : {}),
            ...(body.discountValue !== undefined
                ? {
                    discountValue: discountType === 'fixed'
                        ? rupeesToPaise(body.discountValue)
                        : Math.round(body.discountValue),
                }
                : {}),
            ...(body.minBookingAmountRupees !== undefined
                ? { minBookingAmount: rupeesToPaise(body.minBookingAmountRupees) }
                : {}),
            ...(body.maxDiscountRupees !== undefined
                ? { maxDiscount: body.maxDiscountRupees === null ? null : rupeesToPaise(body.maxDiscountRupees) }
                : {}),
            ...(body.validFrom !== undefined ? { validFrom: body.validFrom } : {}),
            ...(body.validTo !== undefined ? { validTo: body.validTo } : {}),
            ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
            updatedAt: new Date(),
        }).where(eq(offers.id, id)).returning();

        return NextResponse.json({ offer: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message ?? 'Invalid offer', details: error.issues },
                { status: 400 },
            );
        }
        console.error('Offer update failed:', error);
        return NextResponse.json({ error: 'Could not update the offer' }, { status: 500 });
    }
}

/**
 * Delete, but only while the offer is still unused.
 *
 * `bookings.offer_id` references this row, so deleting an offer a guest has
 * booked with would either fail on the foreign key or orphan the discount
 * recorded against a real booking. Once it has been redeemed the honest action
 * is to deactivate it, which stops it working immediately and keeps the record.
 */
export async function DELETE(request: Request, { params }: Params) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.query.offers.findFirst({ where: eq(offers.id, id) });
    if (!existing) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    const [used] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(bookings)
        .where(eq(bookings.offerId, id));

    if (Number(used.n) > 0 || (existing.usageCount ?? 0) > 0) {
        return NextResponse.json(
            {
                error: `This code has been used on ${used.n} booking(s) and cannot be deleted. Deactivate it instead — it will stop working immediately and the bookings keep their record.`,
            },
            { status: 409 },
        );
    }

    await db.delete(offers).where(eq(offers.id, id));
    return NextResponse.json({ ok: true });
}
