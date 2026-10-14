/**
 * The 31st Night price and room rules. These numbers are charged to real cards, so the arithmetic and the
 * people rule are pinned here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    PACKAGE_PRICE_PAISE,
    emptyRoom,
    formatINR,
    quoteMasquerade,
    roomHeadcount,
    roomProblem,
    validateGuest,
} from '@/lib/masquerade-offer';
import { calculateAddOnTax, calculateRoomTax } from '@/lib/services/tax';

const room = (over: Partial<ReturnType<typeof emptyRoom>> = {}) => ({ ...emptyRoom(), ...over });

test('one package is ₹49,999 plus 18% GST', () => {
    const q = quoteMasquerade([room()]);
    assert.equal(q.subtotalPaise, 4_999_900);
    assert.equal(q.gstPaise, 899_982);
    assert.equal(q.totalPaise, 5_899_882);
    assert.equal(formatINR(q.totalPaise), '₹58,998.82');
    assert.equal(q.problem, null);
});

test('each package is its own room', () => {
    const q = quoteMasquerade([room(), room(), room()]);
    assert.equal(q.rooms, 3);
    assert.equal(q.roomSubtotalPaise, PACKAGE_PRICE_PAISE * 3);
    assert.equal(q.totalPaise, 5_899_882 * 3);
});

test('add-ons carry 18% GST too, and prices follow the latest list', () => {
    const q = quoteMasquerade([room({ 'extra-adult': 1 })], { chauffeur: 2, 'gala-for-two': 1 });
    // extra adult 19,999 + chauffeur 2 x 1,499 + gala for two 19,999
    assert.equal(q.addOnSubtotalPaise, (19_999 + 2 * 1_499 + 19_999) * 100);
    assert.equal(q.addOnTaxPaise, Math.round(19_999 * 100 * 0.18) * 2 + Math.round(2 * 1_499 * 100 * 0.18));
});

test('nanny is ₹5,999 and junior guest ₹7,999', () => {
    const q = quoteMasquerade([room({ nanny: 1, 'junior-guest': 1 })]);
    const nanny = q.addOnTotals.find((t) => t.id === 'nanny')!;
    const junior = q.addOnTotals.find((t) => t.id === 'junior-guest')!;
    assert.equal(nanny.unitPaise, 599_900);
    assert.equal(junior.unitPaise, 799_900);
});

test('the total matches what the booking engine will store, to the paisa', () => {
    const q = quoteMasquerade(
        [room({ 'junior-guest': 1, nanny: 1 }), room({ 'extra-adult': 1 })],
        { 'young-gala': 3, 'gala-single': 1 },
    );
    const roomTax = calculateRoomTax({ nightlyRates: [PACKAGE_PRICE_PAISE], pricePerNight: PACKAGE_PRICE_PAISE, nights: 1, quantity: q.rooms });
    const addOnTax = calculateAddOnTax(q.addOnTotals.map((t) => ({ subtotal: t.subtotalPaise, taxRate: 18 })));
    assert.equal(q.roomTaxPaise, roomTax);
    assert.equal(q.addOnTaxPaise, addOnTax);
    assert.equal(q.gstPaise, roomTax + addOnTax);
    assert.equal(q.totalPaise, q.subtotalPaise + roomTax + addOnTax);
});

test('room rule: a couple, a couple with up to two more people, or three adults and no one else', () => {
    assert.equal(roomProblem(room()), null);
    assert.equal(roomProblem(room({ 'junior-guest': 1 })), null);
    assert.equal(roomProblem(room({ 'junior-guest': 2 })), null);
    assert.equal(roomProblem(room({ 'little-ones': 2 })), null);
    assert.equal(roomProblem(room({ 'junior-guest': 1, 'little-ones': 1 })), null);
    assert.equal(roomProblem(room({ 'junior-guest': 1, nanny: 1 })), null);
    assert.equal(roomProblem(room({ 'extra-adult': 1 })), null);
});

test('room rule: three adults with a child or a nanny is refused', () => {
    assert.ok(roomProblem(room({ 'extra-adult': 1, 'junior-guest': 1 })));
    assert.ok(roomProblem(room({ 'extra-adult': 1, 'little-ones': 1 })));
    assert.ok(roomProblem(room({ 'extra-adult': 1, nanny: 1 })));
});

test('room rule: nanny counts as a person, so two children and a nanny is one too many', () => {
    assert.ok(roomProblem(room({ 'junior-guest': 2, nanny: 1 })));
    assert.ok(roomProblem(room({ 'junior-guest': 1, 'little-ones': 1, nanny: 1 })));
});

test('a problem in any room blocks the booking and names the room', () => {
    const q = quoteMasquerade([room(), room({ 'extra-adult': 1, nanny: 1 })]);
    assert.match(q.problem ?? '', /^Room 2:/);
});

test('quantities are clamped, so a tampered request cannot push past the limits', () => {
    const q = quoteMasquerade([room({ 'junior-guest': 99, 'extra-adult': -4 })], { chauffeur: 1000, 'not-real': 5 });
    const junior = q.addOnTotals.find((t) => t.id === 'junior-guest')!;
    const chauffeur = q.addOnTotals.find((t) => t.id === 'chauffeur')!;
    assert.equal(junior.qty, 2);
    assert.equal(chauffeur.qty, 9);
    assert.equal(q.addOnTotals.some((t) => t.id === ('not-real' as never)), false);
    assert.equal(q.addOnTotals.some((t) => t.id === 'extra-adult'), false);
});

test('headcount puts a nanny with the children, adults start at two', () => {
    assert.deepEqual(roomHeadcount(room()), { adults: 2, children: 0 });
    assert.deepEqual(roomHeadcount(room({ 'extra-adult': 1 })), { adults: 3, children: 0 });
    assert.deepEqual(roomHeadcount(room({ 'junior-guest': 1, nanny: 1 })), { adults: 2, children: 2 });
});

test('guest details are validated', () => {
    assert.deepEqual(validateGuest({ name: 'Asha Menon', email: 'asha@example.com', phone: '+91 98765 43210' }), {});
    const bad = validateGuest({ name: 'A', email: 'nope', phone: '12' });
    assert.ok(bad.name && bad.email && bad.phone);
});
