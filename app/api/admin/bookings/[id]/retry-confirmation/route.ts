import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookingLogs, bookings } from '@/lib/db/schema';
import { BookingService } from '@/lib/services/booking-service';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const MAX_RETRIES = Number(process.env.BOOKING_WATCHDOG_MAX_RETRIES || 12);

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: bookingId } = await params;
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
            columns: {
                id: true,
                status: true,
                retryCount: true,
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.status !== 'payment_success' && booking.status !== 'booking_requested') {
            return NextResponse.json(
                { error: `Booking is not retryable from status "${booking.status}"` },
                { status: 400 }
            );
        }

        const currentRetryCount = booking.retryCount || 0;
        if (currentRetryCount >= MAX_RETRIES) {
            return NextResponse.json(
                { error: `Retry limit reached (${MAX_RETRIES}). Mark for manual review.` },
                { status: 409 }
            );
        }

        const newRetryCount = currentRetryCount + 1;
        await db.update(bookings)
            .set({ retryCount: newRetryCount, updatedAt: new Date() })
            .where(eq(bookings.id, bookingId));

        const bookingService = new BookingService();
        const result = await bookingService.finalizeFromWebhook(bookingId);

        await db.insert(bookingLogs).values({
            bookingId,
            action: 'admin_manual_retry_confirmation',
            level: 'info',
            requestPayload: { retryCount: newRetryCount, result },
        });

        return NextResponse.json({
            success: true,
            message: `Manual retry executed (attempt ${newRetryCount})`,
            result,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Manual retry failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
