import { AvailabilityRequest, AvailabilityResponse, AxisRoomsConfig } from './types';
import { RetryManager } from './retry-manager';
import { CircuitBreaker } from './circuit-breaker';
import { MOCK_AVAILABILITY_SUCCESS, MOCK_AVAILABILITY_EMPTY, MOCK_AVAILABILITY_ERROR } from './mock-data';

export class AvailabilityConnector {
    private config: AxisRoomsConfig;
    private retryManager: RetryManager;
    private circuitBreaker: CircuitBreaker;
    private useMock: boolean;

    constructor(config: AxisRoomsConfig, useMock: boolean = true) {
        this.config = config;
        this.useMock = useMock;
        this.retryManager = new RetryManager();
        this.circuitBreaker = new CircuitBreaker('axisrooms-availability');
    }

    async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
        return this.circuitBreaker.execute(async () => {
            return this.retryManager.execute(async () => {
                if (this.useMock) {
                    await new Promise(resolve => setTimeout(resolve, 800));

                    if (request.checkIn.includes('1990')) return MOCK_AVAILABILITY_ERROR;
                    if (request.checkIn.includes('2025-12-31')) return MOCK_AVAILABILITY_EMPTY;

                    return MOCK_AVAILABILITY_SUCCESS;
                }

                // Real API call
                const url = `${this.config.baseUrl}/availability`;
                console.log(`[AxisRooms] Fetching availability from ${url}`);

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
                return data as AvailabilityResponse;
            }, 'checkAvailability');
        });
    }
}
