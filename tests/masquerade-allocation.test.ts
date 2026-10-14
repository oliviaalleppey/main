import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocateRooms, orderByPriceDescending, totalAvailable, type RoomTypeStock } from '@/lib/masquerade-allocation';

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
    assert.deepEqual(orderByPriceDescending(tied).map((t) => t.roomTypeId), ['a', 'b']);
});

test('negative or fractional stock counts are treated safely', () => {
    const odd = [{ roomTypeId: 'x', name: 'X', pricePaise: 1, available: -3 }, { roomTypeId: 'y', name: 'Y', pricePaise: 2, available: 1.9 }];
    assert.equal(totalAvailable(odd), 1);
});
