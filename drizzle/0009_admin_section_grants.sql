-- ============================================
-- STAFF ACCESS TO THE ADMIN PANEL
-- ============================================
--
-- Adds the 'staff' role and the per-person section grants behind it.
--
-- Hand-written and idempotent: `drizzle-kit generate` cannot be trusted against
-- this project's snapshot history, so this file is applied directly and is safe
-- to re-run.
--
-- Apply with:
--   psql "$DATABASE_URL" -f drizzle/0009_admin_section_grants.sql

-- 'staff' carries no permissions on its own; it means "consult
-- admin_section_grants for this user". ADD VALUE IF NOT EXISTS makes the re-run
-- safe. It must not be used by any statement in the same transaction, which is
-- why nothing below inserts a staff row.
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'staff';

CREATE TABLE IF NOT EXISTS "admin_section_grants" (
    "user_id"    text         NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "section"    varchar(64)  NOT NULL,
    "can_write"  boolean      NOT NULL DEFAULT false,
    "granted_by" varchar(255),
    "granted_at" timestamp    DEFAULT now(),
    PRIMARY KEY ("user_id", "section")
);

-- Every admin request loads one staff member's grants; this is the only lookup
-- pattern, and the primary key already leads with user_id. The extra index is on
-- section instead, for the "who can see bookings?" direction used by /admin/staff.
CREATE INDEX IF NOT EXISTS "admin_section_grants_section_idx"
    ON "admin_section_grants" ("section");
