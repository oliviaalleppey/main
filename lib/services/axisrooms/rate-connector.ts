import { PricingRequest, PricingResponse, AxisRoomsConfig } from './types';
import { RetryManager } from './retry-manager';
import { CircuitBreaker } from './circuit-breaker';
import { MOCK_PRICING_SUCCESS, MOCK_PRICING_CHANGED } from './mock-data';

export class RateConnector {
    private config: AxisRoomsConfig;
    private retryManager: RetryManager;
    private circuitBreaker: CircuitBreaker;
    private useMock: boolean;

    constructor(config: AxisRoomsConfig, useMock: boolean = true) {
        this.config = config;
        this.useMock = useMock;
        this.retryManager = new RetryManager();
        this.circuitBreaker = new CircuitBreaker('axisrooms-rate');
    }

    async getPricing(request: PricingRequest): Promise<PricingResponse> {
        return this.circuitBreaker.execute(async () => {
            return this.retryManager.execute(async () => {
                if (this.useMock) {
                    await new Promise(resolve => setTimeout(resolve, 600));

                    if (request.ratePlanId === 'simulate_change') {
                        return MOCK_PRICING_CHANGED;
                    }

                    return MOCK_PRICING_SUCCESS;
                }

                // Real API call
                const url = `${this.config.baseUrl}/price`;
                console.log(`[AxisRooms] Fetching pricing from ${url}`);

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
                return data as PricingResponse;
            }, 'getPricing');
        });
    }
}
