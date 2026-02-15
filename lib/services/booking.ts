import { db } from '../db';
import { roomInventory, roomTypes, bookingItems } from '../db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

/**
 * Check room availability for a date range
 * Returns available room count for each room type
 */
export async function checkAvailability(
    checkIn: Date,
    checkOut: Date,
    roomTypeId?: string
) {
    try {
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];

        // Get all room types or specific one
        const roomTypeFilter = roomTypeId
            ? eq(roomTypes.id, roomTypeId)
            : sql`1=1`;

        // Get room types with their total count
        const types = await db
            .select({
                id: roomTypes.id,
                name: roomTypes.name,
                basePrice: roomTypes.basePrice,
                totalRooms: sql<number>`count(distinct ${sql.identifier('rooms', 'id')})`,
            })
            .from(roomTypes)
            .leftJoin(sql`rooms`, eq(sql.identifier('rooms', 'room_type_id'), roomTypes.id))
            .where(and(
                roomTypeFilter,
                eq(roomTypes.status, 'active')
            ))
            .groupBy(roomTypes.id);

        // For each room type, check bookings in the date range
        const availability = await Promise.all(
            types.map(async (type) => {
                // Count booked rooms for this date range
                const bookedRooms = await db
                    .select({
                        count: sql<number>`count(distinct ${bookingItems.roomTypeId})`,
                    })
                    .from(bookingItems)
                    .innerJoin(sql`bookings`, eq(sql.identifier('bookings', 'id'), bookingItems.bookingId))
                    .where(and(
                        eq(bookingItems.roomTypeId, type.id),
                        sql`${sql.identifier('bookings', 'status')} IN ('confirmed', 'pending')`,
                        sql`${sql.identifier('bookings', 'check_in')} < ${checkOutStr}`,
                        sql`${sql.identifier('bookings', 'check_out')} > ${checkInStr}`
                    ));

                const booked = Number(bookedRooms[0]?.count || 0);
                const available = Math.max(0, type.totalRooms - booked);

                return {
                    roomTypeId: type.id,
                    roomTypeName: type.name,
                    totalRooms: type.totalRooms,
                    availableRooms: available,
                    basePrice: type.basePrice,
                };
            })
        );

        return availability;
    } catch (error) {
        console.error('Error checking availability:', error);
        throw new Error('Failed to check availability');
    }
}

/**
 * Calculate booking price
 * Simple logic: (base price × nights × rooms) + add-ons
 */
export function calculateBookingPrice(params: {
    basePrice: number;
    nights: number;
    rooms: number;
    addOns?: Array<{ price: number; quantity: number }>;
}) {
    const { basePrice, nights, rooms, addOns = [] } = params;

    // Subtotal = base price × nights × rooms
    const roomSubtotal = basePrice * nights * rooms;

    // Add-ons total
    const addOnsTotal = addOns.reduce(
        (sum, addon) => sum + addon.price * addon.quantity,
        0
    );

    const subtotal = roomSubtotal + addOnsTotal;

    // Tax (12% GST)
    const taxAmount = Math.round(subtotal * 0.12);

    // Total
    const totalAmount = subtotal + taxAmount;

    return {
        subtotal,
        taxAmount,
        totalAmount,
        roomSubtotal,
        addOnsTotal,
    };
}

/**
 * Generate unique booking number
 * Format: OIH-YYYYMMDD-XXXX
 */
export function generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);

    return `OIH-${year}${month}${day}-${random}`;
}

/**
 * Validate date range
 */
export function validateDateRange(checkIn: Date, checkOut: Date): {
    valid: boolean;
    error?: string;
} {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Check-in must be today or future
    if (checkIn < now) {
        return { valid: false, error: 'Check-in date cannot be in the past' };
    }

    // Check-out must be after check-in
    if (checkOut <= checkIn) {
        return { valid: false, error: 'Check-out must be after check-in' };
    }

    // Maximum 30 nights
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights > 30) {
        return { valid: false, error: 'Maximum stay is 30 nights' };
    }

    return { valid: true };
}

/**
 * Calculate number of nights
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
}
