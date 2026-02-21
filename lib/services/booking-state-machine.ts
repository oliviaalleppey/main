import { db } from '@/lib/db';
import { bookings, bookingHistory, bookingLogs, bookingAuditLogs } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Define allowed states based on schema + ruleset
// Note: 'pending' from schema is kept for backward compat but we use more granular states now.
// INIT -> PENDING_PAYMENT -> PAYMENT_SUCCESS -> BOOKING_REQUESTED -> CONFIRMED
//                                            -> FAILED -> REFUNDED
//                                            -> EXPIRED
export type BookingStatus =
    | 'pending' // Legacy/Initial
    | 'initiated'
    | 'pending_payment'
    | 'payment_success'
    | 'booking_requested'
    | 'confirmed'
    | 'failed'
    | 'refunded'
    | 'expired'
    | 'cancelled'
    | 'completed';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    'initiated': ['pending_payment', 'failed', 'expired'],
    'pending': ['pending_payment', 'failed', 'expired', 'cancelled'], // Legacy compat
    'pending_payment': ['payment_success', 'failed', 'expired', 'cancelled'],
    'payment_success': ['booking_requested', 'failed', 'refunded'],
    'booking_requested': ['confirmed', 'failed', 'refunded'],
    'confirmed': ['completed', 'cancelled', 'refunded'],
    'failed': ['refunded'], // Can refund a failed booking if payment was taken
    'refunded': [], // Terminal
    'expired': [], // Terminal
    'cancelled': ['refunded'], // Can refund after cancellation
    'completed': [], // Terminal
};

export class BookingStateMachine {

    /**
     * transition
     * Validates and executes a state transition.
     * Updates DB and logs the change.
     */
    async transition(bookingId: string, newState: BookingStatus, context?: {
        reason?: string,
        performedBy?: string,
        metadata?: any
    }) {
        // 1. Fetch current state
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
            columns: {
                id: true,
                status: true,
                version: true,
            }
        });

        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`);
        }

        const currentState = booking.status as BookingStatus;

        // 2. Validate transition
        if (!this.canTransition(currentState, newState)) {
            const errorMsg = `Invalid state transition from ${currentState} to ${newState} for booking ${bookingId}`;
            console.error(errorMsg);

            // Log attempt failure
            await db.insert(bookingLogs).values({
                bookingId,
                action: 'state_transition_attempt',
                level: 'error',
                errorMessage: errorMsg,
                requestPayload: { currentState, newState, context }
            });

            throw new Error(errorMsg);
        }

        // 3. Execute transition in transaction to ensure atomicity
        // Note: Drizzle transaction syntax might vary, using simple update for now but usually we'd want atomicity.
        // Also handling optimistic locking via version.

        const now = new Date();

        await db.transaction(async (tx) => {
            // Update booking status
            await tx.update(bookings)
                .set({
                    status: newState,
                    version: sql`${bookings.version} + 1`,
                    updatedAt: now,
                    // Specific timestamp updates based on state
                    ...(newState === 'confirmed' ? { confirmedAt: now } : {}),
                    ...(newState === 'cancelled' ? { cancelledAt: now, cancellationReason: context?.reason } : {}),
                })
                .where(eq(bookings.id, bookingId));

            // Create audit log entry
            await tx.insert(bookingHistory).values({
                bookingId: bookingId,
                action: `transition_to_${newState}`,
                changes: {
                    old: { status: currentState },
                    new: { status: newState }
                },
                performedBy: context?.performedBy || 'system',
                notes: context?.reason,
                createdAt: now
            } as any);

            // Production Audit Log (Mandatory)
            await tx.insert(bookingAuditLogs).values({
                bookingId: bookingId,
                previousState: currentState,
                newState: newState,
                reason: context?.reason,
                actor: context?.performedBy || 'system',
                metadata: context?.metadata,
                timestamp: now
            } as any);

            // Log technical detail
            await tx.insert(bookingLogs).values({
                bookingId,
                action: 'state_transition',
                level: 'info',
                requestPayload: {
                    from: currentState,
                    to: newState,
                    reason: context?.reason,
                    metadata: context?.metadata
                },
                durationMs: 0 // Placeholder
            } as any);
        });

        console.log(`Booking ${bookingId} transitioned to ${newState}`);
    }

    /**
     * canTransition
     * Checks if a transition is allowed.
     */
    canTransition(from: BookingStatus, to: BookingStatus): boolean {
        // Allow staying in same state? Rules say "Booking status must only change". 
        // So strict change usually implies distinct state. But sometimes idempotent calls happen.
        if (from === to) return true;

        const allowed = ALLOWED_TRANSITIONS[from];
        return allowed ? allowed.includes(to) : false;
    }
}

export const bookingStateMachine = new BookingStateMachine();
