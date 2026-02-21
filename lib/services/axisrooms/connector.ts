import {
    AxisRoomsConfig,
    AvailabilityRequest,
    AvailabilityResponse,
    PricingRequest,
    PricingResponse,
    CreateBookingRequest,
    BookingResponse
} from './types';
import { AvailabilityConnector } from './availability-connector';
import { RateConnector } from './rate-connector';
import { BookingConnector } from './booking-connector';

export class AxisRoomsConnector {
    private availabilityConnector: AvailabilityConnector;
    private rateConnector: RateConnector;
    private bookingConnector: BookingConnector;

    constructor(config: AxisRoomsConfig, useMock: boolean = true) {
        this.availabilityConnector = new AvailabilityConnector(config, useMock);
        this.rateConnector = new RateConnector(config, useMock);
        this.bookingConnector = new BookingConnector(config, useMock);
    }

    async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
        return this.availabilityConnector.checkAvailability(request);
    }

    async getPricing(request: PricingRequest): Promise<PricingResponse> {
        return this.rateConnector.getPricing(request);
    }

    async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
        return this.bookingConnector.createBooking(request);
    }
}
