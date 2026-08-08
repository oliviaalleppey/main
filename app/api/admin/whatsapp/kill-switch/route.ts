import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { waAuditLog } from '@/lib/db/schema';
import { getSettings, setEnabled } from '@/lib/services/whatsapp/settings';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ enabled: z.boolean() });

/**
 * Flip the global sending kill switch.
 *
 * Every change is written to wa_audit_log — "who turned sending back on" is
 * exactly the question that gets asked after an incident.
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let parsed: { enabled: boolean };
    try {
        parsed = bodySchema.parse(await request.json());
    } catch {
        return NextResponse.json({ error: 'Expected { enabled: boolean }' }, { status: 400 });
    }

    try {
        const before = await getSettings({ fresh: true });
        const after = await setEnabled(parsed.enabled);

        await db.insert(waAuditLog).values({
            actorEmail: session.user?.email ?? undefined,
            action: parsed.enabled ? 'whatsapp.sending.enabled' : 'whatsapp.sending.disabled',
            entityType: 'wa_settings',
            entityId: 'default',
            before: { enabled: before.enabled },
            after: { enabled: after.enabled },
            ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        });

        return NextResponse.json({ success: true, enabled: after.enabled });
    } catch (error) {
        console.error('[whatsapp] kill-switch update failed', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Update failed' },
            { status: 500 },
        );
    }
}
