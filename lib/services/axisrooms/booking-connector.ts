import { CreateBookingRequest, BookingResponse, AxisRoomsConfig } from './types';
import { RetryManager } from './retry-manager';
import { CircuitBreaker } from './circuit-breaker';
import { MOCK_BOOKING_SUCCESS, MOCK_BOOKING_FAILED } from './mock-data';

export class BookingConnector {
    private config: AxisRoomsConfig;
    private retryManager: RetryManager;
    private circuitBreaker: CircuitBreaker;
    private useMock: boolean;

    constructor(config: AxisRoomsConfig, useMock: boolean = true) {
        this.config = config;
        this.useMock = useMock;
        this.retryManager = new RetryManager();
        this.circuitBreaker = new CircuitBreaker('axisrooms-booking');
    }

    async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
        // Booking creation needs stricter handling. 
        // We use CircuitBreaker but RetryManager must handle idempotency carefully.
        // For now relying on RetryManager's logic (which mimics simple retry).
        return this.circuitBreaker.execute(async () => {
            return this.retryManager.execute(async () => {
                if (this.useMock) {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    if (request.payment?.amount === 0) {
                        return MOCK_BOOKING_FAILED;
                    }

                    return {
                        ...MOCK_BOOKING_SUCCESS,
                        confirmationNumber: `OL-${request.bookingRef.substring(0, 8).toUpperCase()}`
                    };
                }

                // Real API call
                const url = `${this.config.baseUrl}/booking`; // or /createBooking
                console.log(`[AxisRooms] Creating booking at ${url}`);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.config.apiKey,
                        'x-hotel-id': this.config.hotelId,
                        'x-channel-id': this.config.channelId || 'website'
                    },
                    body: JSON.stringify(request)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`AxisRooms API Error (${response.status}): ${errorText}`);
                }

                const data = await response.json();
                return data as BookingResponse;
            }, 'createBooking');
        });
    }
}
