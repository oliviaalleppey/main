/**
 * The BookingRequest XML pushed to Hotsoft. Datamate's front office reads these
 * attributes directly, so their shape is the contract.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBookingRequestXml } from '@/lib/providers/crs/hotsoft-crs-provider';

// Two Canal View King rooms, 2 nights at ₹8,995, plus a cake.
const ROOM_RATE = 899500;
const ROOM_TAX = 161910; // 18% of ₹8,995
const CAKE = 65000;
const CAKE_TAX = 11700;
const roomSubtotal = ROOM_RATE * 2 * 2;
const roomTax = ROOM_TAX * 2 * 2;

const xml = buildBookingRequestXml({
    reservationRef: 'OL-2909-TEST',
    checkIn: '2026-11-10',
    checkOut: '2026-11-12',
    rooms: [1, 2].map(() => ({
        roomTypeId: 'canal-view-king',
        ratePlanId: 'rp_canal-view-king_standard',
        adults: 1,
        children: 0,
        guestName: 'Asha Nair',
        nightlyRates: [ROOM_RATE, ROOM_RATE],
        nightlyTaxes: [ROOM_TAX, ROOM_TAX],
    })),
    primaryGuest: { title: 'Ms', firstName: 'Asha', lastName: 'Nair', email: 'asha@example.com', phone: '+91 98765 43210' },
    payment: {
        method: 'online',
        subtotal: roomSubtotal + CAKE,
        taxAmount: roomTax + CAKE_TAX,
        amount: roomSubtotal + CAKE + roomTax + CAKE_TAX,
    },
    comments: 'Late arrival',
    addOns: [{ name: 'Chocolate cake', quantity: 1, subtotal: CAKE }],
    addOnTax: CAKE_TAX,
});

const attr = (node: string, name: string) => new RegExp(`<${node}\\b[^>]*\\b${name}="([^"]*)"`).exec(xml)?.[1];
const roomTypeNodes = [...xml.matchAll(/<RoomType\b([^>]*)\/?>/g)].map((match) =>
    Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));

test('dates are the hotel\'s own, with its check-in and check-out times', () => {
    assert.equal(attr('CheckinDetails', 'CheckInDateTime'), '10/11/2026 14:00');
    assert.equal(attr('CheckinDetails', 'CheckOutDateTime'), '12/11/2026 11:00');
});

test('one RoomType line per room type and night, carrying the room count', () => {
    // Hotsoft keeps one node's room and guest counts, so rooms must not be split
    // into a node each (that sent OL-1009-HL0Y through as one room at 3x the tariff).
    assert.equal(roomTypeNodes.length, 2);
    assert.deepEqual(roomTypeNodes.map((node) => node.Date), ['10/11/2026', '11/11/2026']);
    for (const node of roomTypeNodes) {
        assert.equal(node.ID, '91372');
        assert.equal(node.RatePlanId, 'C');
        assert.equal(node.NoOfRooms, '2');
        assert.equal(node.NoOfPax, '2');
        assert.equal(node.Rate, '8995.00');
        assert.equal(node.Tax, '1619.10');
    }
});

test('nightly lines add back up to the room part of the header', () => {
    const lineTotal = (key: 'Rate' | 'Tax') =>
        roomTypeNodes.reduce((sum, node) => sum + Math.round(Number(node[key]) * 100) * Number(node.NoOfRooms), 0);
    assert.equal(lineTotal('Rate'), roomSubtotal);
    assert.equal(lineTotal('Tax'), roomTax);
    assert.equal(attr('CheckinDetails', 'TotalAmount'), ((roomSubtotal + CAKE + roomTax + CAKE_TAX) / 100).toFixed(2));
});

test('prepaid add-ons are named in Instructions so the desk does not bill them again', () => {
    const instructions = attr('BookingDetails', 'Instructions') ?? '';
    assert.match(instructions, /^Late arrival \| PREPAID ADD-ONS/);
    assert.match(instructions, /Chocolate cake x1 Rs\.650\.00/);
    assert.match(instructions, /plus GST Rs\.117\.00/);
});

test('booking header identifies the website and keeps AllInclusiveRates at its default', () => {
    assert.equal(attr('BookingDetails', 'BookingNo'), 'OL-2909-TEST');
    assert.equal(attr('BookingDetails', 'OTA'), 'Website');
    assert.equal(attr('BookingDetails', 'AllInclusiveRates'), 'Yes');
    assert.equal(attr('GuestDetails', 'GuestName'), 'Asha Nair');
});
