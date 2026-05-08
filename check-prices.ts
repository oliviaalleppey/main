import { db } from './lib/db';
import { roomTypes } from './lib/db/schema';

async function check() {
    const rts = await db.select({ 
        id: roomTypes.id, 
        name: roomTypes.name, 
        basePrice: roomTypes.basePrice 
    }).from(roomTypes);
    console.log("Room Types Base Prices:");
    console.table(rts);
    process.exit(0);
}
check();
