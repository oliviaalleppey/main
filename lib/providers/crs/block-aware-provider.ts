import { and, eq, gt, gte, lt, max, inArray } from 'drizzle-orm';
import { mapCrsRoomTypeMatchesInternal } from '@/lib/config/crs';
import { db } from '@/lib/db';
import { roomInventory, roomTypes } from '@/lib/db/schema';
import type {
    BookingProvider,
    CRSAvailabilityRequest,
    CRSAvailabilityResponse,
    CRSCreateReservationRequest,
} from './types';

/**
 * Applies the admin's "Block Dates" rooms on top of whatever the CRS reports.
 *
 * The admin screen writes `room_inventory.blocked_rooms`, but availability comes
 * live from Hotsoft, which knows nothing about those rows, so a blocked date
 * stayed bookable online. Wrapping the provider means every pre-payment
 * availability check (search, checkout, quote, booking start, calendar) sees the
 * same reduced count, with no per-caller changes.
 *
 * Only `checkAvailability` is touched. `createReservation` runs after payment;
 * refusing it there would take a guest's money and then reject the booking.
 */
export class BlockAwareProvider implements BookingProvider {
    private readonly inner: BookingProvider;

    constructor(inner: BookingProvider) {
        this.inner = inner;
    }

    get source() {
        return this.inner.source;
    }

    createReservation(request: CRSCreateReservationRequest) {
        return this.inner.createReservation(request);
    }

    async checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse> {
        const response = await this.inner.checkAvailability(request);
        if (response.status !== 'success' || response.rooms.length === 0) return response;

        // A stay occupies the nights [checkIn, checkOut); the check-out date itself is free.
        const blockedByType = await db
            .select({
                roomTypeId: roomInventory.roomTypeId,
                blocked: max(roomInventory.blockedRooms),
            })
            .from(roomInventory)
            .where(and(
                gte(roomInventory.date, request.checkIn),
                lt(roomInventory.date, request.checkOut),
                gt(roomInventory.blockedRooms, 0),
            ))
            .groupBy(roomInventory.roomTypeId);

        if (blockedByType.length === 0) return response;

        const types = await db
            .select({ id: roomTypes.id, slug: roomTypes.slug })
            .from(roomTypes)
            .where(inArray(roomTypes.id, blockedByType.map((row) => row.roomTypeId)));

        return {
            ...response,
            rooms: response.rooms.map((room) => {
                const blockedRooms = blockedByType.reduce((total, row) => {
                    const type = types.find((t) => t.id === row.roomTypeId);
                    if (!type) return total;
                    const matches = mapCrsRoomTypeMatchesInternal({
                        internalRoomTypeId: type.id,
                        internalRoomTypeSlug: type.slug,
                        crsRoomTypeId: room.roomTypeId,
                    });
                    return matches ? total + Number(row.blocked ?? 0) : total;
                }, 0);

                if (blockedRooms === 0) return room;
                return { ...room, availableCount: Math.max(0, room.availableCount - blockedRooms) };
            }),
        };
    }
}
