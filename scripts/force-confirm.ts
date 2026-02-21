
import 'dotenv/config';
import { db } from '../lib/db';
import { bookings, bookingConfirmations } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const BOOKING_ID = '0a18c6ec-7f4c-4ea2-ba2e-d55c43f642bc';

async function main() {
    console.log(`Forcing booking ${BOOKING_ID} to CONFIRMED...`);

    // 1. Update Booking Status
    await db.update(bookings).set({
        status: 'confirmed',
        paymentStatus: 'success',
        confirmedAt: new Date(),
    }).where(eq(bookings.id, BOOKING_ID));

    // 2. Ensure Confirmation Record exists (mock)
    await db.insert(bookingConfirmations).values({
        bookingId: BOOKING_ID,
        confirmationNumber: 'OLIVIA-DEMO-123',
        axisRoomsBookingId: 'AXIS-DEMO-999',
        apiResponse: { status: 'mocked' },
    }).onConflictDoNothing();

    console.log('✅ Booking confirmed manually.');
    console.log(`View Invoice here: http://localhost:3000/book/confirmation/${BOOKING_ID}`);
}

main().catch(console.error).finally(() => process.exit(0));
