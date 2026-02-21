import { addDays, format as formatDate } from 'date-fns';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { BOOKING_FLOW_MODE } from '@/lib/config/booking-flow-mode';
import { mapCrsRoomTypeMatchesInternal } from '@/lib/config/crs';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import { db } from '../db';
import { bookingItems, bookings, rooms, roomTypes } from '../db/schema';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export interface AvailabilityDay {
    date: string;
    totalRooms: number;
    availableRooms: number;
    blockedRooms: number;
    bookedRooms: number;
    price: number;
    minStay: number;
    status: 'available' | 'limited' | 'sold-out' | 'blocked';
}

export interface AvailabilityCalendar {
    roomTypeId: string;
    roomTypeName: string;
    month: number;
    year: number;
    days: AvailabilityDay[];
    warning?: string;
}

function toDateString(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd');
}

function toCalendarStatus(params: {
    availableRooms: number;
    totalRooms: number;
}): AvailabilityDay['status'] {
    const { availableRooms, totalRooms } = params;
    if (availableRooms <= 0) return 'sold-out';

    const limitedThreshold = Math.max(2, Math.floor(totalRooms * 0.3));
    if (availableRooms <= limitedThreshold) return 'limited';

    return 'available';
}

/**
 * Get availability calendar for a room type
 */
export async function getAvailabilityCalendar(params: {
    roomTypeId: string;
    startDate: Date;
    endDate: Date;
}): Promise<AvailabilityCalendar> {
    await ensureRoomTypeMinOccupancyColumn();

    const { roomTypeId, startDate, endDate } = params;

    // Get room type info
    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, roomTypeId),
    });

    if (!roomType) {
        throw new Error('Room type not found');
    }

    // Local room count is only used as display metadata.
    const totalRoomsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(rooms)
        .where(and(
            eq(rooms.roomTypeId, roomTypeId),
            eq(rooms.status, 'active')
        ));

    const localTotalRooms = Number(totalRoomsResult[0]?.count || 0);
    const provider = getBookingProvider();

    const availability = await provider.checkAvailability({
        checkIn: toDateString(startDate),
        checkOut: toDateString(addDays(endDate, 1)),
        adults: 2,
        children: 0,
    });

    if (availability.status !== 'success' && BOOKING_FLOW_MODE === 'strict') {
        throw new Error(availability.message || 'Provider availability failed');
    }

    const providerFailed = availability.status !== 'success';
    const roomAvailability = providerFailed
        ? undefined
        : availability.rooms.find((room) =>
            mapCrsRoomTypeMatchesInternal({
                internalRoomTypeId: roomType.id,
                internalRoomTypeSlug: roomType.slug,
                crsRoomTypeId: room.roomTypeId,
            })
        );

    const availableRoomsFromProvider = providerFailed ? 0 : (roomAvailability?.availableCount || 0);
    const totalRooms = Math.max(localTotalRooms, availableRoomsFromProvider, 1);
    const bookedRooms = providerFailed ? totalRooms : Math.max(0, totalRooms - availableRoomsFromProvider);
    const lowestRate = roomAvailability?.ratePlans?.length
        ? [...roomAvailability.ratePlans].sort((a, b) => a.amount - b.amount)[0].amount
        : roomAvailability?.price;
    const price = lowestRate || roomType.basePrice;
    const status = providerFailed
        ? 'sold-out'
        : toCalendarStatus({
            availableRooms: availableRoomsFromProvider,
            totalRooms,
        });

    const days: AvailabilityDay[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        const dateStr = toDateString(currentDate);

        days.push({
            date: dateStr,
            totalRooms,
            availableRooms: availableRoomsFromProvider,
            blockedRooms: 0,
            bookedRooms,
            price,
            minStay: 1,
            status,
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        roomTypeId,
        roomTypeName: roomType.name,
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
        days,
        warning: providerFailed ? (availability.message || 'Live availability temporarily unavailable') : undefined,
    };
}

/**
 * Check if rooms are available for a specific date range
 */
export async function checkAvailability(params: {
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    rooms: number;
}): Promise<{
    available: boolean;
    availableRooms: number;
    message?: string;
}> {
    await ensureRoomTypeMinOccupancyColumn();

    const { roomTypeId, checkIn, checkOut, rooms: requestedRooms } = params;
    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, roomTypeId),
        columns: { id: true, slug: true },
    });

    if (!roomType) {
        return {
            available: false,
            availableRooms: 0,
            message: 'Room type not found',
        };
    }

    const provider = getBookingProvider();
    const availability = await provider.checkAvailability({
        checkIn: toDateString(checkIn),
        checkOut: toDateString(checkOut),
        adults: 2,
        children: 0,
    });

    if (availability.status !== 'success') {
        return {
            available: false,
            availableRooms: 0,
            message: availability.message || 'Availability provider error',
        };
    }

    const roomAvailability = availability.rooms.find((room) =>
        mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: roomType.id,
            internalRoomTypeSlug: roomType.slug,
            crsRoomTypeId: room.roomTypeId,
        })
    );

    const availableRooms = roomAvailability?.availableCount || 0;
    const available = availableRooms >= requestedRooms;

    return {
        available,
        availableRooms,
        message: available
            ? `${availableRooms} room(s) available`
            : `Only ${availableRooms} room(s) available, you requested ${requestedRooms}`,
    };
}

/**
 * Get available room numbers for assignment
 */
export async function getAvailableRoomNumbers(params: {
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
}): Promise<string[]> {
    const { roomTypeId, checkIn, checkOut } = params;

    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];

    // Get all rooms of this type
    const allRooms = await db
        .select()
        .from(rooms)
        .where(and(
            eq(rooms.roomTypeId, roomTypeId),
            eq(rooms.status, 'active')
        ));

    // Get booked room IDs
    const bookedRoomIds = await db
        .select({ roomId: bookingItems.roomId })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(and(
            eq(bookingItems.roomTypeId, roomTypeId),
            inArray(bookings.status, ['confirmed', 'pending']),
            sql`${bookings.checkIn} < ${checkOutStr}`,
            sql`${bookings.checkOut} > ${checkInStr}`
        ));

    const bookedIds = new Set(bookedRoomIds.map(r => r.roomId).filter(Boolean));

    // Filter available rooms
    const availableRooms = allRooms
        .filter(room => !bookedIds.has(room.id))
        .map(room => room.roomNumber);

    return availableRooms;
}
