/**
 * Verifies the <RoomType> nodes Hotsoft reads a booking's rooms and money from:
 * one node per room type, rate plan and night, carrying NoOfRooms and NoOfPax,
 * with Rate and Tax per room — and that those still add back up to the header's
 * Amount and Taxes once Hotsoft multiplies them by NoOfRooms.
 *
 * Builds the real payload — no network, no database writes.
 * Run: npx tsx scripts/verify-hotsoft-rates.ts
 */
import 'dotenv/config';
import { XMLParser } from 'fast-xml-parser';
import { buildBookingRequestXml } from '../lib/providers/crs/hotsoft-crs-provider';
import { getHotsoftRatePlanId } from '../lib/config/hotsoft';
import { splitStayIntoNightlyCharges } from '../lib/services/tax';
import type { CRSCreateReservationRequest } from '../lib/providers/crs/types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

let failures = 0;
function check(label: string, actual: number, expected: number, format = rupees) {
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${label}\n      expected ${format(expected)}   actual ${format(actual)}`
    );
}

function checkText(label: string, actual: string, expected: string) {
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n      expected ${expected}   actual ${actual}`);
}

/** Pass when `actual` is within `tolerance` paise of `expected`. */
function checkWithin(label: string, actual: number, expected: number, tolerance: number) {
    const ok = Math.abs(actual - expected) <= tolerance;
    if (!ok) failures++;
    console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${label}\n      expected ${rupees(expected)} ± ${tolerance} paise   actual ${rupees(actual)}`
    );
}

type RoomTypeLine = {
    ID: string;
    Date: string;
    NoOfRooms: string;
    NoOfPax: string;
    ChildPax: string;
    Rate: string;
    Tax: string;
};

/** The <RoomType> nodes of a built payload, as Hotsoft would read them. */
function nightlyLines(xml: string): RoomTypeLine[] {
    const parsed = parser.parse(xml);
    return [].concat(parsed?.BookingRequest?.Rates?.RoomType ?? []);
}

/** The <RoomType> nodes exactly as serialised, one string per node. */
function emittedLines(xml: string): string[] {
    return xml.split('<Rates>')[1].split('</Rates>')[0].trim().split('\n').map((line) => line.trim());
}

const toPaise = (attribute: string) => Math.round(parseFloat(attribute) * 100);
/** What the lines come to once Hotsoft multiplies each per-room figure back up by NoOfRooms. */
const sumAttribute = (xml: string, key: 'Rate' | 'Tax') =>
    nightlyLines(xml).reduce((sum, line) => sum + toPaise(line[key]) * Number(line.NoOfRooms), 0);

/**
 * A booking as it reaches the CRS push: stored line items split into priced
 * nights, exactly the way booking-service does it.
 */
function reservation(input: {
    nights: number;
    items: { pricePerNight: number; subtotal: number; rooms: number; roomType?: string; adults?: number }[];
    /** What the booking carries in tax_amount — rooms and add-ons together. */
    bookingTax: number;
    addOnSubtotal?: number;
    /** YYYY-MM-DD. */
    checkIn?: string;
}): CRSCreateReservationRequest {
    const addOnSubtotal = input.addOnSubtotal ?? 0;
    const roomSubtotal = input.items.reduce((sum, item) => sum + item.subtotal, 0);
    const charges = splitStayIntoNightlyCharges({
        items: input.items,
        nights: input.nights,
        roomTaxTotal: Math.max(0, input.bookingTax - Math.round(addOnSubtotal * 0.18)),
    });

    const checkIn = new Date(`${input.checkIn ?? '2026-08-31'}T00:00:00.000Z`);
    const checkOut = new Date(checkIn.getTime() + input.nights * 86400000);

    let cursor = 0;
    const rooms = input.items.flatMap((item) => {
        const roomType = item.roomType ?? 'lake-view-balcony';
        return Array.from({ length: item.rooms }, () => ({
            roomTypeId: roomType,
            ratePlanId: `rp_${roomType}_standard`,
            adults: item.adults ?? 1,
            children: 0,
            guestName: 'Aaron Katz',
            nightlyRates: charges[cursor].nightlyRates,
            nightlyTaxes: charges[cursor++].nightlyTaxes,
        }));
    });

    return {
        reservationRef: 'OL-3008-VBZA',
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        rooms,
        primaryGuest: {
            title: 'Mr',
            firstName: 'Aaron',
            lastName: 'Katz',
            email: 'guest@example.com',
            phone: '+1 9179024027',
        },
        payment: {
            method: 'online',
            subtotal: roomSubtotal + addOnSubtotal,
            taxAmount: input.bookingTax,
            amount: roomSubtotal + addOnSubtotal + input.bookingTax,
        },
    };
}

console.log('--- OL-3008-VBZA, exactly as Hotsoft asked for it back ---');
{
    // Their header, verbatim: Amount 20,998.00 and Taxes 1,889.82. Whatever we
    // think of that tax figure, the nightly lines have to split the tax the
    // booking carries — so this must come back as their Tax="944.91".
    const xml = buildBookingRequestXml(reservation({
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1 }],
        bookingTax: 188_982,
    }));

    const emitted = emittedLines(xml);
    const wanted = [
        '<RoomType ID="91374" Date="31/08/2026" NoOfRooms="1" NoOfPax="1" RatePlanId="C" ChildPax="0" Rate="10499.00" Tax="944.91"></RoomType>',
        '<RoomType ID="91374" Date="01/09/2026" NoOfRooms="1" NoOfPax="1" RatePlanId="C" ChildPax="0" Rate="10499.00" Tax="944.91"></RoomType>',
    ];

    check('two nightly lines', emitted.length, 2, String);
    checkText('night 1 matches their spec character for character', emitted[0], wanted[0]);
    checkText('night 2 matches their spec character for character', emitted[1], wanted[1]);
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 2_099_800);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 188_982);
}

console.log('\n--- OL-1009-HL0Y, exactly as Hotsoft asked for it back ---');
{
    // Datamate, 2026-09-10: three Canal View King rooms for three adults went out
    // as six single-room lines, and reached the PMS as one room for one adult at
    // ₹22,497 a night. Their expected <Rates>, verbatim: a line per night, all three rooms on it.
    const xml = buildBookingRequestXml(reservation({
        checkIn: '2026-11-22',
        nights: 2,
        items: [{ roomType: 'canal-view-king', pricePerNight: 749_900, subtotal: 4_499_400, rooms: 3 }],
        bookingTax: 224_970,
    }));

    const emitted = emittedLines(xml);
    const wanted = [
        '<RoomType ID="91372" Date="22/11/2026" NoOfRooms="3" NoOfPax="3" RatePlanId="C" ChildPax="0" Rate="7499.00" Tax="374.95"></RoomType>',
        '<RoomType ID="91372" Date="23/11/2026" NoOfRooms="3" NoOfPax="3" RatePlanId="C" ChildPax="0" Rate="7499.00" Tax="374.95"></RoomType>',
    ];

    check('two nightly lines, not six', emitted.length, 2, String);
    checkText('night 1 matches their spec character for character', emitted[0], wanted[0]);
    checkText('night 2 matches their spec character for character', emitted[1], wanted[1]);
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 4_499_400);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 224_970);
}

console.log('\n--- dates and policy times do not depend on the server timezone ---');
{
    // check_in / check_out are DATE columns. Rendering them through Date and
    // local getters moved the date a whole day west of UTC; it only looked right
    // because Vercel runs UTC. Re-run the same build under several zones.
    const request = reservation({
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1 }],
        bookingTax: 377_964,
    });
    const dateOnly = { ...request, checkIn: '2026-08-31', checkOut: '2026-09-02' };

    const originalTz = process.env.TZ;
    const seen = new Set<string>();
    for (const tz of ['UTC', 'Asia/Kolkata', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
        process.env.TZ = tz;
        const xml = buildBookingRequestXml(dateOnly);
        const checkin = /CheckInDateTime="([^"]+)"/.exec(xml)?.[1] ?? '';
        const checkout = /CheckOutDateTime="([^"]+)"/.exec(xml)?.[1] ?? '';
        const firstNight = nightlyLines(xml)[0].Date;
        seen.add(`${checkin}|${checkout}|${firstNight}`);
        checkText(`${tz.padEnd(20)} check-in`, checkin, '31/08/2026 14:00');
        checkText(`${tz.padEnd(20)} check-out`, checkout, '02/09/2026 11:00');
        checkText(`${tz.padEnd(20)} first night`, firstNight, '31/08/2026');
    }
    if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    check('identical output in every timezone', seen.size, 1, String);
}

console.log('\n--- RatePlanId is the single letter Hotsoft asked for ---');
{
    // Datamate, 2026-09-02: "RatePlanId should be C for CP, A for AP, M for MAP
    // and E for EP." Every Olivia rate includes breakfast, so all six rooms are C.
    for (const plan of [
        'rp_boat-race-suite_standard', 'rp_canal-view-king_standard',
        'rp_canal-view-superior-family_standard', 'rp_lake-view-balcony_standard',
        'rp_lake-view-balcony-suite_standard', 'rp_lake-view-twin_standard',
    ]) {
        checkText(`${plan} -> C`, getHotsoftRatePlanId(plan), 'C');
    }
    checkText('EP -> E', getHotsoftRatePlanId('EP'), 'E');
    checkText('AP -> A', getHotsoftRatePlanId('AP'), 'A');
    checkText('MAP -> M', getHotsoftRatePlanId('MAP'), 'M');
    checkText('C stays C', getHotsoftRatePlanId('C'), 'C');
}

console.log('\n--- the same stay once the per-night GST fix ships ---');
{
    // Both nights are above the ₹7,500 slab, so the correct tax is 3,779.64 —
    // twice what that booking carried. The lines track the header either way.
    const xml = buildBookingRequestXml(reservation({
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1 }],
        bookingTax: 377_964,
    }));
    checkText('nightly rate is unchanged', nightlyLines(xml)[0].Rate, '10499.00');
    checkText('nightly tax doubles with the header', nightlyLines(xml)[0].Tax, '1889.82');
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 2_099_800);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 377_964);
}

console.log('\n--- OL-0509-U1UE: 2 Lake View Balcony rooms, 4 adults, 2 nights ---');
{
    // The same fault five days earlier: it reached the PMS as one room for two.
    const xml = buildBookingRequestXml(reservation({
        checkIn: '2026-10-27',
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 4_199_600, rooms: 2, adults: 2 }],
        bookingTax: 755_928,
    }));
    check('one line per night, not per room per night', nightlyLines(xml).length, 2, String);
    checkText('the line carries both rooms', nightlyLines(xml)[0].NoOfRooms, '2');
    checkText('and all four guests', nightlyLines(xml)[0].NoOfPax, '4');
    checkText('rate is per room, not per booking', nightlyLines(xml)[0].Rate, '10499.00');
    checkText('tax is per room, not per booking', nightlyLines(xml)[0].Tax, '1889.82');
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 4_199_600);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 755_928);
}

console.log('\n--- two room types in one booking: a line per type per night ---');
{
    const xml = buildBookingRequestXml(reservation({
        nights: 2,
        items: [
            { roomType: 'lake-view-balcony', pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1, adults: 2 },
            { roomType: 'canal-view-king', pricePerNight: 749_900, subtotal: 2_999_600, rooms: 2, adults: 2 },
        ],
        bookingTax: 377_964 + 149_980,
    }));
    const lines = nightlyLines(xml);
    const ofType = (id: string, key: 'NoOfRooms' | 'NoOfPax') =>
        lines.filter((line) => line.ID === id).map((line) => line[key]).join(',');
    check('four lines: two types, two nights', lines.length, 4, String);
    checkText('Canal View King carries both its rooms', ofType('91372', 'NoOfRooms'), '2,2');
    checkText('and all four of their guests', ofType('91372', 'NoOfPax'), '4,4');
    checkText('Lake View Balcony stays one room', ofType('91374', 'NoOfRooms'), '1,1');
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 2_099_800 + 2_999_600);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 377_964 + 149_980);
}

console.log('\n--- stay straddling the ₹7,500 slab (₹7,499 + ₹8,499) ---');
{
    // Charged 190,477: 5% on the cheap night, 18% on the dear one. The stored
    // scalars only support an even split, so the lines average the tariff — but
    // the tax total is the one the guest paid, to the paise.
    const xml = buildBookingRequestXml(reservation({
        nights: 2,
        items: [{ pricePerNight: 799_900, subtotal: 1_599_800, rooms: 1 }],
        bookingTax: 190_477,
    }));
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 1_599_800);
    check('taxes sum to the tax charged', sumAttribute(xml, 'Tax'), 190_477);
}

console.log('\n--- booking with an add-on (header carries it, nightly lines do not) ---');
{
    const request = reservation({
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 2_099_800, rooms: 1 }],
        addOnSubtotal: 100_000,
        bookingTax: 377_964 + 18_000,
    });
    const xml = buildBookingRequestXml(request);
    check('rates sum to rooms only', sumAttribute(xml, 'Rate'), 2_099_800);
    check('taxes sum to room tax only', sumAttribute(xml, 'Tax'), 377_964);
    check('header Amount still includes the add-on', request.payment!.subtotal!, 2_199_800);
}

console.log('\n--- odd totals: the lines round, the header keeps the paise ---');
{
    // ₹10,000.01 over 3 rooms and 3 nights. Hotsoft multiplies one per-room Rate
    // by NoOfRooms, and no rate times three can make that odd paisa — so the lines
    // may miss by up to half a paisa per room-night. Amount carries the exact figure.
    const xml = buildBookingRequestXml(reservation({
        nights: 3,
        items: [{ pricePerNight: 111_112, subtotal: 1_000_001, rooms: 3 }],
        bookingTax: 50_000,
    }));
    check('three nightly lines', nightlyLines(xml).length, 3, String);
    checkWithin('rates land within rounding of Amount', sumAttribute(xml, 'Rate'), 1_000_001, 4);
    checkWithin('taxes land within rounding of Taxes', sumAttribute(xml, 'Tax'), 50_000, 4);
    checkText('header Amount keeps every paisa', /\bAmount="([^"]+)"/.exec(xml)?.[1] ?? '', '10000.01');
}

console.log('\n--- caller supplies no split: fall back to the header totals ---');
{
    const xml = buildBookingRequestXml({
        reservationRef: 'OL-TEST-0001',
        checkIn: '2026-08-31T00:00:00.000Z',
        checkOut: '2026-09-02T00:00:00.000Z',
        rooms: [
            { roomTypeId: 'lake-view-balcony', ratePlanId: 'EP', adults: 2, children: 0, guestName: 'Test Guest' },
        ],
        primaryGuest: { title: 'Mr', firstName: 'Test', lastName: 'Guest', email: 't@example.com', phone: '9999999999' },
        payment: { method: 'online', subtotal: 2_099_800, taxAmount: 377_964, amount: 2_477_764 },
    });
    checkText('Rate is still emitted', nightlyLines(xml)[0].Rate, '10499.00');
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 2_099_800);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 377_964);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
