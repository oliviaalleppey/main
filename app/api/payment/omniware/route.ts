import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { OmniwareService } from '@/lib/services/omniware';
import { and, eq, ne } from 'drizzle-orm';

const bookingService = new BookingService();

export async function POST(req: NextRequest) {
    let rawText = '';
    try {
        // Omniware sends data as application/x-www-form-urlencoded
        rawText = await req.text();
        const postDataStr = new URLSearchParams(rawText);

        const postData: Record<string, string> = {};
        for (const [key, value] of postDataStr.entries()) {
            postData[key] = value;
        }

        const txnid = postData.order_id;
        const status = postData.response_code === "0" ? 'success' : 'failure';

        await db.insert(bookingLogs).values({
            action: 'omniware_webhook_received',
            requestPayload: postData,
            level: 'info'
        });

        // Verify Hash
        const isValidHash = OmniwareService.verifyResponseHash(postData);

        if (!isValidHash) {
            await db.insert(bookingLogs).values({
                action: 'omniware_invalid_hash',
                requestPayload: postData,
                level: 'error',
                errorMessage: 'Hash validation failed'
            });
            return new NextResponse('Invalid Hash', { status: 400 });
        }

        if (!txnid) {
            return new NextResponse('Missing order_id', { status: 400 });
        }

        const paymentRecord = await db.query.payments.findFirst({
            where: eq(payments.omniwareOrderId, txnid),
        });

        if (!paymentRecord) {
            return new NextResponse('Payment not found', { status: 404 });
        }

        if (status === 'success') {
            const parsedAmount = Number.parseFloat(postData.amount || '');
            if (!Number.isFinite(parsedAmount)) {
                await db.insert(bookingLogs).values({
                    action: 'omniware_amount_invalid',
                    requestPayload: postData,
                    level: 'error',
                    errorMessage: `Invalid amount received: "${postData.amount}"`
                });
                return new NextResponse('Invalid Amount', { status: 400 });
            }

            const receivedAmountPaise = Math.round(parsedAmount * 100);
            if (receivedAmountPaise !== paymentRecord.amount) {
                await db.insert(bookingLogs).values({
                    action: 'omniware_amount_mismatch',
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
                    omniwareTransactionId: postData.transaction_id,
                    omniwareHash: postData.hash,
                    paymentVerifiedAt: new Date(),
                    paymentMethod: postData.payment_channel || 'omniware',
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(payments.omniwareOrderId, txnid),
                    ne(payments.status, 'failed'),
                ))
                .returning({
                    bookingId: payments.bookingId,
                });

            if (!successUpdates.length) {
                await db.insert(bookingLogs).values({
                    action: 'omniware_late_success_ignored',
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
                    action: 'omniware_success_finalize_pending',
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
                    omniwareTransactionId: postData.transaction_id,
                    omniwareHash: postData.hash,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(payments.omniwareOrderId, txnid),
                    ne(payments.status, 'success'),
                ))
                .returning({
                    bookingId: payments.bookingId,
                });

            if (!updatedRows.length) {
                await db.insert(bookingLogs).values({
                    action: 'omniware_late_failure_ignored',
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
                    await bookingService.markAsFailed(bookingId, postData.error_desc || postData.response_message || 'Payment failed at gateway');
                }
            } catch (failErr) {
                console.error('[Omniware Webhook] Failed to update booking state to failed:', failErr);
            }

            const failOrigin = req.nextUrl.origin;
            return NextResponse.redirect(`${failOrigin}/book/checkout?error=${encodeURIComponent(postData.error_desc || postData.response_message || 'Payment Failed')}`);
        }

    } catch (error) {
        console.error('Omniware return URL error:', error);
        await db.insert(bookingLogs).values({
            action: 'omniware_webhook_error',
            requestPayload: { raw: rawText },
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            level: 'error'
        });
        return new NextResponse('Internal Error', { status: 500 });
    }
}
