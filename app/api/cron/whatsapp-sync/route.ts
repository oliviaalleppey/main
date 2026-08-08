import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { runSync, minutesSinceLastWebhook } from '@/lib/services/whatsapp/sync';

export const dynamic = 'force-dynamic';

/**
 * Account health and template status sync.
 *
 * A backstop. Template status arrives by webhook and the dispatcher reacts to
 * account errors on the next send, so this exists for the states that generate
 * no event at all: a quality rating that drifted down over a quiet weekend, a
 * webhook subscription that silently lapsed, a template Meta paused without
 * telling us twice.
 *
 * Returns 200 even on failure, matching whatsapp-retention: a cron that 500s on
 * a transient Graph API blip produces alert noise and fixes nothing. The `ok`
 * field in the body is the thing to watch.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const session = await auth();
    const adminAuthorized = !!session && session.user?.role === 'admin';

    if (!cronAuthorized && !adminAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const report = await runSync();
        const webhookAgeMinutes = await minutesSinceLastWebhook();

        if (report.killSwitchTripped) {
            console.error('[whatsapp/sync] kill switch turned off by red quality rating');
        }

        return NextResponse.json({ ...report, webhookAgeMinutes });
    } catch (error) {
        console.error('[whatsapp/sync] sync failed', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
            { status: 200 },
        );
    }
}
