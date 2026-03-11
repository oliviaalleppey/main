import { config } from 'dotenv';
config();
import { db } from '../lib/db';
import { bookingLogs } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function checkLogs() {
    try {
        const logs = await db.query.bookingLogs.findMany({
            orderBy: [desc(bookingLogs.createdAt)],
            limit: 5
        });
        console.log("Recent Logs:\n", JSON.stringify(logs, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLogs();
