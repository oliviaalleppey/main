import { db } from './lib/db';
import { roomInventory } from './lib/db/schema';
async function test() {
    const inv = await db.select().from(roomInventory).limit(1);
    console.log(inv);
    process.exit(0);
}
test();
