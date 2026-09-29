/**
 * The public membership form's limits, and My Bookings' email match.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { membershipSchema } from '@/lib/validations/membership';
import { sameEmail } from '@/lib/services/guest-bookings';

const valid = { fullName: 'Asha Nair', mobileNumber: '+91 98765 43210', emailAddress: 'asha@example.com' };

test('a normal application passes', () => {
    assert.equal(membershipSchema.safeParse(valid).success, true);
});

test('oversized fields are refused', () => {
    assert.equal(membershipSchema.safeParse({ ...valid, fullName: 'x'.repeat(121) }).success, false);
    assert.equal(membershipSchema.safeParse({ ...valid, residentialAddress: 'x'.repeat(501) }).success, false);
    assert.equal(membershipSchema.safeParse({ ...valid, mobileNumber: '9'.repeat(31) }).success, false);
});

test('the photo field only takes a web link', () => {
    assert.equal(membershipSchema.safeParse({ ...valid, memberPhotographUrl: 'https://cdn.example/p.jpg' }).success, true);
    assert.equal(membershipSchema.safeParse({ ...valid, memberPhotographUrl: '' }).success, true);
    assert.equal(membershipSchema.safeParse({ ...valid, memberPhotographUrl: 'javascript:alert(1)' }).success, false);
    assert.equal(membershipSchema.safeParse({ ...valid, memberPhotographUrl: 'data:text/html,hi' }).success, false);
});

test('My Bookings matches the booking email regardless of case and spaces', () => {
    assert.equal(sameEmail('Asha@Gmail.com', 'asha@gmail.com'), true);
    assert.equal(sameEmail(' asha@gmail.com ', 'ASHA@GMAIL.COM'), true);
    assert.equal(sameEmail('asha@gmail.com', 'other@gmail.com'), false);
    assert.equal(sameEmail(null, 'asha@gmail.com'), false);
    assert.equal(sameEmail('', ''), false);
});

test('newsletter addresses are normalised so one person is one subscriber', async () => {
    const { normaliseSubscriberEmail } = await import('@/lib/validations/newsletter');
    assert.equal(normaliseSubscriberEmail('  Asha@Gmail.COM '), 'asha@gmail.com');
    assert.equal(normaliseSubscriberEmail('not-an-email'), null);
    assert.equal(normaliseSubscriberEmail(42), null);
    assert.equal(normaliseSubscriberEmail(`${'a'.repeat(250)}@x.co`), null);
});
