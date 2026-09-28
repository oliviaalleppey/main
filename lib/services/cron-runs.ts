import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cronRuns } from '@/lib/db/schema';
import vercelConfig from '../../vercel.json';

/**
 * Last-ran tracking for the scheduled jobs in vercel.json.
 *
 * None of the cron routes leaves a trace on a run that finds no work, so from
 * inside the app there was no way to tell a healthy schedule from a dead one —
 * and the Vercel dashboard that does know is not somewhere anyone looks. Every
 * authorised run now upserts one row per job into cron_runs, and the admin
 * dashboard compares the last *scheduled* run against the job's own schedule.
 */

export type CronTrigger = 'schedule' | 'manual';

export type CronJob = {
    /** The route's last path segment, e.g. 'booking-watchdog'. */
    job: string;
    path: string;
    schedule: string;
    /** How often the schedule fires, or null for an expression we do not parse. */
    intervalMinutes: number | null;
};

/**
 * Minutes between runs, for the three shapes vercel.json uses: every N minutes
 * (`*\/5 * * * *`), hourly (`15 * * * *`) and daily (`30 3 * * *`). Anything
 * else returns null and is shown without a lateness check rather than guessed at.
 */
export function scheduleIntervalMinutes(expression: string): number | null {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = expression.trim().split(/\s+/);
    const everyDay = dayOfMonth === '*' && month === '*' && dayOfWeek === '*';
    if (!everyDay) return null;

    if (hour === '*') {
        const every = /^\*\/(\d+)$/.exec(minute ?? '');
        if (every) return Number(every[1]);
        if (/^\d+$/.test(minute ?? '')) return 60;
        if (minute === '*') return 1;
        return null;
    }
    if (/^\d+$/.test(minute ?? '') && /^\d+$/.test(hour ?? '')) return 24 * 60;
    return null;
}

export const CRON_JOBS: CronJob[] = (vercelConfig.crons ?? []).map((cron) => ({
    job: cron.path.split('/').filter(Boolean).pop() ?? cron.path,
    path: cron.path,
    schedule: cron.schedule,
    intervalMinutes: scheduleIntervalMinutes(cron.schedule),
}));

/**
 * Run a cron handler and record the outcome.
 *
 * Refused requests (401/403) are not recorded, so a stranger hitting the URL
 * cannot make a dead job look alive. Recording never affects the job: a failed
 * write is logged and the handler's own response goes back unchanged.
 *
 * Vercel's scheduler identifies itself with a `vercel-cron/…` user agent; that
 * is what separates a scheduled run from an admin pressing the button.
 */
export async function trackCronRun(
    job: string,
    request: Request,
    handler: () => Promise<Response>,
): Promise<Response> {
    const startedAt = Date.now();
    const trigger: CronTrigger = (request.headers.get('user-agent') ?? '').toLowerCase().startsWith('vercel-cron')
        ? 'schedule'
        : 'manual';

    let response: Response;
    let error: string | null = null;
    try {
        response = await handler();
    } catch (thrown) {
        error = thrown instanceof Error ? thrown.message : 'Cron handler threw';
        response = NextResponse.json({ error }, { status: 500 });
    }

    if (response.status === 401 || response.status === 403) return response;

    if (!error && response.status >= 400) error = `HTTP ${response.status}`;
    if (!error || error.startsWith('HTTP ')) {
        // Some jobs answer 200 and report a failure in the body (whatsapp-dispatch
        // does, on purpose), so an `error` field counts as a failure too.
        try {
            const body = await response.clone().json();
            if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
                error = (body as { error: string }).error;
            }
        } catch {
            // Not JSON; the status code is all there is.
        }
    }

    await recordCronRun({
        job,
        trigger,
        ok: !error,
        httpStatus: response.status,
        durationMs: Date.now() - startedAt,
        error,
    }).catch((e) => console.error(`[cron-runs] could not record ${job}:`, e));

    return response;
}

async function recordCronRun(run: {
    job: string;
    trigger: CronTrigger;
    ok: boolean;
    httpStatus: number;
    durationMs: number;
    error: string | null;
}): Promise<void> {
    const now = new Date();
    const status = run.ok ? 'ok' : 'error';
    const error = run.error ? run.error.slice(0, 1000) : null;

    const changes = {
        lastRunAt: now,
        lastTrigger: run.trigger,
        lastStatus: status,
        lastHttpStatus: run.httpStatus,
        lastDurationMs: run.durationMs,
        ...(run.trigger === 'schedule' ? { lastScheduledAt: now } : {}),
        // Kept after later successes, so a job that failed at 3am and recovered
        // at 3:05 still shows the 3am failure.
        ...(run.ok ? {} : { lastFailureAt: now, lastError: error }),
    };

    await db.insert(cronRuns)
        .values({ job: run.job, ...changes, runCount: 1 })
        .onConflictDoUpdate({
            target: cronRuns.job,
            set: { ...changes, runCount: sql`${cronRuns.runCount} + 1` },
        });
}

export type CronJobHealth = CronJob & {
    state: 'ok' | 'late' | 'failing' | 'never';
    lastRunAt: Date | null;
    lastTrigger: string | null;
    lastScheduledAt: Date | null;
    lastStatus: string | null;
    lastDurationMs: number | null;
    lastFailureAt: Date | null;
    lastError: string | null;
    runCount: number;
};

/**
 * Every job in vercel.json with its last run, and a verdict.
 *
 * `late` allows two missed runs plus five minutes of slack before it complains:
 * Vercel does not promise to fire on the exact minute, and one skipped tick is
 * not an outage. `never` means no scheduled run has been recorded at all —
 * expected for a few minutes after this ships, a problem after that.
 */
export async function getCronHealth(now = new Date()): Promise<{ checkedAt: Date; jobs: CronJobHealth[] }> {
    const rows = await db.select().from(cronRuns);
    const byJob = new Map(rows.map((row) => [row.job, row]));

    const jobs = CRON_JOBS.map((job): CronJobHealth => {
        const row = byJob.get(job.job);
        const lastScheduledAt = row?.lastScheduledAt ?? null;

        let state: CronJobHealth['state'] = 'ok';
        if (!lastScheduledAt) {
            state = 'never';
        } else if (
            job.intervalMinutes !== null &&
            now.getTime() - lastScheduledAt.getTime() > (job.intervalMinutes * 2 + 5) * 60 * 1000
        ) {
            state = 'late';
        } else if (row?.lastStatus === 'error') {
            state = 'failing';
        }

        return {
            ...job,
            state,
            lastRunAt: row?.lastRunAt ?? null,
            lastTrigger: row?.lastTrigger ?? null,
            lastScheduledAt,
            lastStatus: row?.lastStatus ?? null,
            lastDurationMs: row?.lastDurationMs ?? null,
            lastFailureAt: row?.lastFailureAt ?? null,
            lastError: row?.lastError ?? null,
            runCount: row?.runCount ?? 0,
        };
    });

    // Returned so callers render "5 min ago" against the same instant the
    // verdicts were computed at, instead of reading the clock a second time.
    return { checkedAt: now, jobs };
}
