import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookings, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { eq, and, lt, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

    type WatchdogResult = {
        id: string;
        status: string;
        retryCount?: number;
        message?: string;
    };

    try {
        const authHeader = request.headers.get('authorization');
        const cronAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const session = await auth();
        const adminAuthorized = !!session && session.user?.role === 'admin';

        if (!cronAuthorized && !adminAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000); // 60 seconds ago

        // 1. Find stuck bookings (paid but still not confirmed)
        const stuckBookings = await db.query.bookings.findMany({
            where: and(
                inArray(bookings.status, ['payment_success', 'booking_requested']),
                lt(bookings.updatedAt, oneMinuteAgo)
            ),
            limit: 10
        });

        const bookingService = new BookingService();
        const results: WatchdogResult[] = [];

        for (const booking of stuckBookings) {
            console.log(`Watchdog: Processing stuck booking ${booking.id}`);

            try {
                const currentRetryCount = booking.retryCount || 0;

                if (currentRetryCount >= MAX_RETRIES) {
                    await db.insert(bookingLogs).values({
                        bookingId: booking.id,
                        action: 'watchdog_max_retries_pending_manual_review',
                        level: 'warning',
                        requestPayload: {
                            retryCount: currentRetryCount,
                            status: booking.status,
                        }
                    });

                    results.push({
                        id: booking.id,
                        status: 'pending_manual_review',
                        retryCount: currentRetryCount,
                    });
                    continue;
                }

                const newRetryCount = currentRetryCount + 1;
                await db.update(bookings)
                    .set({ retryCount: newRetryCount, updatedAt: now })
                    .where(eq(bookings.id, booking.id));

                console.log(`Watchdog: Retrying booking ${booking.id} (Attempt ${newRetryCount})`);

                const finalizeResult = await bookingService.finalizeFromWebhook(booking.id) as {
                    success?: boolean;
                    status?: string;
                    message?: string;
                };

                await db.insert(bookingLogs).values({
                    bookingId: booking.id,
                    action: 'watchdog_retry',
                    level: finalizeResult.success ? 'info' : 'warning',
                    requestPayload: { retryCount: newRetryCount, finalizeResult }
                });

                results.push({
                    id: booking.id,
                    status: finalizeResult.success ? 'confirmed' : (finalizeResult.status || 'pending_retry'),
                    retryCount: newRetryCount,
                    message: finalizeResult.message,
                });

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown watchdog error';
                console.error(`Watchdog: Failed to process ${booking.id}`, error);

                await db.insert(bookingLogs).values({
                    bookingId: booking.id,
                    action: 'watchdog_error',
                    level: 'warning',
                    errorMessage: message
                });

                results.push({
                    id: booking.id,
                    status: 'pending_retry',
                    retryCount: booking.retryCount || 0,
                    message,
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: stuckBookings.length,
            results
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Watchdog failed';
        console.error('Watchdog failed:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
