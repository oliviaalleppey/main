/**
 * Pushes one test reservation to Hotsoft's UAT endpoint.
 *
 * The payload is built by the same buildBookingRequestXml() the live push uses,
 * so this exercises the real thing: one <RoomType> per room type per night with
 * NoOfRooms and NoOfPax, Rate/Tax per room, RatePlanId as the single letter, the
 * policy times, and the timezone-independent dates.
 *
 * UAT only. It refuses to run against the production hotel id, because a booking
 * pushed there occupies real inventory in the hotel's PMS.
 *
 * UAT_ROOMS books that many rooms of the one type (default 1) — the shape that
 * broke in OL-1009-HL0Y, and the one Datamate asked to see pushed to UAT.
 *
 * Run:
 *   HOTSOFT_APP_KEY=DM20022026OLIVIAUAT8001WI HOTSOFT_HOTEL_ID=8001 \
 *   HOTSOFT_BOOKING_URL=https://purplekeys.co.in/OliviaUAT/OTAbookingsUpdate.aspx \
 *   UAT_ROOMS=3 npx tsx scripts/test-hotsoft-uat-push.ts
 */
import 'dotenv/config';
import { XMLParser } from 'fast-xml-parser';
import { buildBookingRequestXml } from '../lib/providers/crs/hotsoft-crs-provider';
import { splitStayIntoNightlyCharges } from '../lib/services/tax';
import { HOTSOFT_CONFIG } from '../lib/config/hotsoft';

const PRODUCTION_HOTEL_ID = '9137';
/** A room that exists in the UAT property, not the live one. */
const UAT_ROOM_ID = process.env.UAT_ROOM_ID || '80016';
/** Rooms of that type in the one booking. */
const UAT_ROOMS = Math.max(1, Math.floor(Number(process.env.UAT_ROOMS) || 1));

async function main() {
    if (HOTSOFT_CONFIG.hotelId === PRODUCTION_HOTEL_ID) {
        console.error(
            `Refusing to run: HOTSOFT_HOTEL_ID is ${PRODUCTION_HOTEL_ID}, the live hotel.\n` +
            'Set the UAT credentials on the command line — see the header of this file.'
        );
        process.exit(1);
    }
    if (!HOTSOFT_CONFIG.bookingUrl.includes('UAT')) {
        console.error(`Refusing to run: booking URL is not a UAT endpoint (${HOTSOFT_CONFIG.bookingUrl})`);
        process.exit(1);
    }

    // Two nights at Rs 10,499 a room — both above the Rs 7,500 slab, so 18% on each.
    const pricePerNight = 1_049_900;
    const nights = 2;
    const roomSubtotal = pricePerNight * nights * UAT_ROOMS;
    const roomTax = 377_964 * UAT_ROOMS;

    const charges = splitStayIntoNightlyCharges({
        items: [{ pricePerNight, subtotal: roomSubtotal, rooms: UAT_ROOMS }],
        nights,
        roomTaxTotal: roomTax,
    });

    const reference = `OL-UAT-${Date.now().toString().slice(-6)}`;
    const xml = buildBookingRequestXml({
        reservationRef: reference,
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        rooms: charges.map((room) => ({
            roomTypeId: UAT_ROOM_ID,
            ratePlanId: 'rp_lake-view-balcony_standard', // must come out as "C"
            adults: 2,
            children: 0,
            guestName: 'Integration Test',
            nightlyRates: room.nightlyRates,
            nightlyTaxes: room.nightlyTaxes,
        })),
        primaryGuest: {
            title: 'Mr',
            firstName: 'Integration',
            lastName: 'Test',
            email: 'reservation@oliviaalleppey.com',
            phone: '9999999999',
        },
        payment: {
            method: 'online',
            subtotal: roomSubtotal,
            taxAmount: roomTax,
            amount: roomSubtotal + roomTax,
        },
        comments: 'Automated integration test — please ignore',
    });

    console.log(`Hotel ${HOTSOFT_CONFIG.hotelId} at ${HOTSOFT_CONFIG.bookingUrl}, ${UAT_ROOMS} room(s)\n`);
    console.log(xml);

    const response = await fetch(HOTSOFT_CONFIG.bookingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml', Accept: 'text/xml, application/xml' },
        body: xml,
    });

    const text = await response.text();
    console.log(`\n--- HTTP ${response.status} ---\n${text}`);

    try {
        const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(text);
        const booking = parsed?.BookingResponse;
        if (booking) {
            console.log(
                `\nStatus  : ${booking.Status}\nRemarks : ${booking.Remarks}` +
                `\nCrsReff : ${booking.CrsReff ?? '-'}\nCrsBooking: ${booking.CrsBookingId ?? '-'}`
            );
            console.log(booking.Status === 'Success'
                ? `\nAccepted. Reference ${reference} — ask Datamate to clear it from UAT.`
                : '\nRejected. The Remarks above are what to send Datamate.');
        }
    } catch {
        console.log('\nResponse was not parseable XML — raw text above is what they returned.');
    }
}

main().catch((error) => {
    console.error('Push failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
