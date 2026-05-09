import { db } from './lib/db';
import { roomTypes } from './lib/db/schema';

async function check() {
    const rows = await db.select({
        name: roomTypes.name,
        maxGuests: roomTypes.maxGuests,
        maxAdults: roomTypes.maxAdults,
        maxChildren: roomTypes.maxChildren,
        baseOccupancy: roomTypes.baseOccupancy,
    }).from(roomTypes);
    console.table(rows);
    process.exit(0);
}
check();
