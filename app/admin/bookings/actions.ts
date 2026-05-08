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
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function cancelBookingAction(id: string) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, id),
            columns: { id: true, status: true, bookingNumber: true },
        });

        if (!booking) return { success: false, error: 'Booking not found.' };
        if (booking.status === 'cancelled') return { success: false, error: 'Booking is already cancelled.' };

        await db.update(bookings).set({
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: session.user?.name || session.user?.email || 'admin',
            updatedAt: new Date(),
        }).where(eq(bookings.id, id));

        // Release inventory locks so the dates become available again
        await db.delete(inventoryLocks).where(eq(inventoryLocks.bookingId, id));

        // Log the cancellation
        await db.insert(bookingHistory).values({
            bookingId: id,
            action: 'cancelled',
            performedBy: session.user?.id || 'admin',
            performedByName: session.user?.name || session.user?.email || 'Admin',
            notes: 'Cancelled by admin from bookings list',
        });

        revalidatePath('/admin');
        revalidatePath('/admin/bookings');
        return { success: true };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: 'Failed to cancel booking.' };
    }
}

export async function deleteBookingAction(id: string) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        throw new Error('Unauthorized');
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
