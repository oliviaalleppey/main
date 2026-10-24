import { auth } from '@/auth';
import { db } from '@/lib/db';
import { roomInventory, rooms } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

// GET blocked dates
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomTypeId = searchParams.get('roomTypeId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!roomTypeId) {
            return NextResponse.json({ error: 'roomTypeId is required' }, { status: 400 });
        }

        const conditions = [eq(roomInventory.roomTypeId, roomTypeId)];

        if (startDate && endDate) {
            conditions.push(
                gte(roomInventory.date, startDate),
                lte(roomInventory.date, endDate)
            );
        }

        const blockedDates = await db
            .select()
            .from(roomInventory)
            .where(and(...conditions));

        return NextResponse.json(blockedDates);
    } catch (error: any) {
        console.error('Error fetching blocked dates:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch blocked dates' },
            { status: 500 }
        );
    }
}

// POST - Block dates
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { roomTypeId, startDate, endDate, reason, notes, roomsToBlock } = body;

        if (!roomTypeId || !startDate || !endDate || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!Number.isInteger(roomsToBlock) || roomsToBlock < 1) {
            return NextResponse.json(
                { error: 'roomsToBlock must be a whole number of at least 1' },
                { status: 400 }
            );
        }

        // Get total rooms for this type
        const [{ count: activeRooms }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(rooms)
            .where(and(eq(rooms.roomTypeId, roomTypeId), eq(rooms.status, 'active')));
        const totalRooms = Number(activeRooms || 0);

        // Create blocks for each date in range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const blocks = [];

        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Check if inventory record exists
            const existing = await db.query.roomInventory.findFirst({
                where: and(
                    eq(roomInventory.roomTypeId, roomTypeId),
                    eq(roomInventory.date, dateStr)
                ),
            });

            if (existing) {
                // Update existing record
                const newBlockedRooms = Math.min(
                    (existing.blockedRooms || 0) + roomsToBlock,
                    totalRooms
                );
                await db
                    .update(roomInventory)
                    .set({
                        blockedRooms: newBlockedRooms,
                        availableRooms: Math.max(0, totalRooms - newBlockedRooms),
                        updatedAt: new Date(),
                    })
                    .where(eq(roomInventory.id, existing.id));
            } else {
                // Create new record
                blocks.push({
                    roomTypeId,
                    date: dateStr,
                    totalRooms,
                    availableRooms: Math.max(0, totalRooms - roomsToBlock),
                    blockedRooms: Math.min(roomsToBlock, totalRooms),
                    price: 0, // Will use base price
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (blocks.length > 0) {
            await db.insert(roomInventory).values(blocks);
        }

        return NextResponse.json({
            success: true,
            message: `Blocked ${roomsToBlock} room(s) from ${startDate} to ${endDate}`,
        });
    } catch (error: any) {
        console.error('Error blocking dates:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to block dates' },
            { status: 500 }
        );
    }
}

// DELETE - Remove block
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

        // Reset blocked rooms to 0
        await db
            .update(roomInventory)
            .set({
                blockedRooms: 0,
                availableRooms: sql`${roomInventory.totalRooms}`,
                updatedAt: new Date(),
            })
            .where(eq(roomInventory.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing block:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to remove block' },
            { status: 500 }
        );
    }
}
