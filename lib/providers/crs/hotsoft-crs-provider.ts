import { HOTSOFT_CONFIG, getHotsoftRoomId, getHotsoftRatePlanId, HOTSOFT_ROOM_MAPPING } from '../../config/hotsoft';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { db } from '../../db';
import { roomTypes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type {
    BookingProvider,
    CRSAvailabilityRequest,
    CRSAvailabilityResponse,
    CRSCreateReservationRequest,
    CRSReservationResponse,
} from './types';

// Format Date to dd/MM/yyyy
function formatDateToHotsoft(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format DateTime to dd/MM/yyyy HH:mm
function formatDateTimeToHotsoft(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export class HotsoftCrsProvider implements BookingProvider {
    readonly source = 'hotsoft_crs' as const;

    // We configure the builder to handle attributes, as Hotsoft makes heavy use of XML attributes
    private xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

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

            const xmlPayload = this.xmlBuilder.build({
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

        const checkInDate = formatDateToHotsoft(request.checkIn);

        // Build the <Rates> array
        const rates: any[] = [];

        for (const room of request.rooms) {
            // Need to calculate how many nights. (Simplified assumption: booking is for total nights between checkIn/checkOut)
            const checkIn = new Date(request.checkIn);
            const checkOut = new Date(request.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

            for (let i = 0; i < nights; i++) {
                const currentDate = new Date(checkIn);
                currentDate.setDate(currentDate.getDate() + i);

                rates.push({
                    '@_ID': getHotsoftRoomId(room.roomTypeId),
                    '@_Date': formatDateToHotsoft(currentDate.toISOString()),
                    '@_NoOfRooms': '1', // We assume 1 room per room block given the CRSCreateReservationRequest definition
                    '@_NoOfPax': (room.adults + room.children).toString(), // NoOfPax per room
                    '@_RatePlanId': getHotsoftRatePlanId(room.ratePlanId || 'EP'), // Default to European Plan if undefined
                    '@_ChildPax': room.children.toString(),
                });
            }
        }

        const xmlPayload = this.xmlBuilder.build({
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
                    '@_CheckInDateTime': formatDateTimeToHotsoft(request.checkIn),
                    '@_CheckOutDateTime': formatDateTimeToHotsoft(request.checkOut),
                    '@_TotalPax': (request.rooms.reduce((sum, r) => sum + r.adults + r.children, 0)).toString(),
                    '@_Children': (request.rooms.reduce((sum, r) => sum + r.children, 0)).toString(),
                    '@_Amount': typeof request.payment?.subtotal === 'number' ? (request.payment.subtotal / 100).toFixed(2) : '0.00',
                    '@_Taxes': typeof request.payment?.taxAmount === 'number' ? (request.payment.taxAmount / 100).toFixed(2) : '0.00',
                    '@_TotalAmount': typeof request.payment?.amount === 'number' ? (request.payment.amount / 100).toFixed(2) : '0.00',
                },
                BookingDetails: {
                    '@_HotelID': HOTSOFT_CONFIG.hotelId,
                    '@_BookingNo': request.reservationRef,
                    '@_BookingDate': formatDateToHotsoft(new Date().toISOString()),
                    '@_BookedBy': `${request.primaryGuest.firstName} ${request.primaryGuest.lastName}`.trim(),
                    '@_OTA': 'Website',
                    '@_BookingStatus': 'Confirmed',
                    '@_AllInclusiveRates': 'Yes',
                    '@_Instructions': request.comments || '',
                },
                Rates: {
                    RoomType: rates
                }
            }
        });

        const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;

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
