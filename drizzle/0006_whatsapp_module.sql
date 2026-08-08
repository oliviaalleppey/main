-- Migration: WhatsApp Cloud API broadcast & guest messaging module
--
-- Hand-written to match this repo's convention (see 0005_switch_to_easebuzz.sql
-- and add-tax-rate.sql, which are applied manually and are not in
-- drizzle/meta/_journal.json). drizzle-kit generate cannot be used here because
-- the snapshot has pre-existing drift from the omniware -> easebuzz rename.
--
-- Fully idempotent: safe to re-run.
--
-- Apply with:  psql "$DATABASE_URL" -f drizzle/0006_whatsapp_module.sql

BEGIN;

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE "wa_consent_status" AS ENUM ('pending', 'opted_in', 'opted_out', 'suppressed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_contact_source" AS ENUM ('booking', 'guest_profile', 'inquiry', 'import', 'inbound', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_campaign_status" AS ENUM ('draft', 'pending_approval', 'scheduled', 'sending', 'paused', 'completed', 'halted', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_message_status" AS ENUM ('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_template_status" AS ENUM ('draft', 'internal_review', 'pending_meta', 'approved', 'rejected', 'paused', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_template_category" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "wa_direction" AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- CONTACTS & CONSENT
-- ============================================

CREATE TABLE IF NOT EXISTS "wa_contacts" (
    "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "phone"                 varchar(20) NOT NULL UNIQUE,
    "name"                  varchar(255),
    "email"                 varchar(255),
    "locale"                varchar(10) DEFAULT 'en',
    "source"                "wa_contact_source" NOT NULL DEFAULT 'import',
    "import_id"             uuid,
    "guest_profile_id"      uuid REFERENCES "guest_profiles"("id") ON DELETE SET NULL,
    "consent_status"        "wa_consent_status" NOT NULL DEFAULT 'pending',
    "consent_source"        varchar(255),
    "consent_at"            timestamp,
    "consent_proof_url"     text,
    "provenance_note"       text,
    "opted_out_at"          timestamp,
    "opt_out_method"        varchar(50),
    "last_inbound_at"       timestamp,
    "last_outbound_at"      timestamp,
    "marketing_sent_count"  integer DEFAULT 0,
    "marketing_sent_30d"    integer DEFAULT 0,
    "failure_count"         integer DEFAULT 0,
    "is_whatsapp_user"      boolean,
    "tags"                  json DEFAULT '[]'::json,
    "notes"                 text,
    "created_at"            timestamp DEFAULT now(),
    "updated_at"            timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_contacts_consent_idx"       ON "wa_contacts" ("consent_status");
CREATE INDEX IF NOT EXISTS "wa_contacts_source_idx"        ON "wa_contacts" ("source");
CREATE INDEX IF NOT EXISTS "wa_contacts_guest_profile_idx" ON "wa_contacts" ("guest_profile_id");
CREATE INDEX IF NOT EXISTS "wa_contacts_last_inbound_idx"  ON "wa_contacts" ("last_inbound_at");

-- Append-only consent ledger. This is the proof of consent; never UPDATE or DELETE.
CREATE TABLE IF NOT EXISTS "wa_consent_events" (
    "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "contact_id"   uuid NOT NULL REFERENCES "wa_contacts"("id") ON DELETE CASCADE,
    "phone"        varchar(20) NOT NULL,
    "from_status"  "wa_consent_status",
    "to_status"    "wa_consent_status" NOT NULL,
    "reason"       text,
    "source"       varchar(100),
    "actor_id"     uuid,
    "actor_email"  varchar(255),
    "ip"           varchar(64),
    "created_at"   timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_consent_events_contact_idx" ON "wa_consent_events" ("contact_id");
CREATE INDEX IF NOT EXISTS "wa_consent_events_phone_idx"   ON "wa_consent_events" ("phone");

-- Permanent do-not-contact. Survives re-imports.
CREATE TABLE IF NOT EXISTS "wa_suppression" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "phone"      varchar(20) NOT NULL UNIQUE,
    "reason"     varchar(255),
    "added_by"   uuid,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wa_imports" (
    "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "filename"             varchar(255) NOT NULL,
    "blob_url"             text,
    "row_count"            integer DEFAULT 0,
    "imported_count"       integer DEFAULT 0,
    "updated_count"        integer DEFAULT 0,
    "rejected_count"       integer DEFAULT 0,
    "duplicate_count"      integer DEFAULT 0,
    "consent_declaration"  json,
    "provenance_note"      text NOT NULL,
    "assigned_status"      "wa_consent_status" NOT NULL DEFAULT 'pending',
    "column_mapping"       json,
    "error_report_url"     text,
    "actor_id"             uuid,
    "actor_email"          varchar(255),
    "created_at"           timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wa_audiences" (
    "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"               varchar(255) NOT NULL,
    "description"        text,
    "type"               varchar(20) NOT NULL DEFAULT 'dynamic',
    "filter"             json DEFAULT '{}'::json,
    "contact_ids"        json,
    "last_count"         integer DEFAULT 0,
    "last_evaluated_at"  timestamp,
    "is_system"          boolean DEFAULT false,
    "created_by"         uuid,
    "created_at"         timestamp DEFAULT now(),
    "updated_at"         timestamp DEFAULT now()
);

-- ============================================
-- TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS "wa_templates" (
    "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"                 varchar(255) NOT NULL,
    "language"             varchar(10) NOT NULL DEFAULT 'en',
    "category"             "wa_template_category" NOT NULL DEFAULT 'MARKETING',
    "status"               "wa_template_status" NOT NULL DEFAULT 'draft',
    "meta_template_id"     varchar(100),
    "components"           json DEFAULT '[]'::json,
    "body_text"            text,
    "header_type"          varchar(20),
    "header_text"          text,
    "footer_text"          text,
    "buttons"              json DEFAULT '[]'::json,
    "variable_count"       integer DEFAULT 0,
    "variable_map"         json DEFAULT '{}'::json,
    "variable_fallbacks"   json DEFAULT '{}'::json,
    "rejection_reason"     text,
    "quality_score"        varchar(20),
    "submitted_by"         uuid,
    "approved_by"          uuid,
    "submitted_at"         timestamp,
    "synced_at"            timestamp,
    "sent_count"           integer DEFAULT 0,
    "created_at"           timestamp DEFAULT now(),
    "updated_at"           timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "wa_templates_name_lang_idx" ON "wa_templates" ("name", "language");
CREATE INDEX IF NOT EXISTS "wa_templates_status_idx"           ON "wa_templates" ("status");

-- ============================================
-- CAMPAIGNS & THE SEND QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS "wa_campaigns" (
    "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"              varchar(255) NOT NULL,
    "description"       text,
    "template_id"       uuid REFERENCES "wa_templates"("id"),
    "audience_id"       uuid REFERENCES "wa_audiences"("id"),
    "status"            "wa_campaign_status" NOT NULL DEFAULT 'draft',
    "daily_cap"         integer,
    "throttle_per_min"  integer DEFAULT 60,
    "scheduled_at"      timestamp,
    "started_at"        timestamp,
    "completed_at"      timestamp,
    "total_count"       integer DEFAULT 0,
    "queued_count"      integer DEFAULT 0,
    "sent_count"        integer DEFAULT 0,
    "delivered_count"   integer DEFAULT 0,
    "read_count"        integer DEFAULT 0,
    "failed_count"      integer DEFAULT 0,
    "skipped_count"     integer DEFAULT 0,
    "opted_out_count"   integer DEFAULT 0,
    "estimated_cost"    integer DEFAULT 0,
    "actual_cost"       integer DEFAULT 0,
    "static_variables"  json DEFAULT '{}'::json,
    "created_by"        uuid,
    "approved_by"       uuid,
    "halt_reason"       text,
    "variant_of"        uuid,
    "created_at"        timestamp DEFAULT now(),
    "updated_at"        timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_campaigns_status_idx"    ON "wa_campaigns" ("status");
CREATE INDEX IF NOT EXISTS "wa_campaigns_scheduled_idx" ON "wa_campaigns" ("scheduled_at");

-- The outbound queue AND the permanent audit log.
CREATE TABLE IF NOT EXISTS "wa_messages" (
    "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "campaign_id"        uuid REFERENCES "wa_campaigns"("id") ON DELETE CASCADE,
    "contact_id"         uuid NOT NULL REFERENCES "wa_contacts"("id") ON DELETE CASCADE,
    "template_id"        uuid REFERENCES "wa_templates"("id"),
    "automation_key"     varchar(100),
    "direction"          "wa_direction" NOT NULL DEFAULT 'outbound',
    "status"             "wa_message_status" NOT NULL DEFAULT 'queued',
    "wamid"              varchar(128) UNIQUE,
    "idempotency_key"    varchar(128) NOT NULL UNIQUE,
    "conversation_id"    varchar(128),
    "variables"          json DEFAULT '{}'::json,
    "rendered_body"      text,
    "attempts"           integer DEFAULT 0,
    "error_code"         integer,
    "error_detail"       text,
    "skip_reason"        varchar(100),
    "cost"               integer DEFAULT 0,
    "pricing_category"   varchar(30),
    "queued_at"          timestamp DEFAULT now(),
    "send_after"         timestamp,
    "sent_at"            timestamp,
    "delivered_at"       timestamp,
    "read_at"            timestamp,
    "failed_at"          timestamp
);

-- The dispatcher's claim query: WHERE status = 'queued' AND send_after <= now()
CREATE INDEX IF NOT EXISTS "wa_messages_dispatch_idx"        ON "wa_messages" ("status", "send_after");
CREATE INDEX IF NOT EXISTS "wa_messages_campaign_status_idx" ON "wa_messages" ("campaign_id", "status");
CREATE INDEX IF NOT EXISTS "wa_messages_contact_idx"         ON "wa_messages" ("contact_id");
CREATE INDEX IF NOT EXISTS "wa_messages_sent_at_idx"         ON "wa_messages" ("sent_at");

-- ============================================
-- TWO-WAY INBOX
-- ============================================

CREATE TABLE IF NOT EXISTS "wa_inbox_threads" (
    "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "contact_id"          uuid NOT NULL UNIQUE REFERENCES "wa_contacts"("id") ON DELETE CASCADE,
    "status"              varchar(20) NOT NULL DEFAULT 'open',
    "assigned_to"         uuid,
    "window_expires_at"   timestamp,
    "last_message_at"     timestamp,
    "last_inbound_at"     timestamp,
    "unread_count"        integer DEFAULT 0,
    "labels"              json DEFAULT '[]'::json,
    "internal_notes"      text,
    "created_at"          timestamp DEFAULT now(),
    "updated_at"          timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_inbox_threads_status_idx"       ON "wa_inbox_threads" ("status");
CREATE INDEX IF NOT EXISTS "wa_inbox_threads_last_message_idx" ON "wa_inbox_threads" ("last_message_at");

CREATE TABLE IF NOT EXISTS "wa_inbox_messages" (
    "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "thread_id"         uuid NOT NULL REFERENCES "wa_inbox_threads"("id") ON DELETE CASCADE,
    "direction"         "wa_direction" NOT NULL,
    "type"              varchar(20) NOT NULL DEFAULT 'text',
    "body"              text,
    "media_url"         text,
    "media_mime_type"   varchar(100),
    "wamid"             varchar(128) UNIQUE,
    "status"            "wa_message_status" DEFAULT 'sent',
    "sent_by"           uuid,
    "error_detail"      text,
    "created_at"        timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_inbox_messages_thread_idx" ON "wa_inbox_messages" ("thread_id", "created_at");

CREATE TABLE IF NOT EXISTS "wa_canned_replies" (
    "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title"       varchar(255) NOT NULL,
    "body"        text NOT NULL,
    "category"    varchar(100),
    "sort_order"  integer DEFAULT 0,
    "is_active"   boolean DEFAULT true,
    "created_at"  timestamp DEFAULT now()
);

-- ============================================
-- AUTOMATIONS, OPS, AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS "wa_automations" (
    "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "key"            varchar(100) NOT NULL UNIQUE,
    "label"          varchar(255) NOT NULL,
    "description"    text,
    "enabled"        boolean DEFAULT false,
    "template_id"    uuid REFERENCES "wa_templates"("id"),
    "offset_hours"   integer DEFAULT 0,
    "config"         json DEFAULT '{}'::json,
    "last_fired_at"  timestamp,
    "fire_count"     integer DEFAULT 0,
    "created_at"     timestamp DEFAULT now(),
    "updated_at"     timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wa_events" (
    "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_type"        varchar(50) NOT NULL,
    "wamid"             varchar(128),
    "payload"           json,
    "processed"         boolean DEFAULT false,
    "processing_error"  text,
    "received_at"       timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_events_wamid_idx"    ON "wa_events" ("wamid");
CREATE INDEX IF NOT EXISTS "wa_events_received_idx" ON "wa_events" ("received_at");

-- Singleton config row (key = 'default'). All money in paise.
CREATE TABLE IF NOT EXISTS "wa_settings" (
    "key"                     varchar(50) PRIMARY KEY DEFAULT 'default',
    "enabled"                 boolean DEFAULT false,
    "test_mode"               boolean DEFAULT true,
    "test_numbers"            json DEFAULT '[]'::json,
    "daily_cap"               integer DEFAULT 250,
    "throttle_per_min"        integer DEFAULT 60,
    "batch_size"              integer DEFAULT 100,
    "max_concurrency"         integer DEFAULT 10,
    "max_attempts"            integer DEFAULT 3,
    "quiet_hours_enabled"     boolean DEFAULT true,
    "quiet_hours_start"       integer DEFAULT 21,
    "quiet_hours_end"         integer DEFAULT 9,
    "timezone"                varchar(50) DEFAULT 'Asia/Kolkata',
    "frequency_cap_per_30d"   integer DEFAULT 2,
    "monthly_budget"          integer DEFAULT 2500000,
    "budget_warn_percent"     integer DEFAULT 80,
    "stop_opt_out_rate_bp"    integer DEFAULT 300,
    "stop_failure_rate_bp"    integer DEFAULT 1000,
    "stop_min_sample"         integer DEFAULT 200,
    "halt_on_red_quality"     boolean DEFAULT true,
    "approval_threshold"      integer DEFAULT 1000,
    "quality_rating"          varchar(20),
    "messaging_tier"          varchar(50),
    "token_expires_at"        timestamp,
    "last_webhook_at"         timestamp,
    "last_sync_at"            timestamp,
    "last_health_error"       text,
    "updated_at"              timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "wa_audit_log" (
    "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "actor_id"     uuid,
    "actor_email"  varchar(255),
    "action"       varchar(100) NOT NULL,
    "entity_type"  varchar(50),
    "entity_id"    varchar(100),
    "before"       json,
    "after"        json,
    "ip"           varchar(64),
    "created_at"   timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wa_audit_log_created_idx" ON "wa_audit_log" ("created_at");
CREATE INDEX IF NOT EXISTS "wa_audit_log_actor_idx"   ON "wa_audit_log" ("actor_id");

-- ============================================
-- SEED
-- ============================================

-- The settings singleton. Starts DISABLED and in TEST MODE — sending is opt-in.
INSERT INTO "wa_settings" ("key") VALUES ('default')
ON CONFLICT ("key") DO NOTHING;

-- Automation definitions, all disabled until a template is attached.
INSERT INTO "wa_automations" ("key", "label", "description", "offset_hours") VALUES
    ('booking_confirmation', 'Booking confirmation',      'Sent when a booking reaches confirmed status.',        0),
    ('payment_failed',       'Payment failure recovery',  'Sent when a payment attempt fails.',                   0),
    ('prearrival',           'Pre-arrival reminder',      'Sent one day before check-in.',                      -24),
    ('checkout_review',      'Check-out thank you',       'Sent on the day of check-out, asks for a review.',     2),
    ('booking_cancelled',    'Booking cancelled',         'Sent when a booking is cancelled.',                    0),
    ('event_inquiry_ack',    'Event enquiry acknowledgement', 'Sent when an event enquiry is submitted.',         0),
    ('birthday_greeting',    'Birthday greeting',         'Marketing category — requires opt-in.',                0)
ON CONFLICT ("key") DO NOTHING;

COMMIT;
