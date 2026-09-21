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
    roomTypeId?: string;
}

export interface CRSRatePlan {
    id: string;
    name: string;
    amount: number; // paise, per night
    tax: number; // paise, per night — display only
    /** Whole-stay tax, summed per night across its own slab. */
    stayTax?: number; // paise
    /** Per-room rate for each night under this plan. */
    nightlyRates?: number[]; // paise
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
        /**
         * Pre-tax tariff for this one room, night by night, in paise. One entry per
         * night of the stay, in date order. Hotsoft prices its nightly lines from
         * these, so they must sum to this room's share of the booking subtotal.
         */
        nightlyRates?: number[];
        /** GST for this one room, night by night, in paise. Same length and order. */
        nightlyTaxes?: number[];
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
        subtotal?: number;
        taxAmount?: number;
        transactionId?: string;
    };
    comments?: string;
    /**
     * What the guest bought on top of the room, in paise.
     *
     * The booking request has no element for extra services, so these do not
     * appear in the nightly lines and Hotsoft cannot price them. They are named
     * in Instructions instead, which is the part of a reservation the front
     * office reads — otherwise the desk first hears of a cake on arrival.
     */
    addOns?: { name: string; quantity: number; subtotal: number }[];
    /** GST on those add-ons, in paise. Part of the header's Taxes. */
    addOnTax?: number;
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
    source: 'mock_crs' | 'crs' | 'hotsoft_crs';
    checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse>;
    createReservation(request: CRSCreateReservationRequest): Promise<CRSReservationResponse>;
}
