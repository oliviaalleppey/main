export interface AxisRoomsConfig {
    apiKey: string;
    hotelId: string;
    baseUrl: string;
    channelId: string;
    accessKey: string;
}

export interface AvailabilityRequest {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    adults: number;
    children: number;
    hotelId?: string;
}

export interface RatePlan {
    id: string; // Rate ID
    name: string;
    amount: number; // Daily price or total depending on API
    tax: number;
    currency: string;
    description?: string;
    inclusions?: string[];
    cancellationPolicy?: string;
    mealPlan?: string;
}

export interface RoomAvailability {
    roomId: string; // Room Type ID
    name: string;
    availableCount: number;
    price: number; // Base price for the duration or per night
    currency: string;
    ratePlans: RatePlan[];
    maxOccupancy: number;
}

export interface AvailabilityResponse {
    rooms: RoomAvailability[];
    status: 'success' | 'failure';
    message?: string;
}

export interface PricingRequest {
    roomId: string; // Room Type
    ratePlanId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number; // Number of rooms
}

export interface PricingResponse {
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
    currency: string;
    breakdown: {
        base: number;
        taxes: { name: string; amount: number }[];
        discounts: number;
    };
    status: 'success' | 'failure';
    isPriceChanged: boolean; // Vital for validator
}

export interface CreateBookingRequest {
    bookingRef: string; // Our internal UUID
    checkIn: string;
    checkOut: string;
    rooms: {
        roomTypeId: string;
        ratePlanId: string;
        adults: number;
        children: number;
        guestName: string; // Primary guest for this room
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

export interface BookingResponse {
    status: 'confirmed' | 'failed' | 'pending';
    bookingId: string; // AxisRooms ID
    confirmationNumber: string; // Hotel confirmation number
    voucherUrl?: string;
    message?: string;
    errors?: string[];
}
