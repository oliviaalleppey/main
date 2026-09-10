import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, bookings, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { EasebuzzService } from '@/lib/services/easebuzz';
import { and, eq, ne } from 'drizzle-orm';

const bookingService = new BookingService();

/**
 * The gateway fields worth keeping for reconciliation and support, without
 * storing the whole payload (it carries `cardnum`, `upi_va` and the guest's
 * contact details, which have no business sitting in the payments table).
 */
function buildGatewayMetadata(postData: Record<string, string>) {
    return {
        easepayid: postData.easepayid || null,
        bankRefNum: postData.bank_ref_num || null,
        mode: postData.mode || null,               // CC, UPI, NB …
        bankName: postData.bank_name || null,
        netAmountDebit: postData.net_amount_debit || null,
        pgType: postData.PG_TYPE || null,
        unmappedStatus: postData.unmappedstatus || null,
        addedOn: postData.addedon || null,
    };
}

export async function POST(req: NextRequest) {
    let rawText = '';
    try {
        // Easebuzz sends data as application/x-www-form-urlencoded
        rawText = await req.text();
        const postDataStr = new URLSearchParams(rawText);

        const postData: Record<string, string> = {};
        for (const [key, value] of postDataStr.entries()) {
            postData[key] = value;
        }

        const txnid = postData.txnid;
        const status = postData.status === 'success' ? 'success' : 'failure';

        await db.insert(bookingLogs).values({
            action: 'easebuzz_webhook_received',
            requestPayload: postData,
            level: 'info'
        });

        // Verify Hash
        console.log('[Easebuzz webhook] received params:', JSON.stringify(postData));
        const isValidHash = EasebuzzService.verifyResponseHash(postData);
        console.log('[Easebuzz webhook] hash valid:', isValidHash);

        if (!isValidHash) {
            await db.insert(bookingLogs).values({
                action: 'easebuzz_invalid_hash',
                requestPayload: postData,
                level: 'error',
                errorMessage: 'Hash validation failed'
            });
            return new NextResponse('Invalid Hash', { status: 400 });
        }

        if (!txnid) {
            return new NextResponse('Missing txnid', { status: 400 });
        }

        const paymentRecord = await db.query.payments.findFirst({
            where: eq(payments.easebuzzOrderId, txnid),
        });

        if (!paymentRecord) {
            return new NextResponse('Payment not found', { status: 404 });
        }

        if (status === 'success') {
            const parsedAmount = Number.parseFloat(postData.amount || '');
            if (!Number.isFinite(parsedAmount)) {
                await db.insert(bookingLogs).values({
                    action: 'easebuzz_amount_invalid',
                    requestPayload: postData,
                    level: 'error',
                    errorMessage: `Invalid amount received: "${postData.amount}"`
                });
                return new NextResponse('Invalid Amount', { status: 400 });
            }

            const receivedAmountPaise = Math.round(parsedAmount * 100);
            if (receivedAmountPaise !== paymentRecord.amount) {
                await db.insert(bookingLogs).values({
                    action: 'easebuzz_amount_mismatch',
                    requestPayload: postData,
                    level: 'error',
                    errorMessage: `Expected ${paymentRecord.amount} paise, got ${receivedAmountPaise} paise`
                });
                return new NextResponse('Amount Mismatch', { status: 400 });
            }

            // Race-safe: do not overwrite an already failed payment with a late success callback.
            const successUpdates = await db.update(payments)
                .set({
                    status: 'success',
                    // Easebuzz returns `easepayid` (its own payment reference) and
                    // `bank_ref_num`. There is no `easebuzz_transaction_id` field —
                    // reading one left both id columns null on every payment taken so
                    // far, leaving nothing to reconcile against a settlement report.
                    easebuzzTransactionId: postData.easepayid || null,
                    gatewayTransactionId: postData.bank_ref_num || null,
                    easebuzzHash: postData.hash,
                    paymentVerifiedAt: new Date(),
                    paymentMethod: postData.payment_source || 'easebuzz',
                    metadata: buildGatewayMetadata(postData),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(payments.easebuzzOrderId, txnid),
                    ne(payments.status, 'failed'),
                ))
                .returning({
                    bookingId: payments.bookingId,
                });

            if (!successUpdates.length) {
                await db.insert(bookingLogs).values({
                    action: 'easebuzz_late_success_ignored',
                    requestPayload: postData,
                    level: 'warning',
                    errorMessage: 'Received a success webhook after payment was already marked failed. Ignoring auto-confirmation.',
                });
                return new NextResponse('Ignored late success', { status: 200 });
            }

            // Mark Booking as Confirmed
            const bookingId = successUpdates[0]?.bookingId || paymentRecord.bookingId;
            const finalizeResult = await bookingService.finalizeFromWebhook(bookingId);

            if (!finalizeResult?.success && finalizeResult?.status !== 'already_confirmed') {
                await db.insert(bookingLogs).values({
                    bookingId,
                    action: 'easebuzz_success_finalize_pending',
                    level: 'warning',
                    requestPayload: { finalizeResult, postData },
                    errorMessage: 'Payment marked successful but CRS confirmation is pending or failed.',
                });
            }

            // Redirect user to success
            const origin = req.nextUrl.origin;
            return NextResponse.redirect(`${origin}/book/confirmation/${bookingId}`);
        } else {
            // Failure webhook received
            // Race-safe: only update to failed if this payment has not already been marked success.
            const updatedRows = await db.update(payments)
                .set({
                    status: 'failed',
                    easebuzzTransactionId: postData.easepayid || null,
                    gatewayTransactionId: postData.bank_ref_num || null,
                    easebuzzHash: postData.hash,
                    metadata: buildGatewayMetadata(postData),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(payments.easebuzzOrderId, txnid),
                    ne(payments.status, 'success'),
                ))
                .returning({
                    bookingId: payments.bookingId,
                });

            if (!updatedRows.length) {
                await db.insert(bookingLogs).values({
                    action: 'easebuzz_late_failure_ignored',
                    requestPayload: postData,
                    level: 'warning',
                    errorMessage: 'Received a failure webhook but payment was already marked successful. Ignoring.'
                });
                // Return success so gateway stops retrying, but don't fail the booking
                return new NextResponse('Ignored late failure', { status: 200 });
            }

            // Mark Booking as Failed securely
            try {
                const bookingId = updatedRows[0]?.bookingId;
                if (bookingId) {
                    // This is the only place that knows the *payment* failed, as opposed
                    // to the booking failing after a successful charge. The state machine
                    // therefore never writes 'failed' itself.
                    await db.update(bookings)
                        .set({ paymentStatus: 'failed', updatedAt: new Date() })
                        .where(eq(bookings.id, bookingId));

                    await bookingService.markAsFailed(bookingId, postData.error_message || postData.error || 'Payment failed at gateway');
                }
            } catch (failErr) {
                console.error('[Easebuzz Webhook] Failed to update booking state to failed:', failErr);
            }

            const failOrigin = req.nextUrl.origin;
            return NextResponse.redirect(`${failOrigin}/book/checkout?error=${encodeURIComponent(postData.error_message || postData.error || 'Payment Failed')}`);
        }

    } catch (error) {
        console.error('Easebuzz webhook error:', error);
        await db.insert(bookingLogs).values({
            action: 'easebuzz_webhook_error',
            requestPayload: { raw: rawText },
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            level: 'error'
        });
        return new NextResponse('Internal Error', { status: 500 });
    }
}
