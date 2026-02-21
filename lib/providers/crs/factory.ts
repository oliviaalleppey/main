import { BOOKING_PROVIDER } from '@/lib/config/booking-provider';
import type { BookingProvider } from './types';
import { HttpCrsProvider } from './http-crs-provider';
import { MockCrsProvider } from './mock-crs-provider';

let providerInstance: BookingProvider | null = null;

export function getBookingProvider(): BookingProvider {
    if (providerInstance) return providerInstance;

    providerInstance = BOOKING_PROVIDER === 'crs'
        ? new HttpCrsProvider()
        : new MockCrsProvider();

    return providerInstance;
}
