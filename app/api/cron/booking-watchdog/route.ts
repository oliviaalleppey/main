import { getAdminAccess } from '@/lib/admin/guard';
import { db } from '@/lib/db';
import { bookings, bookingLogs } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { eq, and, lt, inArray, isNull, or, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { trackCronRun } from '@/lib/services/cron-runs';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request) {
    const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

    type WatchdogResult = {
        id: string;
        status: string;
        retryCount?: number;
        message?: string;
    };

    try {
        const authHeader = request.headers.get('authorization');
        // An unset CRON_SECRET must not make "Bearer undefined" a valid token —
        // these jobs confirm bookings and settle payments. Same guard as the
        // WhatsApp crons.
        const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const adminAuthorized = !cronAuthorized && !!(await getAdminAccess())?.isAdmin;

        if (!cronAuthorized && !adminAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000); // 60 seconds ago

        // 1. Find stuck bookings (paid but still not confirmed) that still have
        // automatic attempts left, oldest first.
        //
        // Bookings at the retry limit are left out of the query itself. They used
        // to be fetched and skipped, which wrote a log row for each of them every
        // five minutes forever — and, worse, ten of them would fill every slot of
        // the batch and stop newer paid bookings being retried at all. By the time
        // one reaches the limit, reservations has been emailed
        // (notifyPaidButUnconfirmed) and the admin panel shows it as at risk; a
        // manual retry from there still works.
        const stuckBookings = await db.query.bookings.findMany({
            where: and(
                inArray(bookings.status, ['payment_success', 'booking_requested']),
                lt(bookings.updatedAt, oneMinuteAgo),
                or(isNull(bookings.retryCount), lt(bookings.retryCount, MAX_RETRIES)),
            ),
            orderBy: [asc(bookings.updatedAt)],
            limit: 10
        });

        const bookingService = new BookingService();
        const results: WatchdogResult[] = [];

        for (const booking of stuckBookings) {
            console.log(`Watchdog: Processing stuck booking ${booking.id}`);

            try {
                const currentRetryCount = booking.retryCount || 0;
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

                // Last automatic attempt, still not confirmed: from here on the
                // watchdog only logs, so this is the one moment to get a person
                // on it. Fires once — the count never reaches MAX_RETRIES again.
                // A 'failed' result has already been reported by finalizeFromWebhook.
                if (newRetryCount === MAX_RETRIES && !finalizeResult.success && finalizeResult.status === 'pending_retry') {
                    await bookingService.notifyPaidButUnconfirmed(
                        booking.id,
                        'stalled',
                        finalizeResult.message || `No CRS confirmation after ${MAX_RETRIES} attempts`,
                    );
                }

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

/** Recorded in cron_runs so the admin dashboard can show when this last ran. */
export async function GET(request: Request) {
    return trackCronRun('booking-watchdog', request, () => handleGet(request));
}
