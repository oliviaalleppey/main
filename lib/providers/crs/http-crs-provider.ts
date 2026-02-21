import { CRS_CONFIG } from '@/lib/config/crs';
import type {
    BookingProvider,
    CRSAvailabilityRequest,
    CRSAvailabilityResponse,
    CRSCreateReservationRequest,
    CRSReservationResponse,
} from './types';

export class HttpCrsProvider implements BookingProvider {
    readonly source = 'crs' as const;

    async checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse> {
        return this.post<CRSAvailabilityResponse>('/availability', request);
    }

    async createReservation(request: CRSCreateReservationRequest): Promise<CRSReservationResponse> {
        return this.post<CRSReservationResponse>('/reservations', request);
    }

    private async post<T>(path: string, payload: unknown): Promise<T> {
        if (!CRS_CONFIG.baseUrl) {
            throw new Error('CRS_BASE_URL is not configured');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CRS_CONFIG.timeoutMs);

        try {
            const response = await fetch(`${CRS_CONFIG.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CRS_CONFIG.apiKey,
                    'x-hotel-id': CRS_CONFIG.hotelId,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`CRS API ${response.status}: ${errorText}`);
            }

            return await response.json() as T;
        } finally {
            clearTimeout(timeout);
        }
    }
}
