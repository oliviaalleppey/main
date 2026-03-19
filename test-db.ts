import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    const res = await sql`SELECT cart_data FROM booking_sessions ORDER BY created_at DESC LIMIT 1`;
    console.log(JSON.stringify(res[0].cart_data, null, 2));
    process.exit(0);
}

main().catch(console.error);
