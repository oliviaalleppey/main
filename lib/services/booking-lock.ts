import { db } from '@/lib/db';
import { bookingProcessingLock } from '@/lib/db/schema';
import { eq, lt } from 'drizzle-orm';

export class BookingLockService {
    private static LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

    /**
     * Attempt to acquire a lock for processing a booking.
     * Returns true if lock acquired, false if already locked.
     */
    static async acquireLock(bookingId: string, processorId: string): Promise<boolean> {
        // 1. Clean up expired locks first (lazy cleanup)
        await db.delete(bookingProcessingLock)
            .where(lt(bookingProcessingLock.expiresAt, new Date()));

        // 2. Try to insert new lock
        try {
            await db.insert(bookingProcessingLock).values({
                bookingId,
                processedBy: processorId,
                expiresAt: new Date(Date.now() + this.LOCK_TIMEOUT_MS),
            });
            return true;
        } catch (error: any) {
            // Unique constraint violation means already locked
            if (error.code === '23505' || (error.cause as any)?.code === '23505') { // Postgres unique violation (handle Drizzle wrap)
                return false;
            }
            throw error;
        }
    }

    /**
     * Release the lock for a booking.
     */
    static async releaseLock(bookingId: string) {
        await db.delete(bookingProcessingLock)
            .where(eq(bookingProcessingLock.bookingId, bookingId));
    }
}
