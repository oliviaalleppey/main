export const HOTSOFT_CONFIG = {
    appKey: process.env.HOTSOFT_APP_KEY || '',
    hotelId: process.env.HOTSOFT_HOTEL_ID || '',
    availabilityUrl: process.env.HOTSOFT_AVAILABILITY_URL || '',
    bookingUrl: process.env.HOTSOFT_BOOKING_URL || '',
    timeoutMs: process.env.HOTSOFT_TIMEOUT_MS ? parseInt(process.env.HOTSOFT_TIMEOUT_MS, 10) : 15000,
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

// Mapping from Olivia Internal Rate Plans to Hotsoft Rate Plan Codes
export const HOTSOFT_RATE_PLAN_MAPPING: Record<string, string> = {
    'American Plan': 'AP',
    'Continental Plan': 'CP',
    'European Plan': 'EP',
    'Modified American': 'MAP',
    // Fallbacks to standard codes based on DB naming conventions
    'AP': 'AP',
    'CP': 'CP',
    'EP': 'EP',
    'MAP': 'MAP',
};

/**
 * Returns the Hotsoft CRS Room ID for a given internal room slug or ID.
 */
export function getHotsoftRoomId(internalSlugOrId: string): string {
    return HOTSOFT_ROOM_MAPPING[internalSlugOrId] || internalSlugOrId;
}

/**
 * Returns the Hotsoft Rate Plan Code for a given internal rate plan name or code.
 *
 * The table above is keyed by meal-plan names, and this hotel's rate plans are not
 * named that way — they are one "Standard Rate" per room, coded
 * `rp_<room-slug>_standard`. So every booking falls through and sends the internal
 * code verbatim. Hotsoft accepts it (booking OL-3008-VBZA came back Confirmed and
 * they quoted the field back to us unchanged), so the pass-through is left alone
 * deliberately: changing what we send without their say-so risks breaking an
 * integration that currently works.
 *
 * The fall-through is logged rather than silent, so that if it ever does start
 * mattering there is a trail, instead of a wrong code discovered from a folio.
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
