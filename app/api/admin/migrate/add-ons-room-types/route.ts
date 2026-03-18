import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST() {
    try {
        const session = await auth();
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create the add_on_room_types table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS add_on_room_types (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
                room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
                UNIQUE(add_on_id, room_type_id)
            );
        `);

        // Add index for faster lookups
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_add_on_room_types_add_on_id 
            ON add_on_room_types(add_on_id);
        `);

        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_add_on_room_types_room_type_id 
            ON add_on_room_types(room_type_id);
        `);

        return NextResponse.json({ success: true, message: 'Migration completed' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: String(error) },
            { status: 500 }
        );
    }
}
