import { db } from '@/lib/db';
import { payments, bookingLogs } from '@/lib/db/schema';
import { bookingStateMachine } from '@/lib/services/booking-state-machine';
import { BookingService } from '@/lib/services/booking-service';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Razorpay signature verification
function verifySignature(body: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
}

export async function POST(request: Request) {
    try {
        const bodyText = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature || !verifySignature(bodyText, signature, process.env.RAZORPAY_WEBHOOK_SECRET || '')) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(bodyText);
        const { payload } = event;

        // We only care about payment.captured or order.paid
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const amount = paymentEntity.amount; // in paise

            // 1. Find payment record (we stored razorpayOrderId in `payments` table)
            const paymentRecord = await db.query.payments.findFirst({
                where: eq(payments.razorpayOrderId, orderId),
                with: {
                    booking: true
                }
            });

            if (!paymentRecord) {
                console.error(`Payment record not found for order ${orderId}`);
                return NextResponse.json({ received: true }); // Acknowledge to stop retries if it's junk
            }

            // 2. Verify amount
            if (paymentRecord.amount !== amount) {
                console.error(`Amount mismatch for order ${orderId}: expected ${paymentRecord.amount}, got ${amount}`);
                // Flag likely fraud?
                await db.insert(bookingLogs).values({
                    bookingId: paymentRecord.bookingId,
                    action: 'payment_amount_mismatch',
                    level: 'error',
                    requestPayload: event
                });
                return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
            }

            // 3. Update payment status
            if (paymentRecord.status !== 'success') {
                await db.update(payments).set({
                    status: 'success',
                    razorpayPaymentId: paymentEntity.id,
                    razorpaySignature: signature, // store latest signature for audit?
                    paymentVerifiedAt: new Date(),
                    paymentMethod: paymentEntity.method
                }).where(eq(payments.id, paymentRecord.id));

                // 4. Update Booking Status via State Machine
                // INITIATED/PENDING_PAYMENT -> PAYMENT_SUCCESS
                await bookingStateMachine.transition(paymentRecord.bookingId, 'payment_success', {
                    reason: 'Webhook: Payment captured',
                    metadata: { paymentId: paymentEntity.id }
                });

                // 5. Trigger Booking Creation (if not already requested)
                // This converts 'payment_success' -> 'booking_requested' -> 'confirmed'
                const bookingService = new BookingService();

                try {
                    const finalizeResult = await bookingService.finalizeFromWebhook(paymentRecord.bookingId) as {
                        success?: boolean;
                        status?: string;
                        message?: string;
                    };

                    if (!finalizeResult.success) {
                        await db.insert(bookingLogs).values({
                            bookingId: paymentRecord.bookingId,
                            action: 'webhook_finalize_pending_retry',
                            level: 'warning',
                            requestPayload: finalizeResult,
                            errorMessage: finalizeResult.message || 'Reservation pending retry',
                        });
                    }
                } catch (finalizeError: unknown) {
                    const message = finalizeError instanceof Error ? finalizeError.message : 'Unknown finalize error';
                    await db.insert(bookingLogs).values({
                        bookingId: paymentRecord.bookingId,
                        action: 'webhook_finalize_error_pending_retry',
                        level: 'warning',
                        errorMessage: message,
                    });
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Webhook error';
        console.error('Webhook error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
