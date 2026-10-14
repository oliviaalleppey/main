import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MASQUERADE_SELL_ORDER, allocateRooms, orderForSale, sellRankForSlug, totalAvailable, type RoomTypeStock } from '@/lib/masquerade-allocation';

const stock = (): RoomTypeStock[] => [
    { roomTypeId: 'deluxe', name: 'Deluxe', pricePaise: 900_000, available: 3 },
    { roomTypeId: 'suite', name: 'Suite', pricePaise: 2_500_000, available: 2 },
    { roomTypeId: 'premium', name: 'Premium', pricePaise: 1_400_000, available: 1 },
];

test('the first booking gets the most expensive room', () => {
    const r = allocateRooms(stock(), 1);
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['suite']);
});

test('two packages take the next two most expensive rooms, one by one', () => {
    const r = allocateRooms(stock(), 3);
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['suite', 'suite', 'premium']);
});

test('the next guest gets what is left after the first has been taken', () => {
    const s = stock();
    s.find((t) => t.roomTypeId === 'suite')!.available -= 2; // the first guest took both suites
    const r = allocateRooms(s, 1);
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['premium']);
});

test('rooms run down to the cheapest type', () => {
    const r = allocateRooms(stock(), 6);
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['suite', 'suite', 'premium', 'deluxe', 'deluxe', 'deluxe']);
});

test('all or nothing: asking for more rooms than are left gives none', () => {
    const r = allocateRooms(stock(), 7);
    assert.equal(r.ok, false);
    if (!r.ok) {
        assert.equal(r.available, 6);
        assert.equal(r.requested, 7);
    }
});

test('sold out and zero or negative requests are refused', () => {
    const empty = stock().map((t) => ({ ...t, available: 0 }));
    assert.equal(allocateRooms(empty, 1).ok, false);
    assert.equal(allocateRooms(stock(), 0).ok, false);
    assert.equal(allocateRooms(stock(), -2).ok, false);
});

test('equal prices keep a fixed order by name', () => {
    const tied = [
        { roomTypeId: 'b', name: 'Beta', pricePaise: 100, available: 1 },
        { roomTypeId: 'a', name: 'Alpha', pricePaise: 100, available: 1 },
    ];
    assert.deepEqual(orderForSale(tied).map((t) => t.roomTypeId), ['a', 'b']);
});

test('negative or fractional stock counts are treated safely', () => {
    const odd = [{ roomTypeId: 'x', name: 'X', pricePaise: 1, available: -3 }, { roomTypeId: 'y', name: 'Y', pricePaise: 2, available: 1.9 }];
    assert.equal(totalAvailable(odd), 1);
});

// The hotel's real room types, with their website prices, as the booking sees them.
const hotel = (free: Record<string, number> = {}): RoomTypeStock[] =>
    [
        ['lake-view-balcony-suite', 'Lake View Balcony Suite', 1_849_900, 1],
        ['lake-view-balcony', 'Lake View Balcony Rooms', 1_599_900, 6],
        ['boat-race-suite', 'Boat Race Finish Line View Suite', 1_099_900, 13],
        ['canal-view-superior-family', 'Canal View Superior Family Room', 949_900, 4],
        ['lake-view-twin', 'Lake View Twin Room', 949_900, 19],
        ['canal-view-king', 'Canal View King Room', 749_900, 28],
    ].map(([slug, name, price, count]) => ({
        roomTypeId: slug as string,
        name: name as string,
        pricePaise: price as number,
        sellRank: sellRankForSlug(slug as string),
        available: free[slug as string] ?? (count as number),
    }));

test("the hotel's order beats price: Boat Race suite first, then the Balcony Suite, even though it costs less", () => {
    assert.deepEqual(
        orderForSale(hotel()).map((t) => t.roomTypeId),
        [...MASQUERADE_SELL_ORDER],
    );
});

test('every room type in the selling order is a distinct, known slug', () => {
    assert.equal(new Set(MASQUERADE_SELL_ORDER).size, MASQUERADE_SELL_ORDER.length);
    MASQUERADE_SELL_ORDER.forEach((slug, i) => assert.equal(sellRankForSlug(slug), i));
    assert.equal(sellRankForSlug('something-else'), undefined);
    assert.equal(sellRankForSlug(null), undefined);
});

test('guests are given rooms down the hotel list: the first guest gets the Boat Race suite', () => {
    const first = allocateRooms(hotel(), 1);
    assert.ok(first.ok);
    assert.deepEqual(first.rooms.map((r) => r.roomTypeId), ['boat-race-suite']);

    // two packages: the top two room types' rooms, one each from the stock
    const two = allocateRooms(hotel({ 'boat-race-suite': 1 }), 2);
    assert.ok(two.ok);
    assert.deepEqual(two.rooms.map((r) => r.roomTypeId), ['boat-race-suite', 'lake-view-balcony-suite']);
});

test('when the first types sell out the next guest moves down the list', () => {
    const s = hotel({ 'boat-race-suite': 0, 'lake-view-balcony-suite': 0 });
    const r = allocateRooms(s, 1);
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['canal-view-superior-family']);
});

test('a room type the hotel has not placed is sold after all the listed ones', () => {
    const s = [...hotel(), { roomTypeId: 'new-villa', name: 'New Villa', pricePaise: 9_000_000, available: 2 }];
    const order = orderForSale(s).map((t) => t.roomTypeId);
    assert.equal(order[order.length - 1], 'new-villa');
});

test('a test booking takes the room at the end of the order, never a top room', () => {
    const r = allocateRooms(hotel(), 1, { lastFirst: true });
    assert.ok(r.ok);
    assert.deepEqual(r.rooms.map((x) => x.roomTypeId), ['canal-view-king']);
});
