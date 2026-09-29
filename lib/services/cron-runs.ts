import { NextResponse } from 'next/server';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { cronRuns } from '@/lib/db/schema';
import { sendCronAlert } from './email';
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

    // Every live job keeps an eye on the others, so any one still running can
    // report one that has stopped.
    await alertOnOverdueJobs().catch((e) => console.error('[cron-runs] overdue check failed:', e));

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
    overdueAlertedAt: Date | null;
};

type CronRunRow = typeof cronRuns.$inferSelect;

/**
 * One job's verdict from its last recorded run. Pure, so it can be tested.
 *
 * `late` allows two missed runs plus five minutes of slack before it complains:
 * Vercel does not promise to fire on the exact minute, and one skipped tick is
 * not an outage. `never` means no scheduled run has been recorded at all —
 * expected for a few minutes after this ships, a problem after that. A job with
 * a schedule we cannot parse is never called late.
 */
export function judgeCronJob(
    job: CronJob,
    row: Pick<CronRunRow, 'lastScheduledAt' | 'lastStatus'> & Partial<CronRunRow> | undefined,
    now: Date,
): CronJobHealth {
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
        overdueAlertedAt: row?.overdueAlertedAt ?? null,
    };
}

/**
 * Every job in vercel.json with its last run, and a verdict (see judgeCronJob).
 */
export async function getCronHealth(now = new Date()): Promise<{ checkedAt: Date; jobs: CronJobHealth[] }> {
    const rows = await db.select().from(cronRuns);
    const byJob = new Map(rows.map((row) => [row.job, row]));

    const jobs = CRON_JOBS.map((job) => judgeCronJob(job, byJob.get(job.job), now));

    // Returned so callers render "5 min ago" against the same instant the
    // verdicts were computed at, instead of reading the clock a second time.
    return { checkedAt: now, jobs };
}

/**
 * Which jobs to report. Pure, so it can be tested.
 *
 * Overdue and not yet reported: alert. Reported, and now running on schedule
 * again: say it recovered. A job that has never run from the scheduler is left
 * alone — that is a fresh install, not an outage — and a job that is running
 * but failing is shown on the dashboard rather than emailed.
 */
export function planCronAlerts(jobs: CronJobHealth[]): { overdue: CronJobHealth[]; recovered: CronJobHealth[] } {
    return {
        overdue: jobs.filter((job) => job.state === 'late' && !job.overdueAlertedAt),
        recovered: jobs.filter((job) => job.overdueAlertedAt && (job.state === 'ok' || job.state === 'failing')),
    };
}

function describeForAlert(job: CronJobHealth) {
    const every = job.intervalMinutes === null ? job.schedule
        : job.intervalMinutes < 60 ? `every ${job.intervalMinutes} min`
            : job.intervalMinutes === 60 ? 'hourly'
                : job.intervalMinutes === 24 * 60 ? 'daily' : `every ${job.intervalMinutes} min`;
    const lastScheduledRun = job.lastScheduledAt
        ? `${job.lastScheduledAt.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
        })} IST`
        : 'never';
    return { job: job.job, every, lastScheduledRun };
}

/**
 * Email IT once when a job goes overdue and once when it recovers.
 *
 * Each alert is claimed with a conditional UPDATE on overdue_alerted_at before
 * it is sent, so two jobs running this at the same moment cannot both send. If
 * the email then fails, the claim is handed back so the next run tries again.
 */
export async function alertOnOverdueJobs(now = new Date()): Promise<{ overdue: string[]; recovered: string[] }> {
    const { jobs } = await getCronHealth(now);
    const plan = planCronAlerts(jobs);

    const overdue: CronJobHealth[] = [];
    for (const job of plan.overdue) {
        const claimed = await db.update(cronRuns)
            .set({ overdueAlertedAt: now })
            .where(and(eq(cronRuns.job, job.job), isNull(cronRuns.overdueAlertedAt)))
            .returning({ job: cronRuns.job });
        if (claimed.length) overdue.push(job);
    }

    const recovered: CronJobHealth[] = [];
    for (const job of plan.recovered) {
        const claimed = await db.update(cronRuns)
            .set({ overdueAlertedAt: null })
            .where(and(eq(cronRuns.job, job.job), isNotNull(cronRuns.overdueAlertedAt)))
            .returning({ job: cronRuns.job });
        if (claimed.length) recovered.push(job);
    }

    if (overdue.length) {
        try {
            await sendCronAlert({ kind: 'overdue', jobs: overdue.map(describeForAlert) });
        } catch (error) {
            // Unclaim, so the next run retries rather than the outage going unreported.
            for (const job of overdue) {
                await db.update(cronRuns).set({ overdueAlertedAt: null }).where(eq(cronRuns.job, job.job));
            }
            throw error;
        }
    }
    if (recovered.length) {
        await sendCronAlert({ kind: 'recovered', jobs: recovered.map(describeForAlert) })
            .catch((error) => console.error('[cron-runs] recovery alert failed:', error));
    }

    return { overdue: overdue.map((job) => job.job), recovered: recovered.map((job) => job.job) };
}
