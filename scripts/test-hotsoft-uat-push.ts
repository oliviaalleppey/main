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
 * UAT_ROOM_MIX books several room types at once, as ID:rooms:rupees-a-night,
 * comma-separated, and overrides UAT_ROOM_ID and UAT_ROOMS. Each room is taxed
 * night by night on its own slab, so a mix either side of Rs 7,500 carries 5%
 * on one type and 18% on the other, the way a real booking would.
 *
 * Run:
 *   HOTSOFT_APP_KEY=DM20022026OLIVIAUAT8001WI HOTSOFT_HOTEL_ID=8001 \
 *   HOTSOFT_BOOKING_URL=https://purplekeys.co.in/OliviaUAT/OTAbookingsUpdate.aspx \
 *   UAT_ROOMS=3 npx tsx scripts/test-hotsoft-uat-push.ts
 *
 *   ... UAT_ROOM_MIX="80016:1:10499,80012:2:7499" npx tsx scripts/test-hotsoft-uat-push.ts
 */
import 'dotenv/config';
import { XMLParser } from 'fast-xml-parser';
import { buildBookingRequestXml } from '../lib/providers/crs/hotsoft-crs-provider';
import { calculateRoomTaxForNightlyRates, splitStayIntoNightlyCharges } from '../lib/services/tax';
import { HOTSOFT_CONFIG } from '../lib/config/hotsoft';

const PRODUCTION_HOTEL_ID = '9137';
/** A room that exists in the UAT property, not the live one. */
const UAT_ROOM_ID = process.env.UAT_ROOM_ID || '80016';
/** Rooms of that type in the one booking. */
const UAT_ROOMS = Math.max(1, Math.floor(Number(process.env.UAT_ROOMS) || 1));

/** One room type in the test booking. */
type RoomLine = { roomId: string; rooms: number; pricePerNight: number };

/** The booking's room types: UAT_ROOM_MIX if set, otherwise UAT_ROOMS of UAT_ROOM_ID at Rs 10,499. */
function roomLines(): RoomLine[] {
    const mix = process.env.UAT_ROOM_MIX?.trim();
    if (!mix) return [{ roomId: UAT_ROOM_ID, rooms: UAT_ROOMS, pricePerNight: 1_049_900 }];

    return mix.split(',').map((part) => {
        const [roomId, rooms, rupees] = part.trim().split(':');
        if (!roomId) throw new Error(`UAT_ROOM_MIX entry "${part}" has no room id`);
        return {
            roomId,
            rooms: Math.max(1, Math.floor(Number(rooms) || 1)),
            pricePerNight: Math.round((Number(rupees) || 10_499) * 100),
        };
    });
}

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

    const nights = 2;
    const lines = roomLines();
    const items = lines.map((line) => ({
        pricePerNight: line.pricePerNight,
        subtotal: line.pricePerNight * nights * line.rooms,
        rooms: line.rooms,
    }));
    const roomSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const roomTax = lines.reduce(
        (sum, line) => sum + calculateRoomTaxForNightlyRates(new Array(nights).fill(line.pricePerNight), line.rooms),
        0
    );

    // One entry per physical room, items in order — the same order the charges come back in.
    const roomIds = lines.flatMap((line) => new Array<string>(line.rooms).fill(line.roomId));
    const charges = splitStayIntoNightlyCharges({ items, nights, roomTaxTotal: roomTax });

    const reference = `OL-UAT-${Date.now().toString().slice(-6)}`;
    const xml = buildBookingRequestXml({
        reservationRef: reference,
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        rooms: charges.map((room, index) => ({
            roomTypeId: roomIds[index],
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
        // Named in the instructions so Datamate can tell the two GST test pushes
        // apart on the FO screen without cross-referencing references by hand.
        comments: `Automated integration test, AllInclusiveRates=${HOTSOFT_CONFIG.allInclusiveRates} — please ignore`,
    });

    const summary = lines.map((line) => `${line.rooms} x ${line.roomId} @ Rs ${line.pricePerNight / 100}`).join(', ');
    console.log(`Hotel ${HOTSOFT_CONFIG.hotelId} at ${HOTSOFT_CONFIG.bookingUrl}, ${summary}`);
    console.log(`AllInclusiveRates=${HOTSOFT_CONFIG.allInclusiveRates}\n`);
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
