/**
 * Cancel / refund / delete rules for administrators, and the guard that keeps a
 * cancelled booking from being pushed to Hotsoft by a later retry.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canCancel, canDelete, canMarkRefunded, moneyWasTaken } from '@/lib/services/booking-admin-rules';
import { isFinalizeStopped } from '@/lib/services/booking-service';
import { bookingStateMachine } from '@/lib/services/booking-state-machine';

const paid = (status: string, paymentStatus = 'success') => ({ status, paymentStatus, hasSuccessfulPayment: true });
const unpaid = (status: string, paymentStatus = 'pending') => ({ status, paymentStatus, hasSuccessfulPayment: false });

test('a paid booking can never be deleted — that erased its invoice records', () => {
    for (const status of ['confirmed', 'booking_requested', 'failed', 'cancelled', 'refunded']) {
        assert.equal(canDelete(paid(status)), false, status);
    }
    assert.equal(canDelete(paid('cancelled', 'refunded')), false);
    // A successful payments row counts even if the booking row never caught up.
    assert.equal(canDelete({ status: 'failed', paymentStatus: 'pending', hasSuccessfulPayment: true }), false);
});

test('unpaid bookings can still be deleted', () => {
    assert.equal(canDelete(unpaid('pending_payment')), true);
    assert.equal(canDelete(unpaid('failed', 'failed')), true);
    assert.equal(canDelete(unpaid('initiated')), true);
});

test('only paid bookings that are confirmed or awaiting Hotsoft can be cancelled', () => {
    assert.equal(canCancel(paid('confirmed')), true);
    assert.equal(canCancel(paid('payment_success')), true);
    assert.equal(canCancel(paid('booking_requested')), true);
    assert.equal(canCancel(unpaid('pending_payment')), false, 'unpaid checkout: payment may still land');
    assert.equal(canCancel(paid('cancelled')), false);
    assert.equal(canCancel(paid('failed')), false);
});

test('mark refunded: paid and cancelled or failed, and only once', () => {
    assert.equal(canMarkRefunded(paid('cancelled')), true);
    assert.equal(canMarkRefunded(paid('failed')), true);
    assert.equal(canMarkRefunded(paid('confirmed')), false, 'cancel first');
    assert.equal(canMarkRefunded(paid('cancelled', 'refunded')), false);
    assert.equal(canMarkRefunded(unpaid('failed', 'failed')), false, 'nothing to refund');
    assert.equal(moneyWasTaken(unpaid('refunded', 'refunded')), true);
});

test('the state machine allows every cancel the rules allow', () => {
    for (const from of ['confirmed', 'payment_success', 'booking_requested'] as const) {
        assert.equal(bookingStateMachine.canTransition(from, 'cancelled'), true, from);
    }
    assert.equal(bookingStateMachine.canTransition('cancelled', 'refunded'), true);
    assert.equal(bookingStateMachine.canTransition('failed', 'refunded'), true);
});

test('a cancelled booking is never finalized to Hotsoft again', () => {
    for (const status of ['cancelled', 'failed', 'refunded', 'expired']) {
        assert.equal(isFinalizeStopped(status), true, status);
    }
    for (const status of ['pending_payment', 'payment_success', 'booking_requested']) {
        assert.equal(isFinalizeStopped(status), false, status);
    }
});
