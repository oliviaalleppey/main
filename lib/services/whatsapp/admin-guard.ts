import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { waAuditLog } from '@/lib/db/schema';
import { can, isWhatsAppRole, type Capability } from './roles';

/**
 * Shared auth + audit helpers for the WhatsApp admin API.
 *
 * Every route in app/api/admin/whatsapp/** goes through requireAdmin(), and every
 * mutation calls audit(). Centralising it means a new route cannot accidentally
 * ship without a permission check — the pattern to copy is one line, not fifteen.
 */

export type AdminActor = {
    id?: string;
    email?: string;
    ip?: string;
    role?: string;
};

export class UnauthorizedError extends Error {
    constructor() {
        super('Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

/**
 * Authenticated, but not allowed to do this particular thing.
 *
 * Distinct from UnauthorizedError so the client can tell "sign in" from "your
 * role cannot do that" — answering 401 to a signed-in marketing user trying to
 * launch a campaign would send them round a pointless sign-in loop.
 */
export class ForbiddenError extends Error {
    constructor(public capability: Capability) {
        super(`Your role cannot perform this action (${capability})`);
        this.name = 'ForbiddenError';
    }
}

/**
 * Admin-only. Matches the existing guard used across this codebase
 * (app/admin/layout.tsx, app/api/cron/booking-watchdog/route.ts).
 *
 * Still the right gate for anything genuinely reserved to an administrator.
 * Routes that a marketing or front-desk user should reach use
 * `requireCapability` instead — deliberately opt-in, so introducing roles could
 * not quietly widen access to a route nobody re-examined.
 */
export async function requireAdmin(request: Request): Promise<AdminActor> {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        throw new UnauthorizedError();
    }

    return {
        id: (session.user as { id?: string }).id,
        email: session.user?.email ?? undefined,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        role: session.user?.role,
    };
}

/**
 * Allow anyone whose role carries `capability`.
 *
 * Throws UnauthorizedError when there is no usable session at all, and
 * ForbiddenError when there is one but it lacks the capability.
 */
export async function requireCapability(request: Request, capability: Capability): Promise<AdminActor> {
    const session = await auth();
    const role = session?.user?.role;

    if (!session || !isWhatsAppRole(role)) throw new UnauthorizedError();
    if (!can(role, capability)) throw new ForbiddenError(capability);

    return {
        id: (session.user as { id?: string }).id,
        email: session.user?.email ?? undefined,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        role,
    };
}

/**
 * The server-component equivalent of requireCapability.
 *
 * Pages have no Request to pass, and cannot throw a 403 — they redirect. The
 * three detail pages in this module originally gated on `role !== 'admin'`,
 * which silently made the whole capability table inert on exactly the screens
 * that display phone numbers: a marketing user holding contacts.write could not
 * open a contact at all. Returning the actor also gives the page the role it
 * needs to decide masking.
 *
 * Forbidden sends the user to the module root rather than /signin — they are
 * signed in perfectly well, and bouncing them to a sign-in page for a permission
 * problem is the pointless loop ForbiddenError exists to avoid.
 */
export async function requirePageCapability(capability: Capability): Promise<AdminActor> {
    const session = await auth();
    const role = session?.user?.role;

    if (!session || !isWhatsAppRole(role)) redirect('/signin');
    if (!can(role, capability)) redirect('/admin/whatsapp');

    return {
        id: (session.user as { id?: string }).id,
        email: session.user?.email ?? undefined,
        role,
    };
}

/** Turn a thrown error into the right response. Keeps route handlers flat. */
export function errorResponse(error: unknown) {
    if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
        return NextResponse.json(
            { error: error.message, code: 'forbidden', capability: error.capability },
            { status: 403 },
        );
    }
    const message = error instanceof Error ? error.message : 'Request failed';
    console.error('[whatsapp/api]', error);
    // Validation failures surface their own message; anything else is a 500.
    const isClientError = error instanceof Error && /required|must|invalid|not found|already/i.test(message);
    return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 });
}

export async function audit(params: {
    actor: AdminActor;
    action: string;
    entityType?: string;
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
}): Promise<void> {
    try {
        await db.insert(waAuditLog).values({
            actorId: params.actor.id,
            actorEmail: params.actor.email,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            before: params.before,
            after: params.after,
            ip: params.actor.ip,
        });
    } catch (error) {
        // An audit failure must never break the operation it was recording, but it
        // must be loud — a silent gap in the audit log is worse than a noisy one.
        console.error('[whatsapp/audit] failed to write audit entry', params.action, error);
    }
}
