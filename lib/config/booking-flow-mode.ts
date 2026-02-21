export type BookingFlowMode = 'strict' | 'hybrid' | 'degraded';

const rawMode = (process.env.BOOKING_FLOW_MODE || '').toLowerCase();

export const BOOKING_FLOW_MODE: BookingFlowMode =
    rawMode === 'hybrid' || rawMode === 'degraded'
        ? rawMode
        : 'strict';
