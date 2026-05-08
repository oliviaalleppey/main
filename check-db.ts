import { db } from './lib/db';
import { roomInventory } from './lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function check() {
    const inv = await db.select().from(roomInventory).where(
        and(
            gte(roomInventory.date, '2026-10-01'),
            lte(roomInventory.date, '2026-10-31')
        )
    );
    console.log("Overrides in Oct 2026:", inv);
    process.exit(0);
}
check();
