import { auth } from '@/auth';
import { db } from '@/lib/db';
import { roomInventory, rooms, roomTypes } from '@/lib/db/schema';
import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { addDays, format, isAfter, startOfDay } from 'date-fns';

function toISODateString(value: string) {
    // expects YYYY-MM-DD (same as existing validations)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }
    return value;
}

async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return null;
    }
    return session;
}

export async function GET(request: Request) {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const roomTypeId = searchParams.get('roomTypeId');
        const datesRaw = searchParams.get('dates'); // comma-separated YYYY-MM-DD
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!roomTypeId) {
            return NextResponse.json({ error: 'roomTypeId is required' }, { status: 400 });
        }

        const dateList = datesRaw
            ? Array.from(new Set(
                datesRaw
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map(toISODateString)
            ))
            : [];

        if (dateList.length === 0 && (!startDate || !endDate)) {
            return NextResponse.json(
                { error: 'Provide either dates=YYYY-MM-DD,... or startDate/endDate' },
                { status: 400 }
            );
        }

        const rows = await db
            .select({
                id: roomInventory.id,
                date: roomInventory.date,
                price: roomInventory.price,
                totalRooms: roomInventory.totalRooms,
                availableRooms: roomInventory.availableRooms,
            })
            .from(roomInventory)
            .where(dateList.length > 0
                ? and(
                    eq(roomInventory.roomTypeId, roomTypeId),
                    inArray(roomInventory.date, dateList)
                )
                : and(
                    eq(roomInventory.roomTypeId, roomTypeId),
                    gte(roomInventory.date, toISODateString(startDate!)),
                    lte(roomInventory.date, toISODateString(endDate!))
                ))
            .orderBy(asc(roomInventory.date));

        return NextResponse.json({ items: rows });
    } catch (error: any) {
        console.error('Error fetching pricing inventory:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch pricing inventory' }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await requireAdmin();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const roomTypeId = typeof body?.roomTypeId === 'string' ? body.roomTypeId : '';
        const startDate = typeof body?.startDate === 'string' ? body.startDate : '';
        const endDate = typeof body?.endDate === 'string' ? body.endDate : '';
        const datesRaw = body?.dates;
        const priceRupees = Number(body?.priceRupees);

        if (!roomTypeId || !Number.isFinite(priceRupees)) {
            return NextResponse.json({ error: 'roomTypeId and priceRupees are required' }, { status: 400 });
        }

        const dates: string[] = Array.isArray(datesRaw)
            ? Array.from(new Set(
                datesRaw
                    .map((entry) => typeof entry === 'string' ? entry.trim() : '')
                    .filter(Boolean)
                    .map(toISODateString)
            ))
            : [];

        const hasRange = Boolean(startDate && endDate);
        if (dates.length === 0 && !hasRange) {
            return NextResponse.json(
                { error: 'Provide either dates: string[] or startDate/endDate' },
                { status: 400 }
            );
        }

        const rangeStart = hasRange ? startOfDay(new Date(toISODateString(startDate))) : null;
        const rangeEnd = hasRange ? startOfDay(new Date(toISODateString(endDate))) : null;
        if (rangeStart && rangeEnd && isAfter(rangeStart, rangeEnd)) {
            return NextResponse.json({ error: 'startDate must be before or equal to endDate' }, { status: 400 });
        }

        const pricePaise = Math.max(0, Math.round(priceRupees * 100));

        const roomType = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.id, roomTypeId),
            columns: { id: true },
        });
        if (!roomType) return NextResponse.json({ error: 'Room type not found' }, { status: 404 });

        const totalRoomsResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(rooms)
            .where(eq(rooms.roomTypeId, roomTypeId));
        const totalRooms = Math.max(0, Number(totalRoomsResult[0]?.count || 0));

        const updates: Array<{ date: string; id: string }> = [];
        const applyForDate = async (dateStr: string) => {
            const existing = await db.query.roomInventory.findFirst({
                where: and(eq(roomInventory.roomTypeId, roomTypeId), eq(roomInventory.date, dateStr)),
            });

            if (existing) {
                await db.update(roomInventory)
                    .set({
                        price: pricePaise,
                        updatedAt: new Date(),
                    })
                    .where(eq(roomInventory.id, existing.id));
                updates.push({ date: dateStr, id: existing.id });
            } else {
                const [created] = await db.insert(roomInventory).values({
                    roomTypeId,
                    date: dateStr,
                    totalRooms,
                    availableRooms: totalRooms,
                    blockedRooms: 0,
                    price: pricePaise,
                }).returning({ id: roomInventory.id });

                updates.push({ date: dateStr, id: created.id });
            }
        };

        if (dates.length > 0) {
            for (const dateStr of dates) {
                await applyForDate(dateStr);
            }
        } else {
            let cursor = rangeStart!;
            while (!isAfter(cursor, rangeEnd!)) {
                const dateStr = format(cursor, 'yyyy-MM-dd');
                await applyForDate(dateStr);
                cursor = addDays(cursor, 1);
            }
        }

        return NextResponse.json({ success: true, updates });
    } catch (error: any) {
        console.error('Error saving pricing inventory:', error);
        return NextResponse.json({ error: error.message || 'Failed to save pricing inventory' }, { status: 400 });
    }
}

