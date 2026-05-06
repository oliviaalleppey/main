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
