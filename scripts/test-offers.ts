/**
 * Promo code arithmetic. Pure logic, no database.
 *
 *   npx esbuild scripts/test-offers.ts --bundle --platform=node \
 *     --format=cjs --alias:@=. --outfile=/tmp/tof.cjs && node /tmp/tof.cjs
 *
 * This is money. A bug here does not throw, it charges the wrong amount — and
 * the two most likely ways to get it wrong both produce plausible-looking totals:
 *
 *  - discounting the room but leaving tax computed on the full rate, so the guest
 *    pays GST on money they did not spend;
 *  - letting a fixed-value code exceed the room subtotal, which makes the room
 *    line negative and the booking cheaper than its add-ons.
 *
 * Amounts here are deliberately not round rupees, so a missing or doubled
 * rounding step cannot coincidentally look right.
 */

import {
    computeDiscount, applyDiscount, normalizeCode, hotelToday, betterOf,
    describeRejection, type Offer, type QuoteBase,
} from '@/lib/services/offers';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail?: string) {
    if (condition) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`); }
}

function offer(over: Partial<Offer>): Offer {
    return {
        id: 'o1',
        title: 'Test offer',
        description: null,
        code: 'TEST',
        discountType: 'percentage',
        discountValue: 10,
        minBookingAmount: 0,
        maxDiscount: null,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        usageLimit: null,
        usageCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...over,
    } as Offer;
}

// --------------------------------------------
console.log('\n--- percentage discounts ---');
// --------------------------------------------

// ₹8,412.34 room subtotal — not a round rupee figure on purpose.
const ROOM = 841234;

check('10% of an awkward subtotal rounds once',
    computeDiscount(offer({ discountType: 'percentage', discountValue: 10 }), ROOM) === 84123,
    `got ${computeDiscount(offer({ discountValue: 10 }), ROOM)}, expected 84123`);

check('20% is twice 10%',
    computeDiscount(offer({ discountValue: 20 }), ROOM) === 168247);

check('100% discounts the whole room',
    computeDiscount(offer({ discountValue: 100 }), ROOM) === ROOM);

check('a percentage over 100 still cannot exceed the room',
    computeDiscount(offer({ discountValue: 150 }), ROOM) === ROOM,
    'a typo in the admin form must not produce a negative room line');

check('0% discounts nothing',
    computeDiscount(offer({ discountValue: 0 }), ROOM) === 0);

check('maxDiscount caps a percentage code',
    computeDiscount(offer({ discountValue: 50, maxDiscount: 200000 }), ROOM) === 200000,
    '"50% off, up to ₹2,000" must stop at ₹2,000');

check('maxDiscount does not raise a smaller discount',
    computeDiscount(offer({ discountValue: 5, maxDiscount: 900000 }), ROOM) === 42062,
    'a cap is a ceiling, not a target');

// --------------------------------------------
console.log('\n--- fixed discounts ---');
// --------------------------------------------

check('a fixed code takes its face value',
    computeDiscount(offer({ discountType: 'fixed', discountValue: 150000 }), ROOM) === 150000);

check('a fixed code larger than the room is capped at the room',
    computeDiscount(offer({ discountType: 'fixed', discountValue: 5000000 }), ROOM) === ROOM,
    'otherwise the room line goes negative and the booking costs less than its add-ons');

check('a fixed code against a zero-value room discounts nothing',
    computeDiscount(offer({ discountType: 'fixed', discountValue: 150000 }), 0) === 0);

check('a negative discount value cannot become a surcharge',
    computeDiscount(offer({ discountType: 'fixed', discountValue: -50000 }), ROOM) === 0);

// --------------------------------------------
console.log('\n--- the discount lands on the room, and tax follows it ---');
// --------------------------------------------

// A realistic booking: ₹8,412.34 room + 12% room tax, ₹1,500 add-ons + 18%.
const base: QuoteBase = {
    roomSubtotal: 841234,
    roomTax: 100948,     // 12% of the room
    addOnSubtotal: 150000,
    addOnTax: 27000,     // 18% of the add-ons
};

const undiscounted = applyDiscount(base, 0);
check('with no discount the total is unchanged',
    undiscounted.total === 841234 + 100948 + 150000 + 27000,
    `got ${undiscounted.total}`);
check('with no discount no tax is saved', undiscounted.taxSaved === 0);

const tenPercent = applyDiscount(base, 84123);

check('the room subtotal falls by the discount',
    tenPercent.discountedRoomSubtotal === 841234 - 84123);
check('add-ons are untouched', tenPercent.addOnSubtotal === 150000);
check('add-on tax is untouched', tenPercent.addOnTax === 27000);

// The headline assertion. Room tax must fall in proportion, not stay put.
check('room tax falls in proportion to the discounted room',
    tenPercent.discountedRoomTax === Math.round(100948 * (841234 - 84123) / 841234),
    `got ${tenPercent.discountedRoomTax}`);
check('room tax actually moved',
    tenPercent.discountedRoomTax < base.roomTax,
    'leaving tax on the full rate charges GST on money the guest did not spend');
check('tax saved is reported and agrees',
    tenPercent.taxSaved === base.roomTax - tenPercent.discountedRoomTax);

check('subtotal is pre-tax and post-discount',
    tenPercent.subtotal === (841234 - 84123) + 150000);
check('taxAmount is the two discounted tax lines',
    tenPercent.taxAmount === tenPercent.discountedRoomTax + 27000);
check('total is subtotal plus tax',
    tenPercent.total === tenPercent.subtotal + tenPercent.taxAmount);

check('the guest saves the discount plus the tax on it',
    undiscounted.total - tenPercent.total === 84123 + tenPercent.taxSaved,
    `saved ${undiscounted.total - tenPercent.total}`);

// --------------------------------------------
console.log('\n--- the arithmetic cannot produce nonsense ---');
// --------------------------------------------

const overDiscount = applyDiscount(base, 99999999);
check('a discount larger than the room is clamped',
    overDiscount.discount === base.roomSubtotal);
check('the room never goes negative', overDiscount.discountedRoomSubtotal === 0);
check('room tax goes to zero with the room', overDiscount.discountedRoomTax === 0);
check('the guest still pays for the add-ons',
    overDiscount.total === 150000 + 27000,
    'a 100% room code is not a free holiday');

const negative = applyDiscount(base, -5000);
check('a negative discount is ignored', negative.discount === 0);
check('a negative discount does not inflate the total', negative.total === undiscounted.total);

const emptyRoom = applyDiscount(
    { roomSubtotal: 0, roomTax: 0, addOnSubtotal: 150000, addOnTax: 27000 }, 50000);
check('a zero-value room does not divide by zero',
    Number.isFinite(emptyRoom.total) && emptyRoom.discountedRoomTax === 0);
check('a zero-value room still charges add-ons', emptyRoom.total === 177000);

// Every field must be a whole number of paise — a fractional paisa reaching the
// payment gateway is rejected, and reaching the database is silently truncated.
const fields = Object.entries(applyDiscount(base, 33333)) as [string, number][];
for (const [key, value] of fields) {
    if (typeof value !== 'number') continue;
    check(`${key} is a whole number of paise`, Number.isInteger(value), `${key} = ${value}`);
}

// --------------------------------------------
console.log('\n--- both call sites get identical numbers ---');
// --------------------------------------------

// calculateSessionPayableAmount groups as (room+roomTax) + addOns + addOnTax;
// finalizeSession groups as (room+addOns) + (roomTax+addOnTax). They must agree
// exactly, or a booking is rejected for a price mismatch the guest cannot fix.
for (const discount of [0, 1, 84123, 250000, 841233, 841234]) {
    const q = applyDiscount(base, discount);
    const asActions = (q.discountedRoomSubtotal + q.discountedRoomTax) + q.addOnSubtotal + q.addOnTax;
    const asService = q.subtotal + q.taxAmount;
    check(`the two groupings agree at a discount of ${discount}`,
        asActions === asService && asService === q.total,
        `${asActions} vs ${asService} vs ${q.total}`);
}

// --------------------------------------------
console.log('\n--- code normalisation ---');
// --------------------------------------------

check('codes are upper-cased', normalizeCode('onam30') === 'ONAM30');
check('surrounding whitespace is trimmed', normalizeCode('  ONAM30  ') === 'ONAM30');
check('mixed case is normalised', normalizeCode('OnAm30') === 'ONAM30');
check('an empty code normalises to empty', normalizeCode('') === '');
check('a null code normalises to empty', normalizeCode(null) === '');
check('an undefined code normalises to empty', normalizeCode(undefined) === '');

// --------------------------------------------
console.log('\n--- validity dates are read in the hotel\'s timezone ---');
// --------------------------------------------

// 18:45 UTC on 8 August is already 9 August in Kerala. Using the server's UTC
// date would expire an offer five and a half hours early for the hotel's guests.
check('an evening UTC timestamp is already tomorrow in IST',
    hotelToday(new Date('2026-08-08T18:45:00Z')) === '2026-08-09',
    `got ${hotelToday(new Date('2026-08-08T18:45:00Z'))}`);
check('a morning UTC timestamp is the same day in IST',
    hotelToday(new Date('2026-08-08T06:00:00Z')) === '2026-08-08');
check('just before the IST rollover is still today',
    hotelToday(new Date('2026-08-08T18:29:00Z')) === '2026-08-08');
check('the format is comparable with a DATE column',
    /^\d{4}-\d{2}-\d{2}$/.test(hotelToday(new Date())));

// --------------------------------------------
console.log('\n--- codes never stack; the better one wins ---');
// --------------------------------------------

const first = { code: 'ONAM10', discount: 84123 };
const bigger = { code: 'ONAM20', discount: 168247 };
const smaller = { code: 'FLAT500', discount: 50000 };

check('the first code applied is kept', betterOf(null, first).winner.code === 'ONAM10');
check('the first code is marked as applied', betterOf(null, first).replaced === true);

check('a better second code replaces the first',
    betterOf(first, bigger).winner.code === 'ONAM20');
check('the replacement is reported', betterOf(first, bigger).replaced === true);

check('a worse second code does not replace the first',
    betterOf(first, smaller).winner.code === 'ONAM10',
    'trying a second code must never leave the guest worse off');
check('the guest is told it was not applied', betterOf(first, smaller).replaced === false);

check('an equal code does not churn the applied one',
    betterOf(first, { code: 'OTHER', discount: 84123 }).replaced === false);

check('discounts are never summed',
    betterOf(first, bigger).winner.discount === 168247,
    'stacking is what sells a room below cost');

// --------------------------------------------
console.log('\n--- rejections do not leak which codes are real ---');
// --------------------------------------------

// A message that distinguishes "expired" from "no such code" confirms the code
// existed, which is exactly the feedback someone guessing codes wants.
const opaque = ['not_found', 'inactive', 'not_started', 'expired'] as const;
const messages = new Set(opaque.map((r) => describeRejection(r)));
check('all four invalid-code reasons give the same message', messages.size === 1,
    `got ${[...messages].join(' | ')}`);
check('the shared message says nothing about why',
    describeRejection('not_found') === 'That promo code is not valid.');
check('an exhausted code is distinguishable, which is fair to a real guest',
    describeRejection('usage_limit_reached') !== describeRejection('not_found'));
check('a minimum-spend rejection is actionable',
    describeRejection('below_minimum', 'This code applies to bookings of ₹10,000 or more.')
        .includes('₹10,000'));

// --------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
