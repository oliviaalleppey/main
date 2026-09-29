-- ============================================
-- CRON OVERDUE ALERTS
-- ============================================
--
-- When a scheduled job goes overdue, the IT inbox is emailed once, and once
-- more when it recovers (lib/services/cron-runs.ts, alertOnOverdueJobs). This
-- column is what makes it "once": set when the overdue alert is sent, cleared
-- when the recovery alert is. Each is claimed with a conditional UPDATE, so two
-- jobs noticing at the same moment cannot both send.
--
-- Hand-written and idempotent; apply with:
--   psql "$DATABASE_URL" -f drizzle/0011_cron_runs_overdue_alert.sql

ALTER TABLE "cron_runs" ADD COLUMN IF NOT EXISTS "overdue_alerted_at" timestamp;
