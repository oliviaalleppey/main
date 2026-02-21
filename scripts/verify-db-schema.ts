
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function verifyColumns() {
    try {
        console.log("Checking columns in room_types table...");
        const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'room_types';
        `);

        const columns = result.rows.map((row: any) => row.column_name);
        console.log("Columns found:", columns);

        const required = ['base_occupancy', 'extra_adult_price', 'extra_child_price'];
        const missing = required.filter(col => !columns.includes(col));

        if (missing.length > 0) {
            console.error("MISSING COLUMNS:", missing);
            process.exit(1);
        } else {
            console.log("All required columns exist!");
            process.exit(0);
        }
    } catch (error) {
        console.error("Error verifying columns:", error);
        process.exit(1);
    }
}

verifyColumns();
