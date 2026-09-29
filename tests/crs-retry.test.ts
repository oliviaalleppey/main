/**
 * Which CRS failures leave a paid booking for the watchdog to retry, and which
 * fail it immediately. Wrongly "not retryable" fails a paid booking over a
 * brief Hotsoft outage.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableProviderError, isRetryableProviderMessage } from '@/lib/providers/crs/retryable';

test('Hotsoft server errors and transport failures are retried', () => {
    for (const message of [
        'HTTP Error 503: {"html":"Service Unavailable"}',
        'HTTP Error 500: {}',
        'This operation was aborted',
        'fetch failed',
        'connect ECONNREFUSED 10.0.0.1:443',
        'Request timed out',
    ]) {
        assert.equal(isRetryableProviderMessage(message), true, message);
    }
});

test('rejections are not retried', () => {
    for (const message of [
        'HTTP Error 400: {"BookingResponse":{"Status":"Failed","Remarks":"Invalid RoomType"}}',
        'Invalid RatePlanId',
        'Hotsoft API returned a failure status.',
    ]) {
        assert.equal(isRetryableProviderMessage(message), false, message);
    }
});

test('digits that merely start with 5 are not a server error', () => {
    assert.equal(isRetryableProviderMessage('Amount mismatch: Rs 1500 expected'), false);
    assert.equal(isRetryableProviderMessage('Duplicate booking OL-1509-AB12'), false);
});

test('an AbortError is retried whatever its message says', () => {
    const error = new Error('stopped');
    error.name = 'AbortError';
    assert.equal(isRetryableProviderError(error), true);
    assert.equal(isRetryableProviderError(new Error('Invalid RoomType')), false);
});
