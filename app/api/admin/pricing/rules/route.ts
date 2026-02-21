import { auth } from '@/auth';
import { db } from '@/lib/db';
import { pricingRules } from '@/lib/db/schema';
import { pricingRuleSchema } from '@/lib/validations/pricing';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = pricingRuleSchema.parse(body);

        const newRule = await db.insert(pricingRules).values({
            ...validated,
            roomTypeId: validated.roomTypeId || null,
        }).returning();

        return NextResponse.json(newRule[0]);
    } catch (error: any) {
        console.error('Error creating pricing rule:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create pricing rule' },
            { status: 400 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...data } = body;
        const validated = pricingRuleSchema.parse(data);

        const updated = await db.update(pricingRules)
            .set({
                ...validated,
                roomTypeId: validated.roomTypeId || null,
                updatedAt: new Date(),
            })
            .where(eq(pricingRules.id, id))
            .returning();

        if (!updated.length) {
            return NextResponse.json({ error: 'Pricing rule not found' }, { status: 404 });
        }

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating pricing rule:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update pricing rule' },
            { status: 400 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await db.delete(pricingRules).where(eq(pricingRules.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting pricing rule:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete pricing rule' },
            { status: 400 }
        );
    }
}
