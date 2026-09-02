/**
 * Verifies the per-room, per-night Rate and Tax attributes Hotsoft asked us to
 * add to each <RoomType> node, and that they still add up to the header's
 * Amount and Taxes.
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

/** The <RoomType> nodes of a built payload, as Hotsoft would read them. */
function nightlyLines(xml: string): { Rate: string; Tax: string; Date: string; ID: string }[] {
    const parsed = parser.parse(xml);
    return [].concat(parsed?.BookingRequest?.Rates?.RoomType ?? []);
}

const toPaise = (attribute: string) => Math.round(parseFloat(attribute) * 100);
const sumAttribute = (xml: string, key: 'Rate' | 'Tax') =>
    nightlyLines(xml).reduce((sum, line) => sum + toPaise(line[key]), 0);

/**
 * A booking as it reaches the CRS push: stored line items split into priced
 * nights, exactly the way booking-service does it.
 */
function reservation(input: {
    nights: number;
    items: { pricePerNight: number; subtotal: number; rooms: number }[];
    /** What the booking carries in tax_amount — rooms and add-ons together. */
    bookingTax: number;
    addOnSubtotal?: number;
}): CRSCreateReservationRequest {
    const addOnSubtotal = input.addOnSubtotal ?? 0;
    const roomSubtotal = input.items.reduce((sum, item) => sum + item.subtotal, 0);
    const charges = splitStayIntoNightlyCharges({
        items: input.items,
        nights: input.nights,
        roomTaxTotal: Math.max(0, input.bookingTax - Math.round(addOnSubtotal * 0.18)),
    });

    const checkIn = new Date('2026-08-31T00:00:00.000Z');
    const checkOut = new Date(checkIn.getTime() + input.nights * 86400000);

    let cursor = 0;
    const rooms = input.items.flatMap((item) =>
        Array.from({ length: item.rooms }, () => ({
            roomTypeId: 'lake-view-balcony',
            ratePlanId: 'rp_lake-view-balcony_standard',
            adults: 1,
            children: 0,
            guestName: 'Aaron Katz',
            nightlyRates: charges[cursor].nightlyRates,
            nightlyTaxes: charges[cursor++].nightlyTaxes,
        }))
    );

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

    const emitted = xml.split('<Rates>')[1].split('</Rates>')[0].trim().split('\n').map((line) => line.trim());
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

console.log('\n--- 2 rooms of one type, 2 nights ---');
{
    const xml = buildBookingRequestXml(reservation({
        nights: 2,
        items: [{ pricePerNight: 1_049_900, subtotal: 4_199_600, rooms: 2 }],
        bookingTax: 755_928,
    }));
    check('one line per room per night', nightlyLines(xml).length, 4, String);
    checkText('rate is per room, not per booking', nightlyLines(xml)[0].Rate, '10499.00');
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 4_199_600);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 755_928);
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

console.log('\n--- odd totals keep their paise ---');
{
    // ₹10,000.01 over 3 rooms and 3 nights: nine lines, nothing lost or invented.
    const xml = buildBookingRequestXml(reservation({
        nights: 3,
        items: [{ pricePerNight: 111_112, subtotal: 1_000_001, rooms: 3 }],
        bookingTax: 50_000,
    }));
    check('nine nightly lines', nightlyLines(xml).length, 9, String);
    check('rates sum to Amount', sumAttribute(xml, 'Rate'), 1_000_001);
    check('taxes sum to Taxes', sumAttribute(xml, 'Tax'), 50_000);
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
