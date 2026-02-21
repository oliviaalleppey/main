
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const statusSchema = z.object({
    housekeepingStatus: z.enum(['clean', 'dirty', 'touch_up', 'inspect', 'out_of_service']),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { housekeepingStatus } = statusSchema.parse(body);

        await db.update(rooms)
            .set({
                housekeepingStatus,
                lastCleanedAt: housekeepingStatus === 'clean' ? new Date() : undefined
            })
            .where(eq(rooms.id, id));

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating room status:', error);
        return NextResponse.json(
            { message: 'Failed to update status' },
            { status: 500 }
        );
    }
}
