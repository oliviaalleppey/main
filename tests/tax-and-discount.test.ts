/**
 * GST per room per night, and promo discounts. These figures become the amount
 * Easebuzz charges, so a one-paisa drift rejects the booking outright.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateAddOnTax,
    calculateRoomTax,
    calculateRoomTaxForNightlyRates,
    getRoomTaxRateForNightlyRate,
} from '@/lib/services/tax';
import { applyDiscount, betterOf, normalizeCode } from '@/lib/services/offers';

test('₹7,500 a night is 5%; a paisa more is 18%', () => {
    assert.equal(getRoomTaxRateForNightlyRate(750000), 5);
    assert.equal(getRoomTaxRateForNightlyRate(750001), 18);
});

test('a stay straddling the threshold is taxed night by night, not averaged', () => {
    // ₹7,000 then ₹8,000: 5% of 7,000 + 18% of 8,000. Averaging (₹7,500) would give 5% on both.
    assert.equal(calculateRoomTaxForNightlyRates([700000, 800000]), 35000 + 144000);
});

test('room tax multiplies by rooms, and a multi-night stay is taxed for every night', () => {
    assert.equal(calculateRoomTaxForNightlyRates([899500, 899500], 2), 161910 * 2 * 2);
    assert.equal(calculateRoomTax({ pricePerNight: 899500, nights: 3 }), 161910 * 3);
});

test('add-ons are taxed per line at their own rate, 18% by default', () => {
    assert.equal(calculateAddOnTax([{ subtotal: 65000, taxRate: 18 }, { subtotal: 100000, taxRate: null }]), 11700 + 18000);
});

test('a discount comes off the room only, and room tax follows it pro rata', () => {
    const quote = applyDiscount({ roomSubtotal: 1000000, roomTax: 180000, addOnSubtotal: 65000, addOnTax: 11700 }, 100000);
    assert.equal(quote.discount, 100000);
    assert.equal(quote.discountedRoomSubtotal, 900000);
    assert.equal(quote.discountedRoomTax, 162000);
    assert.equal(quote.subtotal, 900000 + 65000);
    assert.equal(quote.taxAmount, 162000 + 11700);
    assert.equal(quote.total, quote.subtotal + quote.taxAmount);
});

test('a discount can never exceed the room subtotal or go negative', () => {
    const base = { roomSubtotal: 300000, roomTax: 15000, addOnSubtotal: 0, addOnTax: 0 };
    assert.equal(applyDiscount(base, 500000).total, 0);
    assert.equal(applyDiscount(base, -100).discount, 0);
});

test('codes do not stack: the bigger discount wins, ties keep the current code', () => {
    assert.deepEqual(betterOf({ code: 'A', discount: 500 }, { code: 'B', discount: 900 }), { winner: { code: 'B', discount: 900 }, replaced: true });
    assert.deepEqual(betterOf({ code: 'A', discount: 900 }, { code: 'B', discount: 900 }), { winner: { code: 'A', discount: 900 }, replaced: false });
    assert.equal(normalizeCode('  monsoon25 '), 'MONSOON25');
});
