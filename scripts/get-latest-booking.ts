
import 'dotenv/config';
import { db } from '../lib/db';
import { bookings } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
    const booking = await db.query.bookings.findFirst({
        orderBy: [desc(bookings.createdAt)],
    });

    if (booking) {
        console.log(`Latest Booking ID: ${booking.id}`);
        console.log(`Guest: ${booking.guestName}`);
        console.log(`Status: ${booking.status}`);
        console.log(`URL: http://localhost:3000/book/confirmation/${booking.id}`);
    } else {
        console.log('No bookings found.');
    }
}

main().catch(console.error).finally(() => process.exit(0));
