/**
 * The dashboard's Scheduled Jobs verdicts, and the schedules read from vercel.json.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRON_JOBS, judgeCronJob, scheduleIntervalMinutes } from '@/lib/services/cron-runs';

const NOW = new Date('2026-09-29T12:00:00Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);
const job = (intervalMinutes: number | null) => ({ job: 'x', path: '/api/cron/x', schedule: '', intervalMinutes });

test('reads every job and its interval from vercel.json', () => {
    const byName = Object.fromEntries(CRON_JOBS.map((entry) => [entry.job, entry.intervalMinutes]));
    assert.deepEqual(byName, {
        'booking-watchdog': 5,
        'payment-reconciliation': 10,
        'whatsapp-dispatch': 5,
        'whatsapp-automations': 60,
        'whatsapp-retention': 1440,
        'whatsapp-sync': 60,
    });
});

test('parses the schedule shapes in use and refuses to guess the rest', () => {
    assert.equal(scheduleIntervalMinutes('*/5 * * * *'), 5);
    assert.equal(scheduleIntervalMinutes('15 * * * *'), 60);
    assert.equal(scheduleIntervalMinutes('30 3 * * *'), 1440);
    assert.equal(scheduleIntervalMinutes('0 9 * * 1'), null);
    assert.equal(scheduleIntervalMinutes('*/15 8-18 * * *'), null);
});

test('overdue only after two missed runs plus five minutes', () => {
    assert.equal(judgeCronJob(job(10), { lastScheduledAt: minutesAgo(25), lastStatus: 'ok' }, NOW).state, 'ok');
    assert.equal(judgeCronJob(job(10), { lastScheduledAt: minutesAgo(26), lastStatus: 'ok' }, NOW).state, 'late');
    assert.equal(judgeCronJob(job(1440), { lastScheduledAt: minutesAgo(3000), lastStatus: 'ok' }, NOW).state, 'late');
});

test('never, failing, and no lateness check for an unparsed schedule', () => {
    assert.equal(judgeCronJob(job(5), undefined, NOW).state, 'never');
    assert.equal(judgeCronJob(job(5), { lastScheduledAt: null, lastStatus: 'ok' }, NOW).state, 'never');
    assert.equal(judgeCronJob(job(5), { lastScheduledAt: minutesAgo(3), lastStatus: 'error' }, NOW).state, 'failing');
    assert.equal(judgeCronJob(job(null), { lastScheduledAt: minutesAgo(99999), lastStatus: 'ok' }, NOW).state, 'ok');
});
