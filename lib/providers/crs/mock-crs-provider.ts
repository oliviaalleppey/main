import type {
    BookingProvider,
    CRSAvailabilityRequest,
    CRSAvailabilityResponse,
    CRSCreateReservationRequest,
    CRSReservationResponse,
} from './types';

const MOCK_AVAILABILITY_SUCCESS: CRSAvailabilityResponse = {
    status: 'success',
    rooms: [
        {
            roomTypeId: 'lake-view-twin',
            name: 'Lake View Twin Room',
            availableCount: 5,
            price: 1200000,
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
                    cancellationPolicy: 'Free cancellation 48h before check-in',
                },
            ],
        },
        {
            roomTypeId: 'canal-view-king',
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
                    cancellationPolicy: 'Moderate',
                },
            ],
        },
        {
            roomTypeId: 'boat-race-suite',
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
                    cancellationPolicy: 'Strict',
                },
            ],
        },
    ],
};

const MOCK_AVAILABILITY_EMPTY: CRSAvailabilityResponse = {
    status: 'success',
    rooms: [],
};

const MOCK_AVAILABILITY_ERROR: CRSAvailabilityResponse = {
    status: 'failure',
    rooms: [],
    message: 'CRS maintenance window',
};

const MOCK_RESERVATION_FAILED: CRSReservationResponse = {
    status: 'failed',
    reservationId: '',
    confirmationNumber: '',
    message: 'Payment verified but reservation could not be confirmed.',
    errors: ['Inventory mismatch'],
};

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockCrsProvider implements BookingProvider {
    readonly source = 'mock_crs' as const;

    async checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse> {
        await wait(250);

        if (request.checkIn.includes('1990')) return deepClone(MOCK_AVAILABILITY_ERROR);
        if (request.checkIn.includes('2025-12-31')) return deepClone(MOCK_AVAILABILITY_EMPTY);

        return deepClone(MOCK_AVAILABILITY_SUCCESS);
    }

    async createReservation(request: CRSCreateReservationRequest): Promise<CRSReservationResponse> {
        await wait(400);

        if (!request.payment?.amount || request.payment.amount <= 0) {
            return deepClone(MOCK_RESERVATION_FAILED);
        }

        const suffix = request.reservationRef.slice(0, 8).toUpperCase();

        return {
            status: 'confirmed',
            reservationId: `CRS-${suffix}`,
            confirmationNumber: `OL-${suffix}`,
            message: 'Reservation confirmed successfully.',
        };
    }
}
