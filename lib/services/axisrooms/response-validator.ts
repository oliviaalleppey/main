import { BookingResponse, CreateBookingRequest } from './types';
import crypto from 'crypto';

export class AxisResponseValidator {
    /**
     * Validate the booking confirmation response from AxisRooms
     */
    static validateBookingResponse(
        request: CreateBookingRequest,
        response: BookingResponse
    ): { isValid: boolean; error?: string } {
        // 1. Basic Schema Validation
        if (!response.bookingId || !response.confirmationNumber) {
            return { isValid: false, error: 'Missing booking ID or confirmation number' };
        }

        if (response.status !== 'confirmed') {
            return { isValid: false, error: `Booking status is ${response.status}: ${response.message}` };
        }

        // 2. Data Integrity Checks (if response includes echoed data)
        // Note: AxisRooms standard response might not echo back dates/prices, 
        // but if it does, we must validate them here.
        // Assuming minimal response for now based on types.ts:
        // { status, bookingId, confirmationNumber, message }

        return { isValid: true };
    }

    /**
     * Compute a hash of the critical response fields for audit logging
     */
    static computeResponseHash(response: any): string {
        const payload = JSON.stringify(response);
        return crypto.createHash('sha256').update(payload).digest('hex');
    }
}
