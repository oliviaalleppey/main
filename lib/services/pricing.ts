import { db } from '../db';
import { roomTypes, roomInventory, pricingRules, occupancyPricing, bookings, bookingItems, rooms } from '../db/schema';
import { and, eq, gte, lte, sql, desc } from 'drizzle-orm';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export interface PricingContext {
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guests?: number | { adults: number; children: number };
}

export interface PricingResult {
    basePrice: number;
    finalPrice: number;
    appliedRules: string[];
    occupancyRate: number;
    breakdown: {
        basePricePerNight: number;
        seasonalAdjustment: number;
        occupancyAdjustment: number;
        extraPersonCharge: number;
        finalPricePerNight: number;
    };
}

/**
 * Calculate occupancy rate for a room type in a date range
 */
async function calculateOccupancyRate(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date
): Promise<number> {
    await ensureRoomTypeMinOccupancyColumn();

    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];

    // Get total rooms for this type
    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, roomTypeId),
    });

    if (!roomType) return 0;

    // Count total rooms
    const totalRoomsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(db.select().from(rooms).where(eq(rooms.roomTypeId, roomTypeId)).as('rooms'));

    const totalRooms = Number(totalRoomsResult[0]?.count || 0);
    if (totalRooms === 0) return 0;

    // Count booked rooms in this date range
    const bookedRoomsResult = await db
        .select({ count: sql<number>`count(distinct ${bookingItems.roomTypeId})` })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(and(
            eq(bookingItems.roomTypeId, roomTypeId),
            sql`${bookings.status} IN ('confirmed', 'pending')`,
            sql`${bookings.checkIn} < ${checkOutStr}`,
            sql`${bookings.checkOut} > ${checkInStr}`
        ));

    const bookedRooms = Number(bookedRoomsResult[0]?.count || 0);

    return Math.round((bookedRooms / totalRooms) * 100);
}

/**
 * Calculate dynamic price for a room type based on dates and occupancy
 */
export async function calculateDynamicPrice(context: PricingContext): Promise<PricingResult> {
    const { roomTypeId, checkIn, checkOut } = context;

    try {
        await ensureRoomTypeMinOccupancyColumn();

        // 1. Get base price
        const roomType = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.id, roomTypeId),
        });

        if (!roomType) {
            throw new Error('Room type not found');
        }

        let currentPrice = roomType.basePrice;
        const appliedRules: string[] = [];
        let seasonalAdjustment = 0;
        let occupancyAdjustment = 0;

        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];

        // 2. Check for date-specific overrides in roomInventory
        const inventoryOverrides = await db.select()
            .from(roomInventory)
            .where(and(
                eq(roomInventory.roomTypeId, roomTypeId),
                gte(roomInventory.date, checkInStr),
                lte(roomInventory.date, checkOutStr)
            ))
            .limit(1);

        if (inventoryOverrides.length > 0 && inventoryOverrides[0].price) {
            currentPrice = inventoryOverrides[0].price;
            appliedRules.push('Date-specific override');
        }

        // 3. Apply seasonal pricing rules
        const applicableRules = await db.select()
            .from(pricingRules)
            .where(and(
                eq(pricingRules.isActive, true),
                lte(pricingRules.startDate, checkOutStr),
                gte(pricingRules.endDate, checkInStr),
                sql`(${pricingRules.roomTypeId} = ${roomTypeId} OR ${pricingRules.roomTypeId} IS NULL)`
            ))
            .orderBy(desc(pricingRules.priority));

        // Apply the highest priority rule
        if (applicableRules.length > 0) {
            const rule = applicableRules[0];
            const adjustment = Math.round(currentPrice * ((rule.priceModifier - 100) / 100));
            seasonalAdjustment = adjustment;
            currentPrice = Math.round(currentPrice * (rule.priceModifier / 100));
            appliedRules.push(rule.name);
        }

        // 4. Apply occupancy-based pricing
        const currentOccupancy = await calculateOccupancyRate(roomTypeId, checkIn, checkOut);

        const occupancyRule = await db.query.occupancyPricing.findFirst({
            where: and(
                eq(occupancyPricing.roomTypeId, roomTypeId),
                eq(occupancyPricing.isActive, true),
                gte(occupancyPricing.maxOccupancy, currentOccupancy),
                lte(occupancyPricing.minOccupancy, currentOccupancy)
            ),
        });

        if (occupancyRule) {
            const adjustment = Math.round(currentPrice * ((occupancyRule.priceModifier - 100) / 100));
            occupancyAdjustment = adjustment;
            currentPrice = Math.round(currentPrice * (occupancyRule.priceModifier / 100));
            appliedRules.push(`Occupancy ${currentOccupancy}%`);
        }

        // 5. Apply Extra Person Pricing
        const totalGuests = (context.guests || 2); // Default to 2 if not provided
        const baseOccupancy = roomType.baseOccupancy || 2;
        let extraPersonCharge = 0;

        // This is a simplified logic where we don't distinguish adults/children strictly for the COUNT,
        // but ideally we should. context.guests should probably be { adults: number, children: number }
        // For now, let's assume if context.guests is just a number, we treat excess as adults?
        // Or better yet, strict typed check.

        // Use default of 2 adults if breakdown not provided
        const guests = typeof context.guests === 'object' ? context.guests : { adults: context.guests || 2, children: 0 };

        // Calculate extra adults
        const extraAdults = Math.max(0, guests.adults - baseOccupancy);
        // If adults alone don't exceed base occupancy, we might still have "unused" base slots for children?
        // Usually base occupancy covers X people. 
        // Logic: 
        // Slots used by adults = guests.adults
        // Remaining base slots = max(0, baseOccupancy - guests.adults)
        // Chargeable children = max(0, guests.children - Remaining base slots)

        const remainingBaseSlots = Math.max(0, baseOccupancy - guests.adults);
        const extraChildren = Math.max(0, guests.children - remainingBaseSlots);

        const extraAdultCost = extraAdults * (roomType.extraAdultPrice || 0);
        const extraChildCost = extraChildren * (roomType.extraChildPrice || 0);

        extraPersonCharge = extraAdultCost + extraChildCost;

        if (extraPersonCharge > 0) {
            currentPrice += extraPersonCharge;
            appliedRules.push(`Extra person charges: ₹${extraPersonCharge / 100}`);
        }

        return {
            basePrice: roomType.basePrice,
            finalPrice: currentPrice,
            appliedRules,
            occupancyRate: currentOccupancy,
            breakdown: {
                basePricePerNight: roomType.basePrice,
                seasonalAdjustment,
                occupancyAdjustment,
                extraPersonCharge,
                finalPricePerNight: currentPrice,
            },
        };
    } catch (error) {
        console.error('Error calculating dynamic price:', error);
        throw new Error('Failed to calculate price');
    }
}

/**
 * Get pricing preview for multiple dates
 */
export async function getPricingPreview(
    roomTypeId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ date: string; price: number; appliedRules: string[] }>> {
    const preview: Array<{ date: string; price: number; appliedRules: string[] }> = [];

    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const pricing = await calculateDynamicPrice({
            roomTypeId,
            checkIn: currentDate,
            checkOut: nextDate,
        });

        preview.push({
            date: currentDate.toISOString().split('T')[0],
            price: pricing.finalPrice,
            appliedRules: pricing.appliedRules,
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return preview;
}
