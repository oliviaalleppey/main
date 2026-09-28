import { BOOKING_PROVIDER } from '@/lib/config/booking-provider';
import type { BookingProvider } from './types';
import { MockCrsProvider } from './mock-crs-provider';
import { HotsoftCrsProvider } from './hotsoft-crs-provider';
import { HOTSOFT_CONFIG } from '@/lib/config/hotsoft';

let providerInstance: BookingProvider | null = null;

/**
 * Stands in for the CRS when production is misconfigured: nothing is bookable,
 * nothing is confirmed.
 *
 * The factory used to fall back to MockCrsProvider whenever BOOKING_PROVIDER was
 * not 'crs' or any HOTSOFT_* variable was missing. The mock invents
 * availability and confirms every reservation, so one mistyped Vercel env var
 * would have taken real payments for rooms that never reached the PMS, with
 * fake OL-xxxx confirmation numbers to match. Failing closed shows guests
 * "unavailable" instead; paid bookings in flight go to the watchdog's retry and
 * alert path rather than a fake confirmation.
 */
class MisconfiguredCrsProvider implements BookingProvider {
    readonly source = 'crs' as const;
    private readonly reason: string;

    constructor(reason: string) {
        this.reason = reason;
    }

    async checkAvailability() {
        return {
            status: 'failure' as const,
            rooms: [],
            message: 'Online booking is temporarily unavailable. Please contact reservations.',
        };
    }

    async createReservation() {
        return {
            status: 'pending' as const,
            reservationId: '',
            confirmationNumber: '',
            message: `CRS unavailable: ${this.reason}`,
            errors: [this.reason],
        };
    }
}

/**
 * Production means a real deployment. `ALLOW_MOCK_CRS=true` is the explicit way
 * to run a production build against the mock, e.g. a Vercel preview.
 */
function mockIsForbidden(): boolean {
    return process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_CRS !== 'true';
}

export function getBookingProvider(): BookingProvider {
    if (providerInstance) return providerInstance;

    const missing = ([
        ['HOTSOFT_AVAILABILITY_URL', HOTSOFT_CONFIG.availabilityUrl],
        ['HOTSOFT_BOOKING_URL', HOTSOFT_CONFIG.bookingUrl],
        ['HOTSOFT_APP_KEY', HOTSOFT_CONFIG.appKey],
        ['HOTSOFT_HOTEL_ID', HOTSOFT_CONFIG.hotelId],
    ] as const).filter(([, value]) => !value).map(([name]) => name);

    if (BOOKING_PROVIDER === 'crs' && missing.length === 0) {
        providerInstance = new HotsoftCrsProvider();
    } else if (mockIsForbidden()) {
        const reason = BOOKING_PROVIDER !== 'crs'
            ? `BOOKING_PROVIDER is "${process.env.BOOKING_PROVIDER ?? ''}", expected "crs"`
            : `missing ${missing.join(', ')}`;
        console.error(`[CRS] Refusing to use the mock CRS in production (${reason}). Online booking is disabled until this is fixed.`);
        providerInstance = new MisconfiguredCrsProvider(reason);
    } else {
        // Local/dev default: don't hard-fail if Hotsoft isn't configured/reachable.
        providerInstance = new MockCrsProvider();
    }

    return providerInstance;
}
