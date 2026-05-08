import { getBookingProvider } from './lib/providers/crs/factory';
import { db } from './lib/db';

async function check() {
    const provider = getBookingProvider();
    const avail = await provider.checkAvailability({
        checkIn: '2026-10-05',
        checkOut: '2026-10-06',
        adults: 2,
        children: 0
    });
    console.log("CRS Availability:", JSON.stringify(avail, null, 2));
    process.exit(0);
}
check();
