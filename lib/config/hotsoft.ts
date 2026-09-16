export const HOTSOFT_CONFIG = {
    appKey: process.env.HOTSOFT_APP_KEY || '',
    hotelId: process.env.HOTSOFT_HOTEL_ID || '',
    availabilityUrl: process.env.HOTSOFT_AVAILABILITY_URL || '',
    bookingUrl: process.env.HOTSOFT_BOOKING_URL || '',
    timeoutMs: process.env.HOTSOFT_TIMEOUT_MS ? parseInt(process.env.HOTSOFT_TIMEOUT_MS, 10) : 15000,
    /**
     * The BookingDetails/@AllInclusiveRates flag.
     *
     * We send a tax-exclusive Rate with Tax alongside it, so "No" is what this
     * payload actually describes — but "Yes" is what has been going out since the
     * integration was built, and it is the suspect in Datamate's 2026-09-16
     * report that the GST column is blank once a CRS booking reaches the FO
     * module: a PMS that honours the flag would read the amount as already
     * inclusive and post no GST. Their confirmation letter renders our CGST/SGST
     * correctly, so the figures do arrive; only FO loses them.
     *
     * It stays 'Yes' by default, because flipping it blind on live bookings
     * risks the opposite fault — GST counted twice on a real guest folio. The
     * env var exists so UAT can be pushed both ways, and so the answer can ship
     * without a deploy once Datamate confirms which one they parse.
     *
     * Case-insensitive, because the value gets typed into a Vercel env var by
     * hand and a lowercase "no" silently meaning "Yes" is exactly the sort of
     * misconfiguration nobody would think to check for. Anything that is not a
     * recognisable "no" keeps today's behaviour.
     */
    allInclusiveRates: process.env.HOTSOFT_ALL_INCLUSIVE_RATES?.trim().toLowerCase() === 'no' ? 'No' : 'Yes',
};

// Mapping from Olivia Internal Room Slugs / IDs to Hotsoft CRS Room IDs
export const HOTSOFT_ROOM_MAPPING: Record<string, string> = {
    // Simplified Keys (Legacy)
    'boat-race-suite': '91371',
    'canal-view-king': '91372',
    'canal-view-superior-family': '91373',
    'lake-view-balcony': '91374',
    'lake-view-balcony-suite': '91375',
    'lake-view-twin': '91376',
    
    // Direct Database Slugs -> Hotsoft IDs
    'boat-race-finish-line-view-suite': '91371',
    'canal-view-king-room': '91372',
    'canal-view-superior-family-room': '91373',
    'lake-view-balcony-rooms': '91374',
    'lake-view-balcony-suite-room': '91375', // Fallback
    'lake-view-twin-room': '91376',
};

/**
 * Mapping from Olivia internal rate plans to Hotsoft rate plan codes.
 *
 * Hotsoft wants a SINGLE LETTER, confirmed by Datamate on 2026-09-02:
 * "RatePlanId should be C for CP, A for AP, M for MAP and E for EP". The
 * two-letter forms this table used to emit were wrong on both sides — they
 * never matched our plan codes, and they were not what Hotsoft parses either.
 *
 * Olivia sells one plan per room, "Standard Rate", and every one of them
 * includes breakfast — so all six map to C (Continental Plan). Manulal:
 * "If the hotel supports only CP you can pass C as RatePlanId."
 *
 * A new room type needs a row here. Anything missing falls through and is
 * logged by getHotsoftRatePlanId() rather than failing silently.
 */
export const HOTSOFT_RATE_PLAN_MAPPING: Record<string, string> = {
    // Olivia's rate plan codes, one per room type — all breakfast-inclusive.
    'rp_boat-race-suite_standard': 'C',
    'rp_canal-view-king_standard': 'C',
    'rp_canal-view-superior-family_standard': 'C',
    'rp_lake-view-balcony_standard': 'C',
    'rp_lake-view-balcony-suite_standard': 'C',
    'rp_lake-view-twin_standard': 'C',

    // Meal-plan names and codes, in case a plan is ever named that way.
    'American Plan': 'A',
    'Continental Plan': 'C',
    'European Plan': 'E',
    'Modified American': 'M',
    'AP': 'A',
    'CP': 'C',
    'EP': 'E',
    'MAP': 'M',
    // Already-correct single letters pass through unchanged.
    'A': 'A',
    'C': 'C',
    'E': 'E',
    'M': 'M',
};

/**
 * Returns the Hotsoft CRS Room ID for a given internal room slug or ID.
 */
export function getHotsoftRoomId(internalSlugOrId: string): string {
    return HOTSOFT_ROOM_MAPPING[internalSlugOrId] || internalSlugOrId;
}

/**
 * Returns the Hotsoft rate plan code for a given internal rate plan name or code.
 *
 * A fall-through means Hotsoft gets a value it does not recognise, which is how
 * `rp_lake-view-balcony_standard` reached them in the first place, so it is
 * logged rather than silent.
 */
export function getHotsoftRatePlanId(internalRatePlan: string): string {
    const mapped = HOTSOFT_RATE_PLAN_MAPPING[internalRatePlan];
    if (!mapped) {
        console.warn(
            `[Hotsoft] Rate plan "${internalRatePlan}" has no entry in HOTSOFT_RATE_PLAN_MAPPING; ` +
            `sending it through unchanged. Add a mapping once Hotsoft confirms the code they expect.`
        );
        return internalRatePlan;
    }
    return mapped;
}
