import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

let ensureRoomTypeColumnPromise: Promise<void> | null = null;

export async function ensureRoomTypeMinOccupancyColumn() {
    if (!ensureRoomTypeColumnPromise) {
        ensureRoomTypeColumnPromise = (async () => {
            await db.execute(
                sql`ALTER TABLE "room_types" ADD COLUMN IF NOT EXISTS "min_occupancy" integer DEFAULT 1 NOT NULL`
            );
        })().catch((error) => {
            ensureRoomTypeColumnPromise = null;
            throw error;
        });
    }

    await ensureRoomTypeColumnPromise;
}

