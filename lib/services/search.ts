import { db } from '../db';
import { roomTypes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { BOOKING_FLOW_MODE } from '@/lib/config/booking-flow-mode';
import { mapCrsRoomTypeMatchesInternal } from '@/lib/config/crs';
import { getBookingProvider } from '@/lib/providers/crs/factory';
import type { CRSRatePlan } from '@/lib/providers/crs/types';
import { ensureRoomTypeMinOccupancyColumn } from '@/lib/db/schema-guard';

export interface SearchResult {
    roomType: typeof roomTypes.$inferSelect;
    price: number;
    totalPrice: number;
    taxesAndFees: number;
    breakdown: { label: string; amount: number }[];
    available: boolean;
    availableRooms: number;
    ratePlans: CRSRatePlan[];
    bookable: boolean;
    availabilityMessage?: string;
}

export async function getAvailableRoomsForSearch(
    checkIn: Date,
    checkOut: Date,
    guests: { adults: number; children: number },
    roomCount = 1
): Promise<SearchResult[]> {
    await ensureRoomTypeMinOccupancyColumn();
    const safeRoomCount = Math.min(8, Math.max(1, Math.floor(roomCount || 1)));

    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const adultsPerRoom = Math.max(1, Math.ceil(guests.adults / safeRoomCount));
    const childrenPerRoom = Math.max(0, Math.ceil(guests.children / safeRoomCount));

    // 1. Get all active room types from local DB (for content)
    const allRoomTypes = await db.query.roomTypes.findMany({
        where: eq(roomTypes.status, 'active'),
    });

    // 2. Call booking provider (CRS-backed)
    const provider = getBookingProvider();
    const availability = await provider.checkAvailability({
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        adults: adultsPerRoom,
        children: childrenPerRoom
    });

    if (availability.status !== 'success') {
        const message = availability.message || 'Live inventory temporarily unavailable';
        console.error(`[${provider.source}] Availability failed`, message);

        if (BOOKING_FLOW_MODE === 'strict') {
            return [];
        }

        return allRoomTypes.map((type) => {
            const totalPrice = type.basePrice * nights;
            return {
                roomType: type,
                price: type.basePrice,
                totalPrice,
                taxesAndFees: Math.round(totalPrice * 0.18),
                breakdown: [],
                available: false,
                availableRooms: 0,
                ratePlans: [],
                bookable: false,
                availabilityMessage: message,
            };
        });
    }

    const results: SearchResult[] = [];

    // 3. Map API results to Local Room Types
    for (const type of allRoomTypes) {
        const apiRoom = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: type.id,
            internalRoomTypeSlug: type.slug,
            crsRoomTypeId: room.roomTypeId,
        }));

        if (apiRoom && apiRoom.availableCount > 0) {
            const bestRate = [...apiRoom.ratePlans].sort((a, b) => a.amount - b.amount)[0];

            const pricePerNight = bestRate ? bestRate.amount : apiRoom.price;
            const totalPrice = pricePerNight * nights;
            const taxes = Math.round(totalPrice * 0.18);

            results.push({
                roomType: type,
                price: pricePerNight,
                totalPrice,
                taxesAndFees: taxes,
                breakdown: [],
                available: true,
                availableRooms: apiRoom.availableCount,
                ratePlans: apiRoom.ratePlans,
                bookable: true,
            });
        }
    }

    return results;
}
