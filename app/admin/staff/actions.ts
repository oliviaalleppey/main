'use server';

import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { accounts, adminSectionGrants, users } from '@/lib/db/schema';
import { requireAdminPage } from '@/lib/admin/guard';
import { isSectionKey, type SectionKey } from '@/lib/admin/sections';

/**
 * Staff administration. Every action here is administrator-only — granting a
 * staff member the ability to hand out grants would undo the whole system.
 *
 * `requireAdminPage` is used rather than `requireAdminAction` because these run
 * from form submissions on /admin/staff, where redirecting a non-admin to the
 * dashboard is the friendlier failure. They are still refused either way.
 */

export type StaffMember = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: 'admin' | 'staff' | 'user';
    sections: SectionKey[];
    /** False until they complete their first Google sign-in. */
    hasSignedIn: boolean;
};

export async function listStaff(): Promise<StaffMember[]> {
    await requireAdminPage();

    const people = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            role: users.role,
        })
        .from(users)
        .where(inArray(users.role, ['admin', 'staff']));

    if (people.length === 0) return [];

    const ids = people.map((p) => p.id);

    // One query each for grants and linked accounts, rather than one per person.
    const [grants, linked] = await Promise.all([
        db
            .select({ userId: adminSectionGrants.userId, section: adminSectionGrants.section })
            .from(adminSectionGrants)
            .where(inArray(adminSectionGrants.userId, ids)),
        db
            .select({ userId: accounts.userId })
            .from(accounts)
            .where(inArray(accounts.userId, ids)),
    ]);

    const signedIn = new Set(linked.map((row) => row.userId));

    const bySection = new Map<string, SectionKey[]>();
    for (const grant of grants) {
        if (!isSectionKey(grant.section)) continue;
        const list = bySection.get(grant.userId) ?? [];
        list.push(grant.section);
        bySection.set(grant.userId, list);
    }

    return people
        .map((person) => ({
            ...person,
            role: (person.role ?? 'user') as StaffMember['role'],
            sections: bySection.get(person.id) ?? [],
            hasSignedIn: signedIn.has(person.id),
        }))
        // Administrators first, then staff alphabetically — the owner is looking
        // for a named person, and the admins are the short, stable part of the list.
        .sort((a, b) => {
            if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
            return (a.name ?? a.email).localeCompare(b.name ?? b.email);
        });
}

/**
 * Add a staff member by email, before they have ever signed in.
 *
 * NextAuth's Drizzle adapter looks a user up by email during sign-in and only
 * creates a row when none exists, so writing the row here means their first
 * Google sign-in adopts this one — with the staff role and grants already on it.
 * Without that, a new hire would have to sign in once, be bounced out, and wait
 * for the owner to find them in a list.
 */
export async function addStaff(formData: FormData): Promise<{ error?: string }> {
    const admin = await requireAdminPage();

    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
        return { error: 'Enter a valid email address.' };
    }

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, role: true },
    });

    if (existing) {
        if (existing.role === 'admin') {
            return { error: 'That account is already an administrator.' };
        }
        await db.update(users).set({ role: 'staff' }).where(eq(users.id, existing.id));
    } else {
        await db.insert(users).values({ email, role: 'staff' });
    }

    console.info(`[admin/staff] ${admin.email} added staff ${email}`);
    revalidatePath('/admin/staff');
    return {};
}

/** Replace one person's grants with exactly the sections ticked on the form. */
export async function setStaffSections(formData: FormData): Promise<{ error?: string }> {
    const admin = await requireAdminPage();

    const userId = String(formData.get('userId') ?? '');
    if (!userId) return { error: 'Missing user.' };

    const target = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, email: true, role: true },
    });
    if (!target) return { error: 'That account no longer exists.' };
    if (target.role === 'admin') {
        // Administrators hold everything implicitly; writing grant rows for them
        // would imply the rows mean something, and someone would later "tidy up"
        // by deleting them.
        return { error: 'Administrators already have every section.' };
    }

    const selected = formData
        .getAll('sections')
        .map(String)
        .filter(isSectionKey);

    await db.transaction(async (tx) => {
        // Replace rather than merge: the form submits the complete intended set,
        // so anything absent from it is a revocation.
        await tx.delete(adminSectionGrants).where(eq(adminSectionGrants.userId, userId));

        if (selected.length > 0) {
            await tx.insert(adminSectionGrants).values(
                selected.map((section) => ({
                    userId,
                    section,
                    canWrite: false,
                    grantedBy: admin.email,
                })),
            );
        }
    });

    console.info(`[admin/staff] ${admin.email} set ${target.email} sections to [${selected.join(', ')}]`);
    revalidatePath('/admin/staff');
    return {};
}

/**
 * Remove a staff member's access entirely.
 *
 * Their user row is kept and demoted to 'user' rather than deleted: the row is
 * referenced by NextAuth's accounts and sessions tables, and deleting it would
 * cascade those away for no benefit. Demoted plus no grants is already a full
 * lockout — getAdminAccess returns null for role 'user'.
 */
export async function removeStaff(formData: FormData): Promise<{ error?: string }> {
    const admin = await requireAdminPage();

    const userId = String(formData.get('userId') ?? '');
    if (!userId) return { error: 'Missing user.' };

    const target = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, email: true, role: true },
    });
    if (!target) return { error: 'That account no longer exists.' };
    if (target.role === 'admin') {
        return { error: 'Administrator accounts cannot be removed from here.' };
    }

    await db.transaction(async (tx) => {
        await tx.delete(adminSectionGrants).where(eq(adminSectionGrants.userId, userId));
        await tx.update(users).set({ role: 'user' }).where(eq(users.id, userId));
    });

    console.info(`[admin/staff] ${admin.email} removed staff ${target.email}`);
    revalidatePath('/admin/staff');
    return {};
}

/** Used by the "who can see this section?" summary. */
export async function countGrantsBySection(): Promise<Record<string, number>> {
    await requireAdminPage();

    const rows = await db
        .select({ section: adminSectionGrants.section })
        .from(adminSectionGrants);

    const counts: Record<string, number> = {};
    for (const row of rows) {
        counts[row.section] = (counts[row.section] ?? 0) + 1;
    }
    return counts;
}
