import { db } from '../db';
import { roomTypes, roomInventory, ratePlans } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
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
): Promise<{ rooms: SearchResult[], error?: string }> {
    await ensureRoomTypeMinOccupancyColumn();
    const safeRoomCount = Math.min(8, Math.max(1, Math.floor(roomCount || 1)));

    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const adultsPerRoom = Math.max(1, Math.ceil(guests.adults / safeRoomCount));
    const childrenPerRoom = Math.max(0, Math.ceil(guests.children / safeRoomCount));

    // 1. Get all active room types from local DB (for content)
    const allRoomTypes = await db.query.roomTypes.findMany({
        where: eq(roomTypes.status, 'active'),
    });

    // Short-circuit: Ensure the requested party size mathematically fits into the largest possible room
    const maxHotelAdults = Math.max(...allRoomTypes.map(t => t.maxAdults ?? 0));
    const maxHotelChildren = Math.max(...allRoomTypes.map(t => t.maxChildren ?? 0));
    const maxHotelGuests = Math.max(...allRoomTypes.map(t => t.maxGuests ?? 0));

    if (adultsPerRoom > maxHotelAdults || childrenPerRoom > maxHotelChildren || (adultsPerRoom + childrenPerRoom) > maxHotelGuests) {
        return { 
            rooms: [], 
            error: `We're sorry! Rooms at this property can accommodate up to ${maxHotelAdults} adults, ${maxHotelChildren} children, and ${maxHotelGuests} total guests per room. Please split your search into multiple rooms to accommodate your group.` 
        };
    }

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
        // In Next.js dev, console.error triggers the red overlay. This failure is often expected
        // (e.g. CRS not configured/reachable), so keep it as a warning.
        console.warn(`[${provider.source}] Availability unavailable`, message);

        // Even in strict mode, return room types with a clear message (not bookable),
        // so the UI can explain the situation instead of looking like "0 rooms exist".
        return {
            rooms: allRoomTypes.map((type) => {
                const totalPrice = type.basePrice * nights;
                const taxRateDecimal = ((type as { taxRate?: number }).taxRate ?? 12) / 100;
                return {
                    roomType: type,
                    price: type.basePrice,
                    totalPrice,
                    taxesAndFees: Math.round(totalPrice * taxRateDecimal),
                    breakdown: [],
                    available: false,
                    availableRooms: 0,
                    ratePlans: [],
                    bookable: false,
                    availabilityMessage: message,
                };
            })
        };
    }

    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];
    
    // Fetch local pricing overrides for the exact search window
    const inventoryOverrides = await db
        .select()
        .from(roomInventory)
        .where(and(
            gte(roomInventory.date, checkInStr),
            lte(roomInventory.date, checkOutStr)
        ));
        
    // Fetch all active local rate plans for later mapping
    const localRatePlans = await db.query.ratePlans.findMany({
        where: eq(ratePlans.isActive, true)
    });

    // Create a quick lookup map: "roomTypeId_date" -> price
    const overrideMap = new Map<string, number>();
    for (const inv of inventoryOverrides) {
        overrideMap.set(`${inv.roomTypeId}_${inv.date}`, inv.price);
    }

    const results: SearchResult[] = [];

    // 3. Map API results to Local Room Types
    for (const type of allRoomTypes) {
        // Strictly enforce local constraints regardless of external CRS capability
        if (adultsPerRoom > (type.maxAdults ?? 10)) continue;
        if (childrenPerRoom > (type.maxChildren ?? 10)) continue;
        if ((adultsPerRoom + childrenPerRoom) > (type.maxGuests ?? 10)) continue;

        const apiRoom = availability.rooms.find((room) => mapCrsRoomTypeMatchesInternal({
            internalRoomTypeId: type.id,
            internalRoomTypeSlug: type.slug,
            crsRoomTypeId: room.roomTypeId,
        }));

        if (apiRoom && apiRoom.availableCount > 0) {
            const bestRate = [...apiRoom.ratePlans].sort((a, b) => a.amount - b.amount)[0];
            const baseCrsPrice = bestRate ? bestRate.amount : apiRoom.price;

            // Calculate extra person surcharge mathematically
            const extraAdults = Math.max(0, adultsPerRoom - (type.baseOccupancy ?? 2));
            const coveredAdults = Math.min(adultsPerRoom, (type.baseOccupancy ?? 2));
            const remainingCoveredGuests = Math.max(0, (type.baseOccupancy ?? 2) - coveredAdults);
            const extraChildren = Math.max(0, childrenPerRoom - remainingCoveredGuests);
            const extraPersonSurchargePerNight = (extraAdults * (type.extraAdultPrice ?? 0)) + (extraChildren * (type.extraChildPrice ?? 0));

            // Calculate total price day-by-day honoring local overrides
            let totalPrice = 0;
            const current = new Date(checkIn);
            for (let i = 0; i < nights; i++) {
                const dateStr = current.toISOString().split('T')[0];
                const override = overrideMap.get(`${type.id}_${dateStr}`);
                
                // Nightly Base is either Override or API Base. Then ADD the extra person surcharge explicitly.
                const nightlyBase = override !== undefined ? override : baseCrsPrice;
                totalPrice += (nightlyBase + extraPersonSurchargePerNight);

                current.setDate(current.getDate() + 1);
            }
            
            const pricePerNight = Math.round(totalPrice / nights);
            const taxRateDecimal = ((type as { taxRate?: number }).taxRate ?? 12) / 100;
            const taxes = Math.round(totalPrice * taxRateDecimal);

            // Construct local rate plans matching the CRSRatePlan interface, enriched with local DB flags
            const roomRatePlans = localRatePlans
                .filter(rp => rp.roomTypeId === type.id)
                .map(rp => {
                    const rawPrice = Math.round(pricePerNight * ((rp.basePriceModifier ?? 100) / 100));
                    const inclusions = [];
                    if (rp.includesBreakfast) inclusions.push('Breakfast included');
                    if (rp.includesAirportTransfer) inclusions.push('Airport Transfer');
                    if (rp.includesLateCheckout) inclusions.push('Late Checkout');
                    if (rp.includesSpa) inclusions.push('Spa access');
                    if (rp.includesDinner) inclusions.push('Dinner included');
                    if (rp.inclusionsDescription) {
                        inclusions.push(...rp.inclusionsDescription.split(',').map(s => s.trim()).filter(Boolean));
                    }
                    
                    return {
                        id: rp.id,
                        name: rp.name,
                        amount: rawPrice,
                        tax: Math.round(rawPrice * taxRateDecimal),
                        currency: 'INR',
                        description: rp.description || '',
                        inclusions: inclusions,
                        cancellationPolicy: rp.cancellationPolicy?.replace('_', ' ') || 'moderate',
                        // Extend interface dynamically for frontend UI decorators
                        isDefault: rp.isDefault,
                        basePriceModifier: rp.basePriceModifier,
                        originalBasePrice: pricePerNight
                    } as any;
                });

            // Fallback to CRS rate plans if NO local rate plans exist at all
            const finalizedRatePlans = roomRatePlans.length > 0 ? roomRatePlans : apiRoom.ratePlans;

            results.push({
                roomType: type,
                price: pricePerNight,
                totalPrice,
                taxesAndFees: taxes,
                breakdown: [],
                available: true,
                availableRooms: apiRoom.availableCount,
                ratePlans: finalizedRatePlans,
                bookable: true,
            });
        }
    }

    return { rooms: results };
}
