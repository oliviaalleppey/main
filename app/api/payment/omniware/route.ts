import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { OmniwareService } from '@/lib/services/omniware';
import { eq } from 'drizzle-orm';

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
            if (parseFloat(postData.amount) !== (paymentRecord.amount / 100)) {
                await db.insert(bookingLogs).values({
                    action: 'omniware_amount_mismatch',
                    requestPayload: postData,
                    level: 'error',
                    errorMessage: `Expected ${(paymentRecord.amount / 100).toFixed(2)}, got ${postData.amount}`
                });
                return new NextResponse('Amount Mismatch', { status: 400 });
            }

            // Update Payment Record
            await db.update(payments)
                .set({
                    status: 'success',
                    omniwareTransactionId: postData.transaction_id,
                    omniwareHash: postData.hash,
                    paymentVerifiedAt: new Date(),
                    paymentMethod: postData.payment_channel || 'omniware',
                    updatedAt: new Date(),
                })
                .where(eq(payments.omniwareOrderId, txnid));

            // Mark Booking as Confirmed
            await bookingService.finalizeFromWebhook(paymentRecord.bookingId);

            // Redirect user to success
            const origin = req.nextUrl.origin;
            return NextResponse.redirect(`${origin}/book/confirmation/${paymentRecord.bookingId}?status=success`);
        } else {
            // Failure
            await db.update(payments)
                .set({
                    status: 'failed',
                    omniwareTransactionId: postData.transaction_id,
                    omniwareHash: postData.hash,
                    updatedAt: new Date(),
                })
                .where(eq(payments.omniwareOrderId, txnid));

            const origin = req.nextUrl.origin;
            return NextResponse.redirect(`${origin}/book/checkout?error=${encodeURIComponent(postData.error_desc || postData.response_message || 'Payment Failed')}`);
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
