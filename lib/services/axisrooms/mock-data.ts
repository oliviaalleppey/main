import { AvailabilityResponse, PricingResponse, BookingResponse } from './types';

// Standard Success Response
export const MOCK_AVAILABILITY_SUCCESS: AvailabilityResponse = {
    status: 'success',
    rooms: [
        {
            roomId: 'lake-view-twin',
            name: 'Lake View Twin Room',
            availableCount: 5,
            price: 1200000, // Matching base price in paise
            currency: 'INR',
            maxOccupancy: 2,
            ratePlans: [
                {
                    id: 'rp_breakfast',
                    name: 'Bed & Breakfast',
                    amount: 1350000,
                    tax: 18000,
                    currency: 'INR',
                    mealPlan: 'CP',
                    inclusions: ['Breakfast', 'Welcome Drink'],
                    cancellationPolicy: 'Free cancellation 48h before check-in'
                }
            ]
        },
        {
            roomId: 'canal-view-king',
            name: 'Canal View King Room',
            availableCount: 8,
            price: 1500000,
            currency: 'INR',
            maxOccupancy: 2,
            ratePlans: [
                {
                    id: 'rp_standard',
                    name: 'Standard Rate',
                    amount: 1500000,
                    tax: 20000,
                    currency: 'INR',
                    mealPlan: 'EP',
                    inclusions: [],
                    cancellationPolicy: 'Moderate'
                }
            ]
        },
        {
            roomId: 'boat-race-suite',
            name: 'Boat Race Finish Line View Suite',
            availableCount: 2,
            price: 2800000,
            currency: 'INR',
            maxOccupancy: 3,
            ratePlans: [
                {
                    id: 'rp_suite_standard',
                    name: 'Standard Rate',
                    amount: 2800000,
                    tax: 42000,
                    currency: 'INR',
                    mealPlan: 'CP',
                    inclusions: ['Breakfast', 'Butler Service', 'Airport Transfer'],
                    cancellationPolicy: 'Strict'
                }
            ]
        }
    ]
};

// Scenario: Sold Out
export const MOCK_AVAILABILITY_EMPTY: AvailabilityResponse = {
    status: 'success',
    rooms: []
};

// Scenario: API Failure
export const MOCK_AVAILABILITY_ERROR: AvailabilityResponse = {
    status: 'failure',
    rooms: [],
    message: 'AxisRooms System Maintenance'
};

// Pricing - Standard
export const MOCK_PRICING_SUCCESS: PricingResponse = {
    status: 'success',
    totalAmount: 16800,
    taxAmount: 1800,
    netAmount: 15000,
    currency: 'INR',
    breakdown: {
        base: 15000,
        taxes: [{ name: 'GST', amount: 1800 }],
        discounts: 0
    },
    isPriceChanged: false
};

// Pricing - Changed (for Validator Test)
// Only use this if simulating price hike during checkout
export const MOCK_PRICING_CHANGED: PricingResponse = {
    status: 'success',
    totalAmount: 18000, // Increased from 16800
    taxAmount: 2000,
    netAmount: 16000,
    currency: 'INR',
    breakdown: {
        base: 16000,
        taxes: [{ name: 'GST', amount: 2000 }],
        discounts: 0
    },
    isPriceChanged: true
};

// Booking - Success
export const MOCK_BOOKING_SUCCESS: BookingResponse = {
    status: 'confirmed',
    bookingId: 'AX-9988776655',
    confirmationNumber: 'OL-RES-123456',
    voucherUrl: 'https://mock.axisrooms.com/vouchers/AX-9988776655.pdf',
    message: 'Booking confirmed successfully.'
};

// Booking - Failed
export const MOCK_BOOKING_FAILED: BookingResponse = {
    status: 'failed',
    bookingId: '',
    confirmationNumber: '',
    message: 'Payment verified but room allocation failed. Refund initiated.',
    errors: ['Inventory mismatch', 'Room ID invalid']
};
