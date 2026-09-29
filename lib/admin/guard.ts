import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { adminSectionGrants, users } from '@/lib/db/schema';
import { ADMIN_SECTIONS, isSectionKey, SECTION_HREFS, type SectionKey } from './sections';

/**
 * Permission checks for the admin panel.
 *
 * The rule the whole panel runs on: **an administrator holds everything; a staff
 * member holds exactly the sections granted to them and nothing else.** Anything
 * that is neither is not in the panel at all.
 *
 * Role and grants are read from the database on every call rather than from the
 * session token. That costs one query per admin request and buys the property
 * that matters operationally — when the owner takes a section away from someone,
 * it is gone on their next page load, not at their next sign-in. A token-carried
 * permission would leave a dismissed employee holding a valid session for days.
 */

export type AdminAccess = {
    userId: string;
    email: string;
    role: 'admin' | 'staff';
    /** Sections this person may open. Admins hold every section implicitly. */
    sections: Set<SectionKey>;
    canWrite: Set<SectionKey>;
    isAdmin: boolean;
};

export class UnauthenticatedError extends Error {
    constructor() {
        super('Not signed in');
        this.name = 'UnauthenticatedError';
    }
}

export class ForbiddenSectionError extends Error {
    constructor(public section: SectionKey | 'admin') {
        super(`Your account does not have access to this section (${section})`);
        this.name = 'ForbiddenSectionError';
    }
}

/**
 * Resolve who is asking and what they hold, or null if they are not admin/staff.
 *
 * Deliberately returns null rather than throwing, so the two callers that need
 * to branch (the layout, and the sidebar's menu) can do so without try/catch.
 */
export async function getAdminAccess(): Promise<AdminAccess | null> {
    const session = await auth();
    const email = session?.user?.email;
    if (!session || !email) return null;

    // The session token's role is a hint from sign-in time; the database is the
    // authority. Looking it up here is what makes a demotion take effect at once.
    const dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, email: true, role: true },
    });

    if (!dbUser) return null;
    if (dbUser.role !== 'admin' && dbUser.role !== 'staff') return null;

    if (dbUser.role === 'admin') {
        return {
            userId: dbUser.id,
            email: dbUser.email,
            role: 'admin',
            // Left empty on purpose: `isAdmin` is what callers check, and an admin
            // must not be limited to whatever the section list happened to contain
            // when their session began.
            sections: new Set<SectionKey>(),
            canWrite: new Set<SectionKey>(),
            isAdmin: true,
        };
    }

    const grants = await db
        .select({ section: adminSectionGrants.section, canWrite: adminSectionGrants.canWrite })
        .from(adminSectionGrants)
        .where(eq(adminSectionGrants.userId, dbUser.id));

    const sections = new Set<SectionKey>();
    const canWrite = new Set<SectionKey>();
    for (const grant of grants) {
        // A grant naming a section that no longer exists in the registry is
        // ignored rather than trusted — removing a section from the code must not
        // leave a live permission pointing at whatever takes its place.
        if (!isSectionKey(grant.section)) continue;
        sections.add(grant.section);
        if (grant.canWrite) canWrite.add(grant.section);
    }

    return {
        userId: dbUser.id,
        email: dbUser.email,
        role: 'staff',
        sections,
        canWrite,
        isAdmin: false,
    };
}

export function hasSection(access: AdminAccess | null, section: SectionKey): boolean {
    if (!access) return false;
    return access.isAdmin || access.sections.has(section);
}

export function hasWrite(access: AdminAccess | null, section: SectionKey): boolean {
    if (!access) return false;
    return access.isAdmin || access.canWrite.has(section);
}

/**
 * The first page this person can actually open.
 *
 * Sending a refused staff member to /admin looks obvious and is wrong: the
 * dashboard is itself a grantable section, so someone holding only Gallery would
 * be refused there too and bounced straight back — a redirect loop the browser
 * gives up on. Landing them on something they hold, or on the explicit
 * no-access page when they hold nothing, terminates in one hop.
 */
export function landingPathFor(access: AdminAccess): string {
    if (access.isAdmin) return '/admin';

    // ADMIN_SECTIONS order is the menu order, so this is the topmost entry they
    // can see — the same one their sidebar shows first.
    for (const section of ADMIN_SECTIONS) {
        if (access.sections.has(section.key)) return SECTION_HREFS[section.key];
    }
    return '/admin/no-access';
}

/**
 * Page guard: the caller may view this section, or they are sent away.
 *
 * Not signed in at all goes to /signin. Signed in but not entitled goes to a
 * page they can open — they have a perfectly good session, and bouncing them to
 * a sign-in page for a permission problem is a loop that never resolves.
 */
export async function requireSection(section: SectionKey): Promise<AdminAccess> {
    const access = await getAdminAccess();
    if (!access) redirect('/signin');
    if (!hasSection(access, section)) redirect(landingPathFor(access));
    return access;
}

/** Page guard for screens that are the owner's alone, such as /admin/staff. */
export async function requireAdminPage(): Promise<AdminAccess> {
    const access = await getAdminAccess();
    if (!access) redirect('/signin');
    if (!access.isAdmin) redirect(landingPathFor(access));
    return access;
}

/**
 * Server-action / route-handler guard for anything that changes data.
 *
 * Throws rather than redirects: a server action that redirected on a permission
 * failure would look to the caller like it had succeeded.
 */
export async function requireAdminAction(): Promise<AdminAccess> {
    const access = await getAdminAccess();
    if (!access) throw new UnauthenticatedError();
    if (!access.isAdmin) throw new ForbiddenSectionError('admin');
    return access;
}

/** Write guard for a specific section — admins, plus staff holding can_write. */
export async function requireSectionWrite(section: SectionKey): Promise<AdminAccess> {
    const access = await getAdminAccess();
    if (!access) throw new UnauthenticatedError();
    if (!hasWrite(access, section)) throw new ForbiddenSectionError(section);
    return access;
}

/** Read guard for API routes that serve a section's data to the browser. */
export async function requireSectionRead(section: SectionKey): Promise<AdminAccess> {
    const access = await getAdminAccess();
    if (!access) throw new UnauthenticatedError();
    if (!hasSection(access, section)) throw new ForbiddenSectionError(section);
    return access;
}

/**
 * Route-handler guard that returns a response instead of throwing.
 *
 * Most handlers in this project wrap their body in try/catch and turn anything
 * thrown into a 500. A guard that threw would be swallowed by that and reported
 * as a server error, so this returns the 401/403 to hand straight back:
 *
 *     const denied = await denyUnlessAdmin();
 *     if (denied) return denied;
 */
export async function denyUnlessAdmin(): Promise<NextResponse | null> {
    const access = await getAdminAccess();
    if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!access.isAdmin) {
        return NextResponse.json(
            { error: 'Administrator access required', code: 'forbidden' },
            { status: 403 },
        );
    }
    return null;
}

/** As denyUnlessAdmin, but admits staff holding a read grant on `section`. */
export async function denyUnlessSection(section: SectionKey): Promise<NextResponse | null> {
    const access = await getAdminAccess();
    if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasSection(access, section)) {
        return NextResponse.json(
            { error: `Your account does not have access to ${section}`, code: 'forbidden', section },
            { status: 403 },
        );
    }
    return null;
}

/** Turn a thrown guard error into the right HTTP response. Keeps handlers flat. */
export function guardErrorResponse(error: unknown): NextResponse | null {
    if (error instanceof UnauthenticatedError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenSectionError) {
        return NextResponse.json(
            { error: error.message, code: 'forbidden', section: error.section },
            { status: 403 },
        );
    }
    return null;
}

/**
 * How many administrators the panel has, for the WhatsApp two-person rules
 * (campaign start above the approval threshold, template submission to Meta).
 *
 * Counted from the `user` table, which is where roles live and whose ids
 * approvedBy / submittedBy hold. Those rules used to count the legacy
 * admin_users table, which nothing populates — so the count was 0, the
 * "sole administrator" exception always applied, and one person could approve
 * and launch their own campaign to thousands of guests.
 */
export async function countAdministrators(): Promise<number> {
    const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));
    return rows.length;
}
