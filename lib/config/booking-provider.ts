export type BookingProviderMode = 'mock_crs' | 'crs';

const rawProvider = process.env.BOOKING_PROVIDER?.toLowerCase();

export const BOOKING_PROVIDER: BookingProviderMode =
    rawProvider === 'crs' ? 'crs' : 'mock_crs';
