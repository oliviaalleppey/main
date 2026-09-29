/**
 * Stay dates stay on the calendar day the guest picked. The suite runs with
 * TZ=Asia/Kolkata (see package.json), the zone in which the old Date-based
 * handling moved every edited stay one day earlier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarDay, parseStayDates } from '@/lib/services/stay-dates';

const day = (date: Date) => date.toISOString().slice(0, 10);

test('runs in IST, where the original bug reproduced', () => {
    assert.equal(new Date(2026, 10, 15).getTimezoneOffset(), -330);
});

test('a picked day stays that day', () => {
    const parsed = parseStayDates({ checkIn: '2026-11-23', checkOut: '2026-11-25', adults: 2, children: 0 });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(day(parsed.stay.checkIn), '2026-11-23');
    assert.equal(day(parsed.stay.checkOut), '2026-11-25');
});

test('what the old code did: local midnight read back in UTC slips a day', () => {
    // Documents the failure this module replaces, so the reason is not lost.
    const pickedLocally = new Date(2026, 10, 23);
    assert.equal(pickedLocally.toISOString().slice(0, 10), '2026-11-22');
});

test('rejects impossible dates instead of rolling them over', () => {
    assert.equal(parseCalendarDay('2026-02-30'), null);
    assert.equal(parseCalendarDay('2026-13-01'), null);
    assert.equal(parseCalendarDay('23/11/2026'), null);
    assert.equal(parseCalendarDay(new Date(2026, 10, 23)), null);
});

test('check-out must be after check-in', () => {
    assert.deepEqual(
        parseStayDates({ checkIn: '2026-11-25', checkOut: '2026-11-25', adults: 2, children: 0 }),
        { ok: false, message: 'Check-out must be after check-in.' },
    );
});

test('guest counts are clamped to sane values', () => {
    const parsed = parseStayDates({ checkIn: '2026-11-23', checkOut: '2026-11-24', adults: 0, children: -3 });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.stay.adults, 1);
    assert.equal(parsed.stay.children, 0);
});
