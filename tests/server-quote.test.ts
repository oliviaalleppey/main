/**
 * The room price comes from the server's own pricing, never from the browser.
 * Regression guard for the bug that let OL-0309-EZ0A book a ₹15,999 room for ₹10.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteFromSearch, snapshotForRooms } from '@/lib/services/server-quote';
import { calculateRoomTaxForNightlyRates } from '@/lib/services/tax';

// Shaped like getAvailableRoomsForSearch's result, with only the fields used.
function searchResult(overrides: Record<string, unknown> = {}) {
    return {
        roomType: { id: 'rt-king' },
        bookable: true,
        availableRooms: 3,
        nightlyRates: [899500, 899500],
        ratePlans: [
            { id: 'rp-promo', isDefault: false, nightlyRates: [809550, 809550] },
            { id: 'rp-standard', isDefault: true, nightlyRates: [899500, 899500] },
        ],
        ...overrides,
    } as never;
}

test('prices the requested rate plan from the search result', () => {
    const result = quoteFromSearch({ rooms: [searchResult()] }, 'rt-king', 'rp-promo');
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.quote.nightlyRates, [809550, 809550]);
    assert.equal(result.quote.totalPricePerRoom, 1619100);
    assert.equal(result.quote.pricePerNight, 809550);
    assert.equal(result.quote.ratePlanId, 'rp-promo');
    assert.equal(result.quote.availableRooms, 3);
});

test('an unknown or forged rate plan id falls back to the default plan, not a cheaper one', () => {
    const result = quoteFromSearch({ rooms: [searchResult()] }, 'rt-king', 'rp-does-not-exist');
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.quote.ratePlanId, 'rp-standard');
    assert.equal(result.quote.pricePerNight, 899500);
});

test('uses room-level rates when the room has no rate plans', () => {
    const result = quoteFromSearch({ rooms: [searchResult({ ratePlans: [] })] }, 'rt-king', null);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.quote.nightlyRates, [899500, 899500]);
    assert.equal(result.quote.ratePlanId, null);
});

test('refuses a room that is not bookable, or not in the results at all', () => {
    const unbookable = quoteFromSearch(
        { rooms: [searchResult({ bookable: false, availabilityMessage: 'Sold out' })] }, 'rt-king', null);
    assert.deepEqual(unbookable, { ok: false, message: 'Sold out' });

    const missing = quoteFromSearch({ rooms: [], error: 'Too many guests per room' }, 'rt-king', null);
    assert.deepEqual(missing, { ok: false, message: 'Too many guests per room' });
});

test('snapshot scales the stay total by rooms but keeps nightly rates per room', () => {
    const result = quoteFromSearch({ rooms: [searchResult()] }, 'rt-king', 'rp-standard');
    assert.equal(result.ok, true);
    if (!result.ok) return;

    const snapshot = snapshotForRooms(result.quote, 3, 2);
    assert.equal(snapshot.totalPrice, 899500 * 2 * 3);
    assert.deepEqual(snapshot.nightlyRates, [899500, 899500]);
    assert.equal(snapshot.taxesAndFees, calculateRoomTaxForNightlyRates([899500, 899500], 3));
    assert.equal(snapshot.externalRatePlanId, 'rp-standard');
});
