import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { purgeRawEvents } from '@/lib/services/whatsapp/compliance';

export const dynamic = 'force-dynamic';

/**
 * Retention sweep: drop raw webhook payloads past their retention window.
 *
 * `wa_events` holds Meta's payloads verbatim — message bodies and phone numbers —
 * for debugging and replay. Useful for days, indefensible for years, so it is
 * swept nightly. WHATSAPP_EVENT_RETENTION_DAYS overrides the 30-day default.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const session = await auth();
    const adminAuthorized = !!session && session.user?.role === 'admin';

    if (!cronAuthorized && !adminAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configured = Number(process.env.WHATSAPP_EVENT_RETENTION_DAYS);
    const days = Number.isFinite(configured) && configured > 0 ? configured : 30;

    try {
        const report = await purgeRawEvents(days);
        return NextResponse.json({ ok: true, days, ...report });
    } catch (error) {
        console.error('[whatsapp/retention] purge failed', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Purge failed' },
            { status: 200 },
        );
    }
}
