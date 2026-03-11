import { config } from 'dotenv';
config();
import { db } from '../lib/db';
import { roomTypes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkSlug() {
    try {
        const roomType = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.id, 'c020336f-23ab-4334-bd73-e5adf470e97a')
        });
        console.log("Database Room Data:", roomType);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSlug();
