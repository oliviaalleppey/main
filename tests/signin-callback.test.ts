/**
 * Where /signin sends people afterwards. Guests must get back to My Bookings;
 * nobody may be redirected off the site.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGuestDestination, safeCallbackPath } from '@/lib/auth/callback';

test('guests return to the My Bookings page they asked for', () => {
    assert.equal(safeCallbackPath('/my-bookings'), '/my-bookings');
    assert.equal(safeCallbackPath('/my-bookings/abc/invoice'), '/my-bookings/abc/invoice');
    // NextAuth hands over an absolute URL on our own domain.
    assert.equal(safeCallbackPath('https://oliviaalleppey.com/my-bookings'), '/my-bookings');
    assert.equal(safeCallbackPath('https://www.oliviaalleppey.com/admin/bookings?status=x'), '/admin/bookings?status=x');
    assert.equal(isGuestDestination('/my-bookings/abc'), true);
    assert.equal(isGuestDestination('/admin'), false);
});

test('never redirects off the site', () => {
    for (const hostile of [
        'https://evil.example/my-bookings',
        '//evil.example/x',
        '/\\evil.example',
        'javascript:alert(1)',
        'https://oliviaalleppey.com.evil.example/',
    ]) {
        assert.equal(safeCallbackPath(hostile), '/admin', hostile);
    }
});

test('missing, junk or self-referencing callbacks fall back to the default', () => {
    assert.equal(safeCallbackPath(undefined), '/admin');
    assert.equal(safeCallbackPath(''), '/admin');
    assert.equal(safeCallbackPath(['/my-bookings', '/admin']), '/my-bookings');
    assert.equal(safeCallbackPath('/signin?callbackUrl=/signin'), '/admin');
    assert.equal(safeCallbackPath('/api/auth/signin'), '/admin');
});
