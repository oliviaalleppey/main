'use server';

import { db } from '@/lib/db';
import { membershipApplications } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdminAction, requireSectionRead } from '@/lib/admin/guard';

/**
 * Read guard, not just a write guard: this returns every membership applicant's
 * name, contact details and status. A server action is a public POST endpoint —
 * without this, the whole applicant list was retrievable by anyone who knew the
 * action existed, signed in or not.
 */
export async function getMemberships() {
  try {
    await requireSectionRead('memberships');
    return await db.select().from(membershipApplications).orderBy(desc(membershipApplications.createdAt));
  } catch (error) {
    console.error('Failed to fetch memberships:', error);
    return [];
  }
}

export async function updateMembershipStatus(id: string, status: 'pending' | 'contacted' | 'approved' | 'rejected') {
  try {
    await requireAdminAction();
    await db.update(membershipApplications)
      .set({ status, updatedAt: new Date() })
      .where(eq(membershipApplications.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to update membership status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
