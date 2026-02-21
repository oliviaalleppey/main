import 'dotenv/config';
import { db } from '../lib/db';
import { bookings, bookingAuditLogs } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Transaction Rollback Verification
 * 
 * This script verifies that database transactions properly rollback on failure.
 * It simulates a mid-transaction error and confirms no partial data is committed.
 */

async function testTransactionRollback() {
    console.log('--- Transaction Rollback Test ---\n');

    const testBookingId = 'test-rollback-' + Date.now();

    try {
        // Attempt a transaction that will fail mid-way
        await db.transaction(async (tx) => {
            console.log('[1] Creating test booking...');
            const [booking] = await tx.insert(bookings).values({
                bookingNumber: testBookingId,
                guestName: 'Rollback Test',
                guestEmail: 'rollback@test.com',
                guestPhone: '0000000000',
                checkIn: new Date(),
                checkOut: new Date(),
                totalAmount: 1000,
                subtotal: 900,
                taxAmount: 100,
                status: 'initiated',
                paymentStatus: 'pending',
                version: 1
            } as any).returning();

            console.log('[2] Creating audit log...');
            await tx.insert(bookingAuditLogs).values({
                bookingId: booking.id, // Use actual ID from inserted booking
                previousState: 'none',
                newState: 'initiated',
                reason: 'Test transaction',
                actor: 'system',
                timestamp: new Date()
            } as any);

            console.log('[3] Simulating error...');
            throw new Error('SIMULATED_TRANSACTION_FAILURE');
        });

        console.error('❌ FAIL: Transaction should have thrown error');
        process.exit(1);

    } catch (error: any) {
        if (error.message === 'SIMULATED_TRANSACTION_FAILURE') {
            console.log('✅ Transaction correctly threw error\n');

            // Verify rollback - booking should NOT exist
            console.log('[4] Verifying rollback...');
            const booking = await db.query.bookings.findFirst({
                where: eq(bookings.bookingNumber, testBookingId)
            });

            if (booking) {
                console.error('❌ FAIL: Booking exists after rollback (transaction not rolled back)');
                console.error('   Found booking:', booking.id);
                process.exit(1);
            }

            console.log('✅ PASS: No data committed after transaction failure');
            console.log('✅ Transaction rollback working correctly\n');
            process.exit(0);

        } else {
            console.error('❌ Unexpected error:', error.message);
            process.exit(1);
        }
    }
}

testTransactionRollback();
