-- Migration: WhatsApp campaign attribution (click tracking + booking attribution)
--
-- Hand-written, same convention as 0006: applied manually, not in
-- drizzle/meta/_journal.json. See gotcha 1 in WHATSAPP-ADMIN-PLAN.md.
--
-- Fully idempotent: safe to re-run.
--
-- psql is not installed on the build machine (gotcha 14) — apply through the
-- project's Neon Pool, which supports the multi-statement transaction below.

BEGIN;

-- ============================================
-- CAMPAIGN LINK CONFIGURATION
-- ============================================

-- Where /w/<token> sends the guest. Stored on the campaign, never taken from
-- the request: a destination read out of the query string would make this an
-- open redirect on the hotel's own domain.
ALTER TABLE "wa_campaigns" ADD COLUMN IF NOT EXISTS "destination_path" text;

-- Emitted as ?utm_campaign= on the redirect purely so the hotel's Google
-- Analytics lines up with ours. It is never the mechanism we attribute on.
ALTER TABLE "wa_campaigns" ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(100);

-- A/B: which arm this campaign row is. NULL for a normal campaign.
ALTER TABLE "wa_campaigns" ADD COLUMN IF NOT EXISTS "variant_label" varchar(20);

-- ============================================
-- PER-MESSAGE CLICK TOKEN
-- ============================================

-- 8 chars of Crockford base32. Nullable: only campaign sends whose template has
-- a dynamic URL button get one. Postgres allows many NULLs under a unique index.
ALTER TABLE "wa_messages" ADD COLUMN IF NOT EXISTS "click_token" varchar(16);

DO $$ BEGIN
    CREATE UNIQUE INDEX "wa_messages_click_token_idx" ON "wa_messages" ("click_token");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ============================================
-- CLICKS
-- ============================================

-- Every hit on /w/<token>, bots included. Bot hits are recorded rather than
-- dropped so a suspiciously high click count can be explained afterwards, and
-- excluded from every reported rate.
CREATE TABLE IF NOT EXISTS "wa_clicks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "message_id" uuid REFERENCES "wa_messages"("id") ON DELETE CASCADE,
    "campaign_id" uuid REFERENCES "wa_campaigns"("id") ON DELETE CASCADE,
    "contact_id" uuid REFERENCES "wa_contacts"("id") ON DELETE CASCADE,
    "token" varchar(16) NOT NULL,
    "is_bot" boolean DEFAULT false NOT NULL,
    "bot_reason" varchar(50),
    "user_agent" text,
    "ip_hash" varchar(64),
    "referer" text,
    "created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
    CREATE INDEX "wa_clicks_message_idx" ON "wa_clicks" ("message_id");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX "wa_clicks_campaign_idx" ON "wa_clicks" ("campaign_id", "is_bot");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX "wa_clicks_contact_idx" ON "wa_clicks" ("contact_id");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX "wa_clicks_created_idx" ON "wa_clicks" ("created_at");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ============================================
-- BOOKING ATTRIBUTION
-- ============================================

-- A join table rather than columns on `bookings`: this keeps a WhatsApp concern
-- out of the core booking schema, lets one booking carry both a click record and
-- a phone-match record so the two tiers can be compared, and means the module
-- can be removed without a bookings migration.
CREATE TABLE IF NOT EXISTS "wa_booking_attribution" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "campaign_id" uuid REFERENCES "wa_campaigns"("id") ON DELETE SET NULL,
    "message_id" uuid REFERENCES "wa_messages"("id") ON DELETE SET NULL,
    "contact_id" uuid REFERENCES "wa_contacts"("id") ON DELETE SET NULL,
    "click_id" uuid REFERENCES "wa_clicks"("id") ON DELETE SET NULL,
    -- 'click' = deterministic, the guest followed our link.
    -- 'phone_match' = probabilistic, they were messaged and then booked with a
    -- matching number without clicking. Never summed with 'click' unlabelled.
    "kind" varchar(20) NOT NULL,
    -- Snapshot of bookings.total_amount in paise at attribution time, so a later
    -- cancellation or amendment cannot silently rewrite historic campaign revenue.
    "revenue" integer DEFAULT 0,
    -- Hours between the send and the booking. Useful for choosing the window.
    "hours_to_book" integer,
    "created_at" timestamp DEFAULT now()
);

-- One row per (booking, kind): a booking can hold at most one click attribution
-- and one phone-match attribution, and re-running capture is a no-op.
DO $$ BEGIN
    CREATE UNIQUE INDEX "wa_booking_attribution_booking_kind_idx"
        ON "wa_booking_attribution" ("booking_id", "kind");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX "wa_booking_attribution_campaign_idx"
        ON "wa_booking_attribution" ("campaign_id", "kind");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE INDEX "wa_booking_attribution_created_idx"
        ON "wa_booking_attribution" ("created_at");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ============================================
-- ATTRIBUTION WINDOWS (settings singleton)
-- ============================================

-- 30 days for a click: a hotel stay is deliberated over, not impulse-bought.
-- 7 days for a phone match, deliberately tighter — a loose window on a
-- probabilistic signal manufactures attribution out of coincidence.
ALTER TABLE "wa_settings" ADD COLUMN IF NOT EXISTS "click_attribution_days" integer DEFAULT 30;
ALTER TABLE "wa_settings" ADD COLUMN IF NOT EXISTS "phone_attribution_days" integer DEFAULT 7;
ALTER TABLE "wa_settings" ADD COLUMN IF NOT EXISTS "phone_attribution_enabled" boolean DEFAULT true;

COMMIT;
