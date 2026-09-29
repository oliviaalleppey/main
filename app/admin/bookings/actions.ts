'use server';

import { db } from '@/lib/db';
import { 
    bookings, 
    bookingItems, 
    bookingHistory, 
    bookingAddOns, 
    payments, 
    bookingProcessingLock, 
    bookingAuditLogs, 
    bookingLogs, 
    bookingGuests, 
    bookingConfirmations,
    inventoryLocks 
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin/guard';
import { bookingStateMachine } from '@/lib/services/booking-state-machine';
import { canCancel, canDelete, canMarkRefunded, type BookingForAdmin } from '@/lib/services/booking-admin-rules';

async function loadForAdmin(id: string): Promise<BookingForAdmin | null> {
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
        columns: { status: true, paymentStatus: true },
    });
    if (!booking) return null;
    const paid = await db.query.payments.findFirst({
        where: and(eq(payments.bookingId, id), eq(payments.status, 'success')),
        columns: { id: true },
    });
    return { status: booking.status, paymentStatus: booking.paymentStatus, hasSuccessfulPayment: !!paid };
}

function refreshBookingPages(id: string) {
    revalidatePath('/admin');
    revalidatePath('/admin/bookings');
    revalidatePath(`/admin/bookings/${id}`);
}

/**
 * Cancel a paid booking, keeping every record.
 *
 * This is what "delete" was being used for. The booking, its payments and its
 * history stay; the state machine stamps cancelled_at and the reason, and
 * finalizeFromWebhook will no longer push it to Hotsoft. The room in Hotsoft and
 * the money in Easebuzz are not touched — there is no cancel API from Datamate,
 * and refunds are the hotel's call under its refund policy — so the admin UI
 * says both must be done by hand.
 */
export async function cancelBookingAction(id: string, reason: string) {
    const admin = await requireAdminAction();

    const why = String(reason ?? '').trim();
    if (why.length < 3) return { success: false, error: 'Give a reason for the cancellation.' };

    const booking = await loadForAdmin(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (booking.status === 'cancelled') return { success: true };
    if (!canCancel(booking)) {
        return { success: false, error: `A booking that is "${booking.status}" and unpaid cannot be cancelled here.` };
    }

    try {
        await bookingStateMachine.transition(id, 'cancelled', {
            reason: why.slice(0, 500),
            performedBy: admin.email,
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: 'Could not cancel the booking.' };
    }

    refreshBookingPages(id);
    return { success: true };
}

/** Record that the payment was refunded by hand in Easebuzz. */
export async function markRefundedAction(id: string, note: string) {
    const admin = await requireAdminAction();

    const booking = await loadForAdmin(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (!canMarkRefunded(booking)) {
        return { success: false, error: 'Only a cancelled or failed booking that was paid can be marked refunded.' };
    }

    try {
        await bookingStateMachine.transition(id, 'refunded', {
            reason: `Refund recorded${note?.trim() ? `: ${note.trim().slice(0, 300)}` : ''}`,
            performedBy: admin.email,
        });
    } catch (error) {
        console.error('Error marking booking refunded:', error);
        return { success: false, error: 'Could not mark the booking refunded.' };
    }

    refreshBookingPages(id);
    return { success: true };
}

export async function deleteBookingAction(id: string) {
    // Deleting a booking erases the reservation and its payment history. Staff
    // granted the bookings section can read them; removing one stays with the
    // administrator regardless of what they hold.
    await requireAdminAction();

    // A booking that took money is a financial record — the GST invoice was
    // issued against it. Deleting erased the booking, its payment rows and its
    // audit trail; those bookings are cancelled instead, which keeps them all.
    const booking = await loadForAdmin(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (!canDelete(booking)) {
        return { success: false, error: 'This booking was paid, so it cannot be deleted. Cancel it instead — that keeps its payment and invoice records.' };
    }

    try {
        // Delete all related records first to satisfy foreign key constraints
        await db.delete(bookingItems).where(eq(bookingItems.bookingId, id));
        await db.delete(bookingHistory).where(eq(bookingHistory.bookingId, id));
        await db.delete(bookingAddOns).where(eq(bookingAddOns.bookingId, id));
        await db.delete(payments).where(eq(payments.bookingId, id));
        await db.delete(bookingProcessingLock).where(eq(bookingProcessingLock.bookingId, id));
        await db.delete(bookingAuditLogs).where(eq(bookingAuditLogs.bookingId, id));
        await db.delete(bookingLogs).where(eq(bookingLogs.bookingId, id));
        await db.delete(bookingGuests).where(eq(bookingGuests.bookingId, id));
        await db.delete(bookingConfirmations).where(eq(bookingConfirmations.bookingId, id));
        await db.delete(inventoryLocks).where(eq(inventoryLocks.bookingId, id));

        // Finally delete the booking
        await db.delete(bookings).where(eq(bookings.id, id));

        revalidatePath('/admin');
        revalidatePath('/admin/bookings');
        return { success: true };
    } catch (error) {
        console.error('Error deleting booking:', error);
        return { success: false, error: 'Failed to delete booking completely.' };
    }
}
