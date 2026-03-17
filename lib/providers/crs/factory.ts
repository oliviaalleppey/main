import { BOOKING_PROVIDER } from '@/lib/config/booking-provider';
import type { BookingProvider } from './types';
import { HttpCrsProvider } from './http-crs-provider';
import { MockCrsProvider } from './mock-crs-provider';
import { HotsoftCrsProvider } from './hotsoft-crs-provider';
import { HOTSOFT_CONFIG } from '@/lib/config/hotsoft';

let providerInstance: BookingProvider | null = null;

export function getBookingProvider(): BookingProvider {
    if (providerInstance) return providerInstance;

    const hotsoftConfigured =
        !!HOTSOFT_CONFIG.availabilityUrl && !!HOTSOFT_CONFIG.bookingUrl && !!HOTSOFT_CONFIG.appKey && !!HOTSOFT_CONFIG.hotelId;

    if (BOOKING_PROVIDER === 'crs' && hotsoftConfigured) {
        providerInstance = new HotsoftCrsProvider();
    } else {
        // Local/dev default: don't hard-fail if Hotsoft isn't configured/reachable.
        providerInstance = new MockCrsProvider();
    }

    return providerInstance;
}
