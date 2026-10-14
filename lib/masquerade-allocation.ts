// Which rooms a 31st Night booking gets. The hotel chose the order: the first guest to pay gets the first room type
// on this list that still has a free room, the next guest the next, and so on down. Pure on purpose, so the rule
// can be tested without a database.

/** The order the hotel sells the rooms in, by room type slug. The first name goes first. */
export const MASQUERADE_SELL_ORDER = [
    'boat-race-suite',
    'lake-view-balcony-suite',
    'canal-view-superior-family',
    'lake-view-balcony',
    'lake-view-twin',
    'canal-view-king',
] as const;

/** Where a room type sits in the selling order, or undefined if the hotel has not placed it. */
export function sellRankForSlug(slug: string | null | undefined): number | undefined {
    const i = MASQUERADE_SELL_ORDER.indexOf((slug ?? '') as (typeof MASQUERADE_SELL_ORDER)[number]);
    return i === -1 ? undefined : i;
}

export interface RoomTypeStock {
    roomTypeId: string;
    name: string;
    /** What the room sells for that night, in paise. Orders any room types the hotel has not placed in the list. */
    pricePaise: number;
    /** Position in the hotel's selling order (0 sells first). Room types without one are sold after those with one. */
    sellRank?: number;
    /** Rooms still free: the hotel's count minus rooms already held or paid for. */
    available: number;
}

export type AllocationResult =
    | { ok: true; rooms: { roomTypeId: string; name: string }[] }
    | { ok: false; requested: number; available: number };

/**
 * The order rooms are sold in: the hotel's list first, then anything not on it by price, highest first. Equal
 * ranks and prices fall back to the name so the order never changes between requests.
 */
export function orderForSale<T extends { pricePaise: number; name: string; sellRank?: number }>(stock: T[]): T[] {
    const rank = (t: T) => (t.sellRank === undefined ? Number.POSITIVE_INFINITY : t.sellRank);
    return [...stock].sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra < rb ? -1 : 1;
        return b.pricePaise - a.pricePaise || a.name.localeCompare(b.name);
    });
}

export function totalAvailable(stock: RoomTypeStock[]): number {
    return stock.reduce((sum, t) => sum + Math.max(0, Math.floor(t.available)), 0);
}

/**
 * Gives out `requested` rooms from the top of the selling order (or from the bottom, for a test booking). All or nothing: a guest who asks for three rooms
 * when two are left gets nothing, rather than a part-booking they did not agree to.
 */
export function allocateRooms(stock: RoomTypeStock[], requested: number, options: { lastFirst?: boolean } = {}): AllocationResult {
    const wanted = Math.max(0, Math.floor(requested));
    const available = totalAvailable(stock);
    if (wanted < 1 || available < wanted) return { ok: false, requested: wanted, available };

    const rooms: { roomTypeId: string; name: string }[] = [];
    const order = orderForSale(stock);
    for (const type of options.lastFirst ? [...order].reverse() : order) {
        let left = Math.max(0, Math.floor(type.available));
        while (left > 0 && rooms.length < wanted) {
            rooms.push({ roomTypeId: type.roomTypeId, name: type.name });
            left -= 1;
        }
        if (rooms.length === wanted) break;
    }
    return { ok: true, rooms };
}
