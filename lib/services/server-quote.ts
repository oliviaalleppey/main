import { getAvailableRoomsForSearch, type SearchResult } from './search';
import { calculateRoomTax } from './tax';

/**
 * A room's price for a stay, worked out on the server and never taken from the
 * browser.
 *
 * The quote snapshot used to arrive as an argument to the booking server
 * actions, and everything downstream — the checkout total, the Easebuzz charge,
 * the rates pushed to Hotsoft — trusted it. Anyone editing that request could
 * book a ₹16,000 room for ₹10. Pricing comes from the same engine the search
 * page uses (CRS base, date overrides, seasonal rules, extra-person surcharge,
 * rate-plan modifier), so the only price a guest can end up with is one we
 * published.
 */

export type ServerRoomQuote = {
    /** Per-room figures; callers scale by room count as they need. */
    pricePerNight: number;
    totalPricePerRoom: number;
    nightlyRates: number[];
    ratePlanId: string | null;
    availableRooms: number;
};

export type ServerQuoteResult = { ok: true; quote: ServerRoomQuote } | { ok: false; message: string };

type PlanLike = { id: string; isDefault?: boolean; nightlyRates?: number[] };

/**
 * Pick one room's price out of a search result. Pure, so it can be tested
 * without the CRS or the database.
 *
 * The requested rate plan wins if the room has it; otherwise the room's default
 * plan, then its first. A plan's own nightly rates carry its modifier, so they
 * are preferred over the room-level rates.
 */
export function quoteFromSearch(
    search: { rooms: SearchResult[]; error?: string },
    roomTypeId: string,
    ratePlanId?: string | null,
): ServerQuoteResult {
    const result = search.rooms.find((room) => room.roomType.id === roomTypeId);
    if (!result) {
        return { ok: false, message: search.error || 'This room cannot be booked for your dates and guests.' };
    }
    if (!result.bookable) {
        return { ok: false, message: result.availabilityMessage || 'This room is no longer available for your dates.' };
    }

    const plans = result.ratePlans as PlanLike[];
    const plan = plans.find((candidate) => candidate.id === ratePlanId)
        ?? plans.find((candidate) => candidate.isDefault)
        ?? plans[0];

    const nightlyRates = plan?.nightlyRates?.length ? plan.nightlyRates : result.nightlyRates;
    const totalPricePerRoom = nightlyRates.reduce((sum, rate) => sum + rate, 0);

    return {
        ok: true,
        quote: {
            pricePerNight: Math.round(totalPricePerRoom / Math.max(1, nightlyRates.length)),
            totalPricePerRoom,
            nightlyRates,
            ratePlanId: plan?.id ?? null,
            availableRooms: result.availableRooms,
        },
    };
}

/**
 * Run the search and price one room. Also returns live availability, from the
 * same CRS call, so callers need no second round trip to Hotsoft.
 */
export async function quoteRoomFromServer(params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    roomTypeId: string;
    ratePlanId?: string | null;
    totalRooms: number;
}): Promise<ServerQuoteResult> {
    const search = await getAvailableRoomsForSearch(
        new Date(params.checkIn),
        new Date(params.checkOut),
        { adults: params.adults, children: params.children },
        params.totalRooms,
    );
    return quoteFromSearch(search, params.roomTypeId, params.ratePlanId);
}

/**
 * The quote snapshot stored on the booking session for `quantity` rooms.
 *
 * totalPrice and taxesAndFees cover every room; nightlyRates stays per room and
 * is deliberately not scaled — quantity is applied when the tax is computed, so
 * each night keeps its own GST slab.
 */
export function snapshotForRooms(
    quote: ServerRoomQuote,
    quantity: number,
    nights: number,
    externalRatePlanId?: string | null,
) {
    return {
        pricePerNight: quote.pricePerNight,
        totalPrice: quote.totalPricePerRoom * quantity,
        nightlyRates: quote.nightlyRates,
        taxesAndFees: calculateRoomTax({
            nightlyRates: quote.nightlyRates,
            pricePerNight: quote.pricePerNight,
            totalPricePerRoom: quote.totalPricePerRoom,
            nights,
            quantity,
        }),
        externalRatePlanId: externalRatePlanId ?? quote.ratePlanId ?? undefined,
        capturedAt: new Date().toISOString(),
    };
}
