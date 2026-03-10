import { BOOKING_PROVIDER } from '@/lib/config/booking-provider';
import type { BookingProvider } from './types';
import { HttpCrsProvider } from './http-crs-provider';
import { MockCrsProvider } from './mock-crs-provider';
import { HotsoftCrsProvider } from './hotsoft-crs-provider';

let providerInstance: BookingProvider | null = null;

export function getBookingProvider(): BookingProvider {
    if (providerInstance) return providerInstance;

    providerInstance = BOOKING_PROVIDER === 'crs'
        ? new HotsoftCrsProvider()
        : new MockCrsProvider();

    return providerInstance;
}
