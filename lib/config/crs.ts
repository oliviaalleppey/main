import type { BookingProviderConfig } from '@/lib/providers/crs/types';

const DEFAULT_TIMEOUT_MS = 10000;

function parseIntSafe(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMapping(jsonValue: string | undefined): Record<string, string> {
    if (!jsonValue) return {};

    try {
        const parsed = JSON.parse(jsonValue);
        if (!parsed || typeof parsed !== 'object') return {};

        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof key === 'string' && typeof value === 'string' && key.trim() && value.trim()) {
                normalized[key.trim()] = value.trim();
            }
        }
        return normalized;
    } catch (error) {
        console.error('Invalid CRS mapping JSON. Falling back to empty mapping.', error);
        return {};
    }
}

const ROOM_TYPE_MAPPING = parseMapping(process.env.CRS_ROOM_TYPE_MAP_JSON);
const RATE_PLAN_MAPPING = parseMapping(process.env.CRS_RATE_PLAN_MAP_JSON);

export const CRS_CONFIG: BookingProviderConfig = {
    baseUrl: process.env.CRS_BASE_URL || '',
    apiKey: process.env.CRS_API_KEY || '',
    hotelId: process.env.CRS_HOTEL_ID || '',
    timeoutMs: parseIntSafe(process.env.CRS_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
};

export function mapInternalRoomTypeToCrs(params: {
    roomTypeId: string;
    roomTypeSlug?: string | null;
}): string {
    const byId = ROOM_TYPE_MAPPING[params.roomTypeId];
    if (byId) return byId;

    const bySlug = params.roomTypeSlug ? ROOM_TYPE_MAPPING[params.roomTypeSlug] : undefined;
    if (bySlug) return bySlug;

    return params.roomTypeSlug || params.roomTypeId;
}

export function mapInternalRatePlanToCrs(params: {
    ratePlanId: string;
    ratePlanCode?: string | null;
}): string {
    const byId = RATE_PLAN_MAPPING[params.ratePlanId];
    if (byId) return byId;

    const byCode = params.ratePlanCode ? RATE_PLAN_MAPPING[params.ratePlanCode] : undefined;
    if (byCode) return byCode;

    return params.ratePlanCode || params.ratePlanId;
}

export function mapCrsRoomTypeMatchesInternal(params: {
    internalRoomTypeId: string;
    internalRoomTypeSlug?: string | null;
    crsRoomTypeId: string;
}): boolean {
    const expectedIds = [
        mapInternalRoomTypeToCrs({
            roomTypeId: params.internalRoomTypeId,
            roomTypeSlug: params.internalRoomTypeSlug,
        }),
        params.internalRoomTypeId,
        params.internalRoomTypeSlug || '',
    ].filter((value): value is string => Boolean(value));

    return expectedIds.includes(params.crsRoomTypeId);
}
