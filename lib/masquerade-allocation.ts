// Which rooms a 31st Night booking gets: the most expensive room type that still has a free room goes first,
// then the next, down to the cheapest. Pure on purpose, so the rule can be tested without a database.

export interface RoomTypeStock {
    roomTypeId: string;
    name: string;
    /** What the room sells for that night, in paise. Only used to put the types in order. */
    pricePaise: number;
    /** Rooms still free: the hotel's count minus rooms already held or paid for. */
    available: number;
}

export type AllocationResult =
    | { ok: true; rooms: { roomTypeId: string; name: string }[] }
    | { ok: false; requested: number; available: number };

/** Highest price first. Equal prices fall back to the name so the order never changes between requests. */
export function orderByPriceDescending<T extends { pricePaise: number; name: string }>(stock: T[]): T[] {
    return [...stock].sort((a, b) => b.pricePaise - a.pricePaise || a.name.localeCompare(b.name));
}

export function totalAvailable(stock: RoomTypeStock[]): number {
    return stock.reduce((sum, t) => sum + Math.max(0, Math.floor(t.available)), 0);
}

/**
 * Gives out `requested` rooms from the top of the price list. All or nothing: a guest who asks for three rooms
 * when two are left gets nothing, rather than a part-booking they did not agree to.
 */
export function allocateRooms(stock: RoomTypeStock[], requested: number): AllocationResult {
    const wanted = Math.max(0, Math.floor(requested));
    const available = totalAvailable(stock);
    if (wanted < 1 || available < wanted) return { ok: false, requested: wanted, available };

    const rooms: { roomTypeId: string; name: string }[] = [];
    for (const type of orderByPriceDescending(stock)) {
        let left = Math.max(0, Math.floor(type.available));
        while (left > 0 && rooms.length < wanted) {
            rooms.push({ roomTypeId: type.roomTypeId, name: type.name });
            left -= 1;
        }
        if (rooms.length === wanted) break;
    }
    return { ok: true, rooms };
}
