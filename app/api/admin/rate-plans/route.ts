import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ratePlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - List all rate plans
export async function GET() {
    try {
        const allRatePlans = await db.query.ratePlans.findMany({
            with: {
                roomType: true,
            },
            orderBy: (plans, { asc }) => [asc(plans.displayOrder)],
        });

        return NextResponse.json(allRatePlans);
    } catch (error) {
        console.error('Error fetching rate plans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rate plans' },
            { status: 500 }
        );
    }
}

// POST - Create new rate plan
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // If this is set as default, remove default from other rate plans for this room type
        if (data.isDefault) {
            await db
                .update(ratePlans)
                .set({ isDefault: false })
                .where(eq(ratePlans.roomTypeId, data.roomTypeId));
        }

        const [newRatePlan] = await db
            .insert(ratePlans)
            .values({
                name: data.name,
                code: data.code,
                roomTypeId: data.roomTypeId,
                description: data.description || null,
                basePriceModifier: data.basePriceModifier ?? 100,
                minLOS: data.minLOS ?? 1,
                maxLOS: data.maxLOS || null,
                includesBreakfast: data.includesBreakfast || false,
                includesAirportTransfer: data.includesAirportTransfer || false,
                includesLateCheckout: data.includesLateCheckout || false,
                includesSpa: data.includesSpa || false,
                includesDinner: data.includesDinner || false,
                inclusionsDescription: data.inclusionsDescription || null,
                cancellationPolicy: data.cancellationPolicy || 'moderate',
                cancellationDays: data.cancellationDays ?? 1,
                depositRequired: data.depositRequired ?? 0,
                depositAmount: data.depositAmount ?? 0,
                isActive: data.isActive ?? true,
                isDefault: data.isDefault || false,
                isPromotional: data.isPromotional || false,
                displayOrder: data.displayOrder ?? 0,
                bookableFrom: data.bookableFrom || null,
                bookableTo: data.bookableTo || null,
            })
            .returning();

        return NextResponse.json(newRatePlan, { status: 201 });
    } catch (error) {
        console.error('Error creating rate plan:', error);
        return NextResponse.json(
            { error: 'Failed to create rate plan' },
            { status: 500 }
        );
    }
}
