export const HOTSOFT_CONFIG = {
    appKey: process.env.HOTSOFT_APP_KEY || '',
    hotelId: process.env.HOTSOFT_HOTEL_ID || '',
    availabilityUrl: process.env.HOTSOFT_AVAILABILITY_URL || '',
    bookingUrl: process.env.HOTSOFT_BOOKING_URL || '',
    timeoutMs: process.env.HOTSOFT_TIMEOUT_MS ? parseInt(process.env.HOTSOFT_TIMEOUT_MS, 10) : 15000,
};

// Mapping from Olivia Internal Room Slugs / IDs to Hotsoft CRS Room IDs
export const HOTSOFT_ROOM_MAPPING: Record<string, string> = {
    // Slug to ID mapping
    'boat-race-finish-line-suite': '80011',
    'canal-view-king': '80012',
    'canal-view-superior-family': '80013',
    'lake-view-balcony': '80014',
    'lake-view-balcony-suite': '80015',
    'lake-view-twin': '80016',
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
 */
export function getHotsoftRatePlanId(internalRatePlan: string): string {
    return HOTSOFT_RATE_PLAN_MAPPING[internalRatePlan] || internalRatePlan;
}
