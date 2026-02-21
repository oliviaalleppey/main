import type { roomTypes } from '@/lib/db/schema';

type RoomTypeOccupancyShape = Pick<
    typeof roomTypes.$inferSelect,
    'name' | 'minOccupancy' | 'baseOccupancy' | 'maxGuests' | 'maxAdults' | 'maxChildren'
>;

type GuestMix = {
    adults: number;
    children: number;
};

export function resolveMaxChildren(roomType: RoomTypeOccupancyShape): number {
    if (typeof roomType.maxChildren === 'number' && roomType.maxChildren > 0) {
        return Math.max(0, roomType.maxChildren);
    }

    if (roomType.maxGuests > roomType.maxAdults) {
        return Math.max(0, roomType.maxGuests - roomType.maxAdults);
    }

    return Math.max(0, roomType.maxChildren || 0);
}

export function validateGuestMixForRoomType(
    roomType: RoomTypeOccupancyShape,
    guests: GuestMix,
    roomCount = 1,
): { valid: boolean; reason?: string } {
    const safeRoomCount = Math.max(1, Math.floor(roomCount || 1));
    const adults = Math.max(0, guests.adults || 0);
    const children = Math.max(0, guests.children || 0);
    const totalGuests = adults + children;
    const minGuests = Math.max(1, roomType.minOccupancy || 1) * safeRoomCount;
    const maxGuests = Math.max(1, roomType.maxGuests || 1) * safeRoomCount;
    const maxAdults = Math.max(1, roomType.maxAdults || 1) * safeRoomCount;
    const maxChildren = resolveMaxChildren(roomType) * safeRoomCount;

    if (adults < safeRoomCount) {
        return {
            valid: false,
            reason: `At least one adult is required per room (${safeRoomCount} adult${safeRoomCount === 1 ? '' : 's'} minimum).`,
        };
    }

    if (totalGuests < minGuests) {
        return {
            valid: false,
            reason: `${roomType.name} requires at least ${minGuests} guest${minGuests === 1 ? '' : 's'}.`,
        };
    }

    if (totalGuests > maxGuests) {
        return {
            valid: false,
            reason: `${roomType.name} allows up to ${maxGuests} guest${maxGuests === 1 ? '' : 's'} for ${safeRoomCount} room${safeRoomCount === 1 ? '' : 's'}.`,
        };
    }

    if (adults > maxAdults) {
        return {
            valid: false,
            reason: `${roomType.name} allows up to ${maxAdults} adult${maxAdults === 1 ? '' : 's'} for ${safeRoomCount} room${safeRoomCount === 1 ? '' : 's'}.`,
        };
    }

    if (children > maxChildren) {
        return {
            valid: false,
            reason: `${roomType.name} allows up to ${maxChildren} child${maxChildren === 1 ? '' : 'ren'}.`,
        };
    }

    return { valid: true };
}
