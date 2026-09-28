/**
 * Test Booking Email Script
 * Creates a dummy booking for Lake View Twin Room (June 1-2, 2 adults)
 * and runs the full finalization flow to verify emails are sent.
 *
 * Run: npx tsx scripts/test-booking-email.ts
 */

import 'dotenv/config';
import { db } from '../lib/db';
import {
    bookings,
    bookingItems,
    payments,
    roomTypes,
    ratePlans,
} from '../lib/db/schema';
import { eq, like } from 'drizzle-orm';
import { BookingService } from '../lib/services/booking-service';

const TEST_GUEST = {
    name: 'Test Guest',
    email: 'dev.oliviaalleppey@gmail.com', // goes to your own inbox
    phone: '+91 9999999999',
};

async function main() {
    console.log('\n🧪 TEST BOOKING EMAIL SCRIPT\n');

    // 0. Clean up any leftover test bookings from previous runs
    const staleTestBookings = await db.query.bookings.findMany({
        where: (b, { like }) => like(b.bookingNumber, 'OL-TEST-%'),
        columns: { id: true, bookingNumber: true },
    });
    if (staleTestBookings.length) {
        for (const stale of staleTestBookings) {
            await db.delete(payments).where(eq(payments.bookingId, stale.id));
            await db.delete(bookingItems).where(eq(bookingItems.bookingId, stale.id));
            await db.delete(bookings).where(eq(bookings.id, stale.id));
        }
        console.log(`🧹 Cleaned up ${staleTestBookings.length} previous test booking(s)\n`);
    }

    // 1. Look up Lake View Twin Room
    const roomType = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.slug, 'lake-view-twin'),
    });

    if (!roomType) {
        // fallback: search by name
        const allRooms = await db.query.roomTypes.findMany({ columns: { id: true, name: true, slug: true } });
        console.log('Available room types:', allRooms);
        throw new Error('Lake View Twin room type not found. Check the slug above.');
    }
    console.log(`✅ Room type found: ${roomType.name} (${roomType.id})`);

    // 2. Look up a rate plan (EP / best available)
    const ratePlan = await db.query.ratePlans.findFirst({
        where: eq(ratePlans.code, 'EP'),
    });
    console.log(ratePlan
        ? `✅ Rate plan found: ${ratePlan.code} (${ratePlan.id})`
        : '⚠️  No EP rate plan found — booking will proceed without one');

    // 3. Create a test booking
    const bookingNumber = `OL-TEST-${Date.now()}`;
    const totalAmount = 1000000; // ₹10,000 in paise (dummy)

    const [booking] = await db.insert(bookings).values({
        bookingNumber,
        guestName: TEST_GUEST.name,
        guestEmail: TEST_GUEST.email,
        guestPhone: TEST_GUEST.phone,
        checkIn: '2026-06-01',
        checkOut: '2026-06-02',
        adults: 2,
        children: 0,
        subtotal: Math.round(totalAmount * 0.82),
        taxAmount: Math.round(totalAmount * 0.18),
        totalAmount,
        status: 'pending_payment',
        paymentStatus: 'pending',
        ratePlanId: ratePlan?.id ?? null,
        specialRequests: 'TEST BOOKING — please ignore',
    }).returning();

    console.log(`✅ Booking created: ${booking.bookingNumber} (${booking.id})`);

    // 4. Create a booking item (1 night, June 1→2)
    const nights = 1;
    const pricePerNight = Math.round(totalAmount * 0.82); // subtotal for 1 night
    await db.insert(bookingItems).values({
        bookingId: booking.id,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan?.id ?? null,
        quantity: 1,
        pricePerNight,
        nights,
        subtotal: pricePerNight * nights,
    });
    console.log('✅ Booking item created');

    // 5. Create a payment record and mark it as success
    await db.insert(payments).values({
        bookingId: booking.id,
        amount: totalAmount,
        currency: 'INR',
        status: 'success',
        easebuzzOrderId: `TEST-TXN-${Date.now()}`,
        paymentMethod: 'test',
        paymentVerifiedAt: new Date(),
    });
    console.log('✅ Payment record created (marked success)');

    // 6. Run finalizeFromWebhook — this triggers CRS + emails
    console.log('\n🚀 Running finalizeFromWebhook...\n');
    const service = new BookingService();
    const result = await service.finalizeFromWebhook(booking.id);

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result?.success) {
        console.log('\n✅ Finalization succeeded.');
        console.log('📧 Check reservation@oliviaalleppey.com and dev.oliviaalleppey@gmail.com for emails.');
        console.log(`🔗 Booking in admin: /admin/bookings (search ${bookingNumber})`);
    } else {
        console.log('\n❌ Finalization did not fully succeed. See result above.');
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
});
