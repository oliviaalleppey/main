import { HOTSOFT_CONFIG, getHotsoftRoomId, getHotsoftRatePlanId, HOTSOFT_ROOM_MAPPING } from '../../config/hotsoft';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { db } from '../../db';
import { roomTypes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { spreadEvenly } from '../../services/tax';
import { hotelToday } from '../../services/offers';
import type {
    BookingProvider,
    CRSAvailabilityRequest,
    CRSAvailabilityResponse,
    CRSCreateReservationRequest,
    CRSReservationResponse,
} from './types';

/**
 * The hotel's published check-in and check-out times — see lib/structured-data.ts
 * and the room pages. Hotsoft wants wall-clock time at the property, so these are
 * literal and never converted: Alappuzha is IST, and a stay beginning on the 31st
 * begins on the 31st no matter where this code runs.
 *
 * These used to be rendered from the date value itself, which meant every guest
 * was reported to the PMS as arriving and leaving at midnight.
 */
const HOTEL_CHECK_IN_TIME = '14:00';
const HOTEL_CHECK_OUT_TIME = '11:00';

/** The leading YYYY-MM-DD of a DATE column value or an ISO timestamp. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * dd/MM/yyyy, without routing a date-only value through `Date`.
 *
 * `check_in` and `check_out` are DATE columns carrying no time at all. Parsing
 * '2026-08-31' with `new Date()` gives UTC midnight, and reading it back with
 * local getters shifts the date a full day anywhere west of UTC — Hotsoft would
 * be told the guest arrives on the 30th. It only ever looked correct because
 * Vercel happens to run in UTC. Falling back to UTC getters for anything that is
 * not date-shaped keeps the same value everywhere.
 */
function formatDateToHotsoft(dateString: string): string {
    const match = DATE_ONLY.exec(dateString);
    if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }

    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** dd/MM/yyyy HH:mm, with the hotel's own policy time rather than a parsed one. */
function formatDateTimeToHotsoft(dateString: string, time: string): string {
    return `${formatDateToHotsoft(dateString)} ${time}`;
}

/** The date `days` nights after a date-only value, as YYYY-MM-DD. */
function addNights(dateString: string, days: number): string {
    const match = DATE_ONLY.exec(dateString);
    const base = match
        ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(dateString).getTime();
    return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole nights between two date-only values, counted in UTC so no zone can skew it. */
function nightsBetween(checkIn: string, checkOut: string): number {
    const from = DATE_ONLY.exec(checkIn);
    const to = DATE_ONLY.exec(checkOut);
    const start = from ? Date.UTC(Number(from[1]), Number(from[2]) - 1, Number(from[3])) : new Date(checkIn).getTime();
    const end = to ? Date.UTC(Number(to[1]), Number(to[2]) - 1, Number(to[3])) : new Date(checkOut).getTime();
    return Math.ceil((end - start) / 86_400_000);
}

// We configure the builder to handle attributes, as Hotsoft makes heavy use of XML attributes
const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
});

/** Paise to the rupees-and-paise string every money attribute in the payload uses. */
function toAmountAttribute(paise: number): string {
    return (paise / 100).toFixed(2);
}

/** One night of one room, priced the way Hotsoft wants its nightly lines. */
type NightlyCharge = { rate: number | null; tax: number | null };

/**
 * Price the nights the caller left blank.
 *
 * booking-service supplies the per-night split; older callers and the test
 * scripts don't. Rather than drop the attributes Hotsoft asked for, spread
 * whatever the header total leaves over evenly across the unpriced nights, so
 * the nightly lines still add back up to Amount and Taxes.
 */
function priceRemainingNights(cells: NightlyCharge[], key: 'rate' | 'tax', headerTotalPaise: number): void {
    const unpriced = cells.filter((cell) => cell[key] === null);
    if (!unpriced.length) return;

    const alreadyPriced = cells.reduce((sum, cell) => sum + (cell[key] ?? 0), 0);
    const share = spreadEvenly(Math.max(0, headerTotalPaise - alreadyPriced), unpriced.length);
    unpriced.forEach((cell, index) => {
        cell[key] = share[index];
    });
}

/**
 * The RatePlanId attribute for one room.
 *
 * Every room this hotel sells carries a rate plan, so the empty case is a data
 * fault rather than a normal path. The fallback is the property's own plan — CP,
 * sent as 'C' — because every Olivia rate includes breakfast; the old 'EP'
 * default would have told Hotsoft the stay was room-only and put the front desk
 * in a position to bill a guest again for a breakfast they had already paid for.
 * The fallback stays so a missing plan cannot fail the push, but it is not quiet.
 */
function resolveRatePlanAttribute(ratePlanId: string): string {
    if (!ratePlanId) {
        console.warn(
            '[Hotsoft] Booking room has no rate plan; falling back to "C" (CP). ' +
            'This is a data fault — the room should carry a rate plan.'
        );
        return getHotsoftRatePlanId('CP');
    }
    return getHotsoftRatePlanId(ratePlanId);
}

/** The nightly figures for one room, but only if they cover the stay exactly. */
function nightlyFigures(values: number[] | undefined, nights: number): number[] | null {
    if (!Array.isArray(values) || values.length !== nights) return null;
    return values.every((value) => Number.isFinite(value) && value >= 0) ? values : null;
}

/** One <RoomType> node: every room of one type, on one plan, for one night. */
type NightlyLine = {
    id: string;
    date: string;
    ratePlanId: string;
    rooms: number;
    pax: number;
    children: number;
    /** Indexes into the per-room, per-night charges this line rolls up. */
    cells: number[];
};

/**
 * Build the BookingRequest XML for a reservation.
 *
 * Exported so the payload can be inspected without touching the network —
 * see scripts/verify-hotsoft-rates.ts.
 */
export function buildBookingRequestXml(request: CRSCreateReservationRequest): string {
    // Price every night of every room first — that is the level the booking's
    // totals reconcile at — then fold them into one <RoomType> per room type,
    // rate plan and night. Hotsoft reads NoOfRooms and NoOfPax off that node and
    // takes Rate and Tax as per-room figures. One node per physical room repeats
    // the same ID and Date, and Hotsoft kept a single node's room and guest count
    // while adding up all of their money: OL-1009-HL0Y, three rooms for three
    // adults, reached the PMS as one room for one adult at three times the tariff.
    const charges: NightlyCharge[] = [];
    const lines = new Map<string, NightlyLine>();
    const nights = nightsBetween(request.checkIn, request.checkOut);

    for (const room of request.rooms) {
        const roomRates = nightlyFigures(room.nightlyRates, nights);
        const roomTaxes = nightlyFigures(room.nightlyTaxes, nights);
        const id = getHotsoftRoomId(room.roomTypeId);
        const ratePlanId = resolveRatePlanAttribute(room.ratePlanId);

        for (let i = 0; i < nights; i++) {
            const date = formatDateToHotsoft(addNights(request.checkIn, i));
            const key = `${id}|${ratePlanId}|${date}`;
            let line = lines.get(key);
            if (!line) {
                line = { id, date, ratePlanId, rooms: 0, pax: 0, children: 0, cells: [] };
                lines.set(key, line);
            }
            line.rooms += 1;
            line.pax += room.adults + room.children;
            line.children += room.children;
            line.cells.push(charges.length);
            charges.push({
                rate: roomRates ? Math.round(roomRates[i]) : null,
                tax: roomTaxes ? Math.round(roomTaxes[i]) : null,
            });
        }
    }

    // Rate and Tax are per room, per night, and pre-tax on the Rate side — the
    // same basis as Amount and Taxes in the header, once multiplied by NoOfRooms.
    // Rooms sharing a node are priced alike, so the per-room figure is exact; only
    // a total that doesn't divide evenly across the rooms rounds, by under a paisa
    // per room, and the header keeps the booking's own figures regardless.
    priceRemainingNights(charges, 'rate', request.payment?.subtotal ?? 0);
    priceRemainingNights(charges, 'tax', request.payment?.taxAmount ?? 0);
    const perRoom = (line: NightlyLine, key: 'rate' | 'tax') =>
        toAmountAttribute(Math.round(line.cells.reduce((sum, cell) => sum + (charges[cell][key] ?? 0), 0) / line.rooms));

    const rates = Array.from(lines.values()).map((line) => ({
        '@_ID': line.id,
        '@_Date': line.date,
        '@_NoOfRooms': line.rooms.toString(),
        '@_NoOfPax': line.pax.toString(),
        '@_RatePlanId': line.ratePlanId,
        '@_ChildPax': line.children.toString(),
        '@_Rate': perRoom(line, 'rate'),
        '@_Tax': perRoom(line, 'tax'),
    }));

    const xmlPayload = xmlBuilder.build({
        BookingRequest: {
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            '@_accessKey': HOTSOFT_CONFIG.appKey, // Following example from BookingRequest XML Documentation
            GuestDetails: {
                '@_Title': request.primaryGuest.title || '', // Can be extracted if added to DB, empty for now
                '@_GuestName': `${request.primaryGuest.firstName} ${request.primaryGuest.lastName}`.trim(),
                '@_EmailId': request.primaryGuest.email || '',
                '@_MobileNo': request.primaryGuest.phone || '',
            },
            CheckinDetails: {
                '@_CheckInDateTime': formatDateTimeToHotsoft(request.checkIn, HOTEL_CHECK_IN_TIME),
                '@_CheckOutDateTime': formatDateTimeToHotsoft(request.checkOut, HOTEL_CHECK_OUT_TIME),
                '@_TotalPax': (request.rooms.reduce((sum, r) => sum + r.adults + r.children, 0)).toString(),
                '@_Children': (request.rooms.reduce((sum, r) => sum + r.children, 0)).toString(),
                '@_Amount': typeof request.payment?.subtotal === 'number' ? toAmountAttribute(request.payment.subtotal) : '0.00',
                '@_Taxes': typeof request.payment?.taxAmount === 'number' ? toAmountAttribute(request.payment.taxAmount) : '0.00',
                '@_TotalAmount': typeof request.payment?.amount === 'number' ? toAmountAttribute(request.payment.amount) : '0.00',
            },
            BookingDetails: {
                '@_HotelID': HOTSOFT_CONFIG.hotelId,
                '@_BookingNo': request.reservationRef,
                // The hotel's own date, not the server's — a booking pushed after
                // 18:30 IST would otherwise be stamped with the previous day.
                '@_BookingDate': formatDateToHotsoft(hotelToday()),
                '@_BookedBy': `${request.primaryGuest.firstName} ${request.primaryGuest.lastName}`.trim(),
                '@_OTA': 'Website',
                '@_BookingStatus': 'Confirmed',
                '@_AllInclusiveRates': HOTSOFT_CONFIG.allInclusiveRates,
                '@_Instructions': request.comments || '',
            },
            Rates: {
                RoomType: rates
            }
        }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
}

export class HotsoftCrsProvider implements BookingProvider {
    readonly source = 'hotsoft_crs' as const;

    private xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
    });

    async checkAvailability(request: CRSAvailabilityRequest): Promise<CRSAvailabilityResponse> {
        if (!HOTSOFT_CONFIG.availabilityUrl || !HOTSOFT_CONFIG.appKey || !HOTSOFT_CONFIG.hotelId) {
            return {
                status: 'failure',
                rooms: [],
                message: 'Hotsoft configuration incomplete for availability lookup.',
            };
        }

        const roomTypesToCheck = request.roomTypeId
            ? [request.roomTypeId]
            : Object.keys(HOTSOFT_ROOM_MAPPING);

        const rooms: any[] = [];
        let hasSuccess = false;
        let lastError = '';

        await Promise.all(roomTypesToCheck.map(async (roomType) => {
            const checkOutDate = new Date(request.checkOut + 'T00:00:00');
            const checkInDate = new Date(request.checkIn + 'T00:00:00');
            
            if (checkOutDate > checkInDate) {
                checkOutDate.setDate(checkOutDate.getDate() - 1);
            }

            const hotelDet: any = {
                HotelId: HOTSOFT_CONFIG.hotelId,
                RoomType: getHotsoftRoomId(roomType),
                DtFrom: formatDateToHotsoft(request.checkIn),
                DtTo: formatDateToHotsoft(checkOutDate.toISOString()),
                AvailType: '1',
            };

            const xmlPayload = xmlBuilder.build({
                Hotsoft: {
                    Login: { AppKey: HOTSOFT_CONFIG.appKey },
                    HOTEL_DET: hotelDet
                }
            });

            const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

            try {
                const parsedResponse = await this.postXml(HOTSOFT_CONFIG.availabilityUrl, fullXml);

                if (parsedResponse?.Hotsoft?.Response?.ResponseMsg !== "Failed.") {
                    hasSuccess = true;
                    const availabilityData = parsedResponse?.Hotsoft?.availability;
                    if (availabilityData) {
                        const availItems = Array.isArray(availabilityData) ? availabilityData : [availabilityData];
                        let minFree = Infinity;
                        for (const item of availItems) {
                            const free = parseInt(item.free, 10);
                            if (!isNaN(free) && free < minFree) {
                                minFree = free;
                            }
                        }
                        if (minFree === Infinity) minFree = 0;

                        let fallbackPrice = 0;
                        try {
                            const internalRoom = await db.query.roomTypes.findFirst({
                                where: eq(roomTypes.slug, roomType),
                                columns: { basePrice: true }
                            });
                            if (internalRoom) {
                                fallbackPrice = internalRoom.basePrice;
                            }
                        } catch (e) {
                            console.error(`[Hotsoft] Failed to fetch fallback price from DB for ${roomType}`, e);
                        }

                        rooms.push({
                            roomTypeId: roomType,
                            name: roomType,
                            availableCount: minFree,
                            price: fallbackPrice,
                            currency: 'INR',
                            ratePlans: [],
                            maxOccupancy: 2
                        });
                    }
                } else if (parsedResponse?.Hotsoft?.Response?.ResponseMsg === "Failed.") {
                    // Log generic failure dynamically if needed
                    lastError = 'Hotsoft returned Failed.';
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown Hotsoft Error';
                console.error(`[Hotsoft] Availability check failed for room ${roomType}`, error);
            }
        }));

        if (!hasSuccess && rooms.length === 0) {
            return {
                status: 'failure',
                rooms: [],
                message: lastError || 'Hotsoft API failed for all room types.'
            };
        }

        return {
            status: 'success',
            rooms
        };
    }

    async createReservation(request: CRSCreateReservationRequest): Promise<CRSReservationResponse> {
        if (!HOTSOFT_CONFIG.bookingUrl || !HOTSOFT_CONFIG.appKey || !HOTSOFT_CONFIG.hotelId) {
            console.error('[Hotsoft] Configuration incomplete. Failing push reservation securely.');
            return {
                status: 'failed',
                reservationId: '',
                confirmationNumber: '',
                message: 'Hotsoft API configuration incomplete.',
                errors: ['Missing booking URL/app key/hotel id']
            };
        }

        const fullXml = buildBookingRequestXml(request);

        try {
            console.log(`[Hotsoft] Pushing Reservation to ${HOTSOFT_CONFIG.bookingUrl}`);
            console.log(`[Hotsoft] Payload XML:\n${fullXml}\n`);
            const response = await this.postXml(HOTSOFT_CONFIG.bookingUrl, fullXml);

            console.log('[Hotsoft] Booking Payload Response:', JSON.stringify(response, null, 2));

            // Parse response structured like:
            // <BookingResponse Status="Success" Remarks="Success" CrsReff="46193" CrsBookingId="4" />
            const bookingResponse = response?.BookingResponse;

            if (bookingResponse) {
                if (bookingResponse.Status === "Success") {
                    const reservationId = bookingResponse.CrsReff?.toString()?.trim() || `HS-${request.reservationRef}`;
                    const confirmationNumber = bookingResponse.CrsBookingId?.toString()?.trim() || `OL-${request.reservationRef}`;

                    return {
                        status: 'confirmed',
                        reservationId,
                        confirmationNumber,
                        message: bookingResponse.Remarks || 'Reservation pushed to Hotsoft successfully.',
                    };
                } else {
                    return {
                        status: 'failed',
                        reservationId: '',
                        confirmationNumber: '',
                        message: bookingResponse.Remarks || 'Hotsoft API returned a failure status.',
                        errors: [bookingResponse.Remarks]
                    };
                }
            }

            // Fallback mock failed response if response structure is not matched but no HTTP error
            return {
                status: 'failed',
                reservationId: '',
                confirmationNumber: '',
                message: 'Hotsoft API returned an unrecognized response structure.',
                errors: ['Unrecognized response structure']
            };

        } catch (error) {
            console.error('[Hotsoft] Create reservation failed', error);
            return {
                status: 'failed',
                reservationId: '',
                confirmationNumber: '',
                message: error instanceof Error ? error.message : 'Unknown Hotsoft Error',
                errors: [String(error)]
            };
        }
    }

    /**
     * Efficiently retrieves an entire year of availability per room type, bucketing the free room counts by month.
     */
    async getYearlyAggregates(year: number, roomTypesToCheck: string[]): Promise<{
        status: 'success' | 'failure';
        aggregates?: Record<string, Record<string, { freeSum: number; days: number }>>;
        message?: string;
    }> {
        if (!HOTSOFT_CONFIG.availabilityUrl || !HOTSOFT_CONFIG.appKey || !HOTSOFT_CONFIG.hotelId) {
            return {
                status: 'failure',
                message: 'Hotsoft configuration incomplete.',
            };
        }

        const aggregates: Record<string, Record<string, { freeSum: number; days: number }>> = {};
        let hasSuccess = false;
        let lastError = '';

        await Promise.all(roomTypesToCheck.map(async (roomType) => {
            aggregates[roomType] = {};

            const hotelDet: any = {
                HotelId: HOTSOFT_CONFIG.hotelId,
                RoomType: getHotsoftRoomId(roomType),
                DtFrom: `01/01/${year}`,
                DtTo: `31/12/${year}`,
                AvailType: '1',
            };

            const xmlPayload = xmlBuilder.build({
                Hotsoft: {
                    Login: { AppKey: HOTSOFT_CONFIG.appKey },
                    HOTEL_DET: hotelDet
                }
            });

            const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

            try {
                const parsedResponse = await this.postXml(HOTSOFT_CONFIG.availabilityUrl, fullXml);

                if (parsedResponse?.Hotsoft?.Response?.ResponseMsg !== "Failed.") {
                    hasSuccess = true;
                    const availabilityData = parsedResponse?.Hotsoft?.availability;
                    if (availabilityData) {
                        const availItems = Array.isArray(availabilityData) ? availabilityData : [availabilityData];
                        const trackerDate = new Date(year, 0, 1);
                        
                        for (const item of availItems) {
                            const month = String(trackerDate.getMonth() + 1).padStart(2, '0');
                            const aggKey = `${year}-${month}`; // e.g., '2026-01'

                            if (!aggregates[roomType][aggKey]) {
                                aggregates[roomType][aggKey] = { freeSum: 0, days: 0 };
                            }

                            const freeCount = parseInt(item.free, 10);
                            if (!isNaN(freeCount)) {
                                aggregates[roomType][aggKey].freeSum += freeCount;
                                aggregates[roomType][aggKey].days += 1;
                            }

                            trackerDate.setDate(trackerDate.getDate() + 1);
                        }
                    }
                } else if (parsedResponse?.Hotsoft?.Response?.ResponseMsg === "Failed.") {
                    lastError = 'Hotsoft returned Failed.';
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown Hotsoft Error';
                console.error(`[Hotsoft] Yearly aggregate failed for room ${roomType}`, error);
            }
        }));

        if (!hasSuccess) {
            return {
                status: 'failure',
                message: lastError || 'Hotsoft API failed for all room types.',
                aggregates
            };
        }

        return {
            status: 'success',
            aggregates
        };
    }

    /**
     * Efficiently retrieves a daily map of free rooms for a specific date range.
     * Perfect for rendering full monthly calendar grids in one API call.
     */
    async getCalendarAvailability(roomTypeSlug: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
        const dailyAvailability: Record<string, number> = {};
        
        if (!HOTSOFT_CONFIG.availabilityUrl || !HOTSOFT_CONFIG.appKey || !HOTSOFT_CONFIG.hotelId) {
            return dailyAvailability;
        }

        const hotelDet: any = {
            HotelId: HOTSOFT_CONFIG.hotelId,
            RoomType: getHotsoftRoomId(roomTypeSlug),
            DtFrom: formatDateToHotsoft(startDate.toISOString()),
            DtTo: formatDateToHotsoft(endDate.toISOString()),
            AvailType: '1',
        };

        const xmlPayload = xmlBuilder.build({
            Hotsoft: {
                Login: { AppKey: HOTSOFT_CONFIG.appKey },
                HOTEL_DET: hotelDet
            }
        });

        const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

        try {
            const parsedResponse = await this.postXml(HOTSOFT_CONFIG.availabilityUrl, fullXml);

            if (parsedResponse?.Hotsoft?.Response?.ResponseMsg !== "Failed.") {
                const availabilityData = parsedResponse?.Hotsoft?.availability;
                if (availabilityData) {
                    const availItems = Array.isArray(availabilityData) ? availabilityData : [availabilityData];
                    
                    for (const item of availItems) {
                        const dateStr = item.Date; // Usually MM/DD/YYYY
                        if (dateStr && typeof dateStr === 'string' && dateStr.includes('/')) {
                            const [m, d, y] = dateStr.split('/');
                            const dateKey = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                            const freeCount = parseInt(item.free, 10);
                            
                            if (!isNaN(freeCount)) {
                                dailyAvailability[dateKey] = freeCount;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[Hotsoft] Calendar availability failed for room ${roomTypeSlug}`, error);
        }

        return dailyAvailability;
    }

    /**
     * Helper to send raw XML to the Hotsoft API and parse the response
     */
    private async postXml(url: string, xmlPayload: string): Promise<any> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), HOTSOFT_CONFIG.timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'Accept': 'text/xml, application/xml',
                },
                body: xmlPayload,
                signal: controller.signal,
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMsg = `HTTP Error ${response.status}`;
                try {
                    const parsedErr = this.xmlParser.parse(responseText);
                    errorMsg = JSON.stringify(parsedErr);
                } catch (e) {
                    errorMsg = responseText;
                }
                throw new Error(errorMsg);
            }

            // Parse success XML to Javascript Object
            return this.xmlParser.parse(responseText);
        } finally {
            clearTimeout(timeout);
        }
    }
}
