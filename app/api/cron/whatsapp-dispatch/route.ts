import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
    dispatch, activateScheduledCampaigns, pauseCampaignsWithBadTemplates,
} from '@/lib/services/whatsapp/dispatcher';

export const dynamic = 'force-dynamic';
/** Vercel's default is 10s; a batch of sends needs longer. */
export const maxDuration = 60;

/**
 * GET — one dispatch tick.
 *
 * Authorised the same way as booking-watchdog: a CRON_SECRET bearer token, or an
 * admin session so it can be triggered by hand from the panel.
 *
 * Always answers 200 with a report, even when it did nothing or something broke.
 * A cron that returns 500 fails silently in a dashboard nobody reads; a 200 with
 * `"stopped": "..."` is visible in the response body and the logs.
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronAuthorized = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
        const session = await auth();
        const adminAuthorized = !!session && session.user?.role === 'admin';

        if (!cronAuthorized && !adminAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const limitParam = Number(url.searchParams.get('limit'));
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : undefined;

        // Housekeeping first: a campaign whose template was paused by Meta must
        // not have another batch claimed from it this tick.
        const [pausedCampaigns, activated] = await Promise.all([
            pauseCampaignsWithBadTemplates(),
            activateScheduledCampaigns(),
        ]);

        const result = await dispatch({ limit });

        return NextResponse.json({
            ok: true,
            at: new Date().toISOString(),
            activated,
            pausedForTemplate: pausedCampaigns.length,
            ...result,
        });
    } catch (error) {
        console.error('[whatsapp/dispatch] tick failed', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Dispatch failed' },
            { status: 200 },
        );
    }
}
