'use server';

import { db } from '@/lib/db';
import { membershipApplications } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function getMemberships() {
  try {
    return await db.select().from(membershipApplications).orderBy(desc(membershipApplications.createdAt));
  } catch (error) {
    console.error('Failed to fetch memberships:', error);
    return [];
  }
}

export async function updateMembershipStatus(id: string, status: 'pending' | 'contacted' | 'approved' | 'rejected') {
  try {
    await db.update(membershipApplications)
      .set({ status, updatedAt: new Date() })
      .where(eq(membershipApplications.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to update membership status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
