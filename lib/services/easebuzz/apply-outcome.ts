import { db } from '@/lib/db';
import { payments, bookings, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { sendUnconfirmedPaymentAlertToStaff } from '@/lib/services/email';
import { and, eq, ne } from 'drizzle-orm';

const bookingService = new BookingService();

/**
 * The gateway fields worth keeping for reconciliation and support, without
 * storing the whole payload (it carries `cardnum`, `upi_va` and the guest's
 * contact details, which have no business sitting in the payments table).
 */
export function buildGatewayMetadata(postData: Record<string, string>) {
    return {
        easepayid: postData.easepayid || null,
        bankRefNum: postData.bank_ref_num || null,
        mode: postData.mode || null,               // CC, UPI, NB …
        bankName: postData.bank_name || null,
        netAmountDebit: postData.net_amount_debit || null,
        pgType: postData.PG_TYPE || postData.pg_type || null,
        unmappedStatus: postData.unmappedstatus || null,
        addedOn: postData.addedon || null,
        // The guest-facing reason. Kept because the failure page reads it back:
        // without it a failed payment can only say "something went wrong", which
        // is what made guests retry the whole booking instead of the card.
        error: postData.error_Message || postData.error_message || postData.error || null,
    };
}

/** What Easebuzz says happened, normalised to the three cases we can act on. */
export type GatewayOutcome = 'success' | 'failed' | 'unresolved';

/**
 * Easebuzz statuses seen in the wild: success, failure, userCancelled, pending,
 * bounced, dropped. Anything we do not recognise is deliberately `unresolved`
 * so it gets left alone and looked at, never guessed at.
 */
export function normaliseGatewayStatus(status: string | null | undefined): GatewayOutcome {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'success') return 'success';
    if (['failure', 'failed', 'usercancelled', 'bounced', 'dropped'].includes(s)) return 'failed';
    return 'unresolved';
}

export type ApplyOutcomeResult = {
    ok: boolean;
    /** Machine-readable outcome, used for the webhook's HTTP reply and the cron's tally. */
    code:
    | 'payment_not_found'
    | 'amount_invalid'
    | 'amount_mismatch'
    | 'confirmed'
    | 'confirmed_crs_pending'
    | 'late_success_ignored'
    | 'marked_failed'
    | 'late_failure_ignored'
    | 'unresolved';
    bookingId?: string;
    message: string;
};

/**
 * Applies a gateway verdict to a payment and its booking.
 *
 * Shared deliberately by the redirect/webhook handler and the reconciliation
 * cron. Two code paths that both write `payments.status` and confirm bookings
 * is how you end up double-confirming a booking or overwriting a real failure
 * with a stale success, so there is exactly one.
 *
 * Every write is race-safe against the other caller: a success will not
 * overwrite a payment already marked failed, and a failure will not overwrite
 * one already marked success.
 */
export async function applyGatewayOutcome(opts: {
    txnid: string;
    outcome: GatewayOutcome;
    fields: Record<string, string>;
    source: 'webhook' | 'reconciler';
}): Promise<ApplyOutcomeResult> {
    const { txnid, outcome, fields, source } = opts;

    const paymentRecord = await db.query.payments.findFirst({
        where: eq(payments.easebuzzOrderId, txnid),
    });

    if (!paymentRecord) {
        return { ok: false, code: 'payment_not_found', message: `No payment row for txnid ${txnid}` };
    }

    if (outcome === 'unresolved') {
        return {
            ok: true,
            code: 'unresolved',
            bookingId: paymentRecord.bookingId,
            message: `Gateway status not actionable; left pending`,
        };
    }

    if (outcome === 'success') {
        const parsedAmount = Number.parseFloat(fields.amount || '');
        if (!Number.isFinite(parsedAmount)) {
            await db.insert(bookingLogs).values({
                action: 'easebuzz_amount_invalid',
                requestPayload: { source, ...fields },
                level: 'error',
                errorMessage: `Invalid amount received: "${fields.amount}"`,
            });
            return { ok: false, code: 'amount_invalid', bookingId: paymentRecord.bookingId, message: 'Invalid amount' };
        }

        const receivedAmountPaise = Math.round(parsedAmount * 100);
        if (receivedAmountPaise !== paymentRecord.amount) {
            await db.insert(bookingLogs).values({
                action: 'easebuzz_amount_mismatch',
                requestPayload: { source, ...fields },
                level: 'error',
                errorMessage: `Expected ${paymentRecord.amount} paise, got ${receivedAmountPaise} paise`,
            });
            return { ok: false, code: 'amount_mismatch', bookingId: paymentRecord.bookingId, message: 'Amount mismatch' };
        }

        // Race-safe: do not overwrite an already failed payment with a late success.
        const successUpdates = await db.update(payments)
            .set({
                status: 'success',
                easebuzzTransactionId: fields.easepayid || null,
                gatewayTransactionId: fields.bank_ref_num || null,
                easebuzzHash: fields.hash || null,
                paymentVerifiedAt: new Date(),
                paymentMethod: fields.payment_source || 'easebuzz',
                metadata: buildGatewayMetadata(fields),
                updatedAt: new Date(),
            })
            .where(and(
                eq(payments.easebuzzOrderId, txnid),
                ne(payments.status, 'failed'),
            ))
            .returning({ bookingId: payments.bookingId });

        if (!successUpdates.length) {
            await db.insert(bookingLogs).values({
                action: 'easebuzz_late_success_ignored',
                requestPayload: { source, ...fields },
                level: 'warning',
                errorMessage: 'Received a success after payment was already marked failed. Ignoring auto-confirmation.',
            });

            // The guest's money was taken and they were shown a failure page. The
            // log row above is not enough — nobody reads it until the guest calls.
            const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, paymentRecord.bookingId) });
            if (booking) {
                await sendUnconfirmedPaymentAlertToStaff({
                    bookingId: booking.id,
                    bookingNumber: booking.bookingNumber,
                    guestName: booking.guestName,
                    guestEmail: booking.guestEmail,
                    guestPhone: booking.guestPhone,
                    checkIn: new Date(booking.checkIn).toLocaleDateString('en-IN', { timeZone: 'UTC' }),
                    checkOut: new Date(booking.checkOut).toLocaleDateString('en-IN', { timeZone: 'UTC' }),
                    totalAmount: receivedAmountPaise,
                    reason: 'late_success',
                    detail: `Easebuzz ${fields.easepayid || ''} status success, source ${source}`.trim(),
                }).catch((e) => console.error(`Failed to send late-success alert for ${booking.id}:`, e));
            }

            return {
                ok: true,
                code: 'late_success_ignored',
                bookingId: paymentRecord.bookingId,
                message: 'Late success ignored',
            };
        }

        const bookingId = successUpdates[0]?.bookingId || paymentRecord.bookingId;
        const finalizeResult = await bookingService.finalizeFromWebhook(bookingId);

        if (!finalizeResult?.success && finalizeResult?.status !== 'already_confirmed') {
            await db.insert(bookingLogs).values({
                bookingId,
                action: 'easebuzz_success_finalize_pending',
                level: 'warning',
                requestPayload: { source, finalizeResult, fields },
                errorMessage: 'Payment marked successful but CRS confirmation is pending or failed.',
            });
            return {
                ok: true,
                code: 'confirmed_crs_pending',
                bookingId,
                message: 'Payment successful, CRS confirmation pending',
            };
        }

        return { ok: true, code: 'confirmed', bookingId, message: 'Payment successful, booking confirmed' };
    }

    // outcome === 'failed'
    // Race-safe: only mark failed if this payment has not already succeeded.
    const updatedRows = await db.update(payments)
        .set({
            status: 'failed',
            easebuzzTransactionId: fields.easepayid || null,
            gatewayTransactionId: fields.bank_ref_num || null,
            easebuzzHash: fields.hash || null,
            metadata: buildGatewayMetadata(fields),
            updatedAt: new Date(),
        })
        .where(and(
            eq(payments.easebuzzOrderId, txnid),
            ne(payments.status, 'success'),
        ))
        .returning({ bookingId: payments.bookingId });

    if (!updatedRows.length) {
        await db.insert(bookingLogs).values({
            action: 'easebuzz_late_failure_ignored',
            requestPayload: { source, ...fields },
            level: 'warning',
            errorMessage: 'Received a failure but payment was already marked successful. Ignoring.',
        });
        return {
            ok: true,
            code: 'late_failure_ignored',
            bookingId: paymentRecord.bookingId,
            message: 'Late failure ignored',
        };
    }

    const reason = fields.error_Message || fields.error_message || fields.error || 'Payment failed at gateway';

    try {
        const bookingId = updatedRows[0]?.bookingId;
        if (bookingId) {
            // This is the only place that knows the *payment* failed, as opposed
            // to the booking failing after a successful charge. The state machine
            // therefore never writes 'failed' itself.
            await db.update(bookings)
                .set({ paymentStatus: 'failed', updatedAt: new Date() })
                .where(eq(bookings.id, bookingId));

            await bookingService.markAsFailed(bookingId, reason);
        }
    } catch (failErr) {
        console.error(`[Easebuzz ${source}] Failed to update booking state to failed:`, failErr);
    }

    return {
        ok: true,
        code: 'marked_failed',
        bookingId: updatedRows[0]?.bookingId,
        message: reason,
    };
}
