export interface BookingProviderConfig {
    baseUrl: string;
    apiKey: string;
    hotelId: string;
    timeoutMs: number;
}

export interface CRSAvailabilityRequest {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    adults: number;
    children: number;
}

export interface CRSRatePlan {
    id: string;
    name: string;
    amount: number; // paise
    tax: number; // paise
    currency: string;
    description?: string;
    inclusions?: string[];
    cancellationPolicy?: string;
    mealPlan?: string;
}

export interface CRSAvailabilityRoom {
    roomTypeId: string;
    name: string;
    availableCount: number;
    price: number; // paise
    currency: string;
    ratePlans: CRSRatePlan[];
    maxOccupancy: number;
}

export interface CRSAvailabilityResponse {
    status: 'success' | 'failure';
    rooms: CRSAvailabilityRoom[];
    message?: string;
}

export interface CRSCreateReservationRequest {
    reservationRef: string;
    checkIn: string;
    checkOut: string;
    rooms: {
        roomTypeId: string;
        ratePlanId: string;
        adults: number;
        children: number;
        guestName: string;
    }[];
    primaryGuest: {
        title: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address?: string;
        city?: string;
        country?: string;
        zip?: string;
    };
    payment?: {
        method: string;
        amount: number;
        transactionId?: string;
    };
    comments?: string;
}

export interface CRSReservationResponse {
    status: 'confirmed' | 'failed' | 'pending';
    reservationId: string;
    confirmationNumber: string;
    voucherUrl?: string;
    message?: string;
    errors?: string[];
}

export interface BookingProvider {
    source: 'mock_crs' | 'crs';
    checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse>;
    createReservation(request: CRSCreateReservationRequest): Promise<CRSReservationResponse>;
}
