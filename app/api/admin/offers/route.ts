import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { offers } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { normalizeCode } from '@/lib/services/offers';

/**
 * Promo code management.
 *
 * The `offers` table has existed since the original schema with no way to write
 * to it. Redemption was built first and worked perfectly against nothing — this
 * is the screen that lets the hotel actually create a code.
 *
 * Admin-only, like every other route under /api/admin. There is no middleware
 * covering this path (the `authorized` callback in auth.config.ts guards pages,
 * not API routes), so the check lives in the handler.
 */

export const dynamic = 'force-dynamic';

/**
 * Money arrives from the form in rupees and is stored in paise (gotcha 6).
 * The conversion happens once, here, at the boundary — a percentage's
 * `discountValue` is a plain number and must NOT be scaled, which is the easy
 * mistake to make when one field means two things.
 */
const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

const baseSchema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional().nullable(),
    // Meta of our own making: the code a guest types. Restricted to characters
    // that survive being read aloud over the phone and retyped.
    code: z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/, {
        message: 'Use letters, numbers, dashes and underscores only.',
    }),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minBookingAmountRupees: z.number().min(0).default(0),
    maxDiscountRupees: z.number().min(0).optional().nullable(),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    usageLimit: z.number().int().min(1).optional().nullable(),
    isActive: z.boolean().default(true),
})
    .refine((v) => v.validTo >= v.validFrom, {
        message: 'The end date cannot be before the start date.',
        path: ['validTo'],
    })
    .refine((v) => v.discountType !== 'percentage' || v.discountValue <= 100, {
        message: 'A percentage discount cannot exceed 100%.',
        path: ['discountValue'],
    });

async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') return null;
    return session;
}

export async function GET(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    // The campaign wizard asks for this: only codes it makes sense to advertise.
    const activeOnly = url.searchParams.get('active') === 'true';

    const rows = await db
        .select()
        .from(offers)
        .where(activeOnly
            ? sql`${offers.isActive} = true AND ${offers.validTo} >= (now() AT TIME ZONE 'Asia/Kolkata')::date`
            : undefined)
        .orderBy(desc(offers.createdAt));

    return NextResponse.json({ offers: rows });
}

export async function POST(request: Request) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = baseSchema.parse(await request.json());
        const code = normalizeCode(body.code);

        // `code` is unique in the schema, so this is a nicer error rather than
        // the only thing preventing a duplicate.
        const existing = await db.query.offers.findFirst({
            where: sql`upper(${offers.code}) = ${code}`,
        });
        if (existing) {
            return NextResponse.json(
                { error: `The code ${code} already exists.` },
                { status: 409 },
            );
        }

        const [created] = await db.insert(offers).values({
            title: body.title,
            description: body.description || null,
            code,
            discountType: body.discountType,
            // A percentage is a percentage; only a fixed amount is money.
            discountValue: body.discountType === 'fixed'
                ? rupeesToPaise(body.discountValue)
                : Math.round(body.discountValue),
            minBookingAmount: rupeesToPaise(body.minBookingAmountRupees),
            maxDiscount: body.maxDiscountRupees ? rupeesToPaise(body.maxDiscountRupees) : null,
            validFrom: body.validFrom,
            validTo: body.validTo,
            usageLimit: body.usageLimit ?? null,
            usageCount: 0,
            isActive: body.isActive,
        }).returning();

        return NextResponse.json({ offer: created }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message ?? 'Invalid offer', details: error.issues },
                { status: 400 },
            );
        }
        console.error('Offer create failed:', error);
        return NextResponse.json({ error: 'Could not create the offer' }, { status: 500 });
    }
}
