import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCheckIn, formatCheckOut, formatStayDate } from '@/lib/stay-times';

test('check-in is 2:00 PM and check-out 12:00 PM, never a timestamp like 5:30:00 am', () => {
    assert.equal(formatCheckIn('2026-12-31'), '31/12/2026, 2:00 PM');
    assert.equal(formatCheckOut('2027-01-01'), '01/01/2027, 12:00 PM');
});

test('the date does not move with the server clock', () => {
    const original = process.env.TZ;
    for (const tz of ['Asia/Kolkata', 'UTC', 'America/Los_Angeles', 'Pacific/Auckland']) {
        process.env.TZ = tz;
        assert.equal(formatStayDate('2026-12-31'), '31/12/2026', tz);
    }
    process.env.TZ = original;
});
