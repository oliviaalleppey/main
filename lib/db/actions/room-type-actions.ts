'use server';

import { db } from '@/lib/db';
import { roomTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateRoomTypeSorting(updates: { id: string, sortOrder: number }[]) {
    if (!Array.isArray(updates) || updates.length === 0) return { success: true };
    
    try {
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(roomTypes)
                    .set({ sortOrder: update.sortOrder })
                    .where(eq(roomTypes.id, update.id));
            }
        });

        revalidatePath('/admin/rooms/types');
        revalidatePath('/book/search');
        revalidatePath('/rooms');
        return { success: true };
    } catch (error) {
        console.error('Failed to update sort order', error);
        return { success: false, error: 'Database update failed' };
    }
}
