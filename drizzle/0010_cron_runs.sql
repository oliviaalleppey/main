-- ============================================
-- CRON RUN TRACKING
-- ============================================
--
-- One row per scheduled job (the path's last segment, e.g. 'booking-watchdog'),
-- upserted by lib/services/cron-runs.ts after every authorised run. The admin
-- dashboard reads it to show when each job last ran and to flag one that has
-- stopped: none of the jobs otherwise leaves a trace on a run with no work.
--
-- Hand-written and idempotent: `drizzle-kit generate` cannot be trusted against
-- this project's snapshot history, so this file is applied directly and is safe
-- to re-run.
--
-- Apply with:
--   psql "$DATABASE_URL" -f drizzle/0010_cron_runs.sql

CREATE TABLE IF NOT EXISTS "cron_runs" (
    "job"               varchar(64)  PRIMARY KEY,
    -- Any authorised run: Vercel's scheduler or an admin triggering it by hand.
    "last_run_at"       timestamp    NOT NULL,
    "last_trigger"      varchar(16)  NOT NULL,
    -- Runs from Vercel's scheduler only. This is the one that proves the
    -- schedule itself is alive; a manual trigger must not mask a dead cron.
    "last_scheduled_at" timestamp,
    "last_status"       varchar(16)  NOT NULL,
    "last_http_status"  integer,
    "last_duration_ms"  integer,
    -- The most recent failure, kept after later successes so it stays visible.
    "last_failure_at"   timestamp,
    "last_error"        text,
    "run_count"         integer      NOT NULL DEFAULT 0
);
