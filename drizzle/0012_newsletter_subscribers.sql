-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================
--
-- The footer's "Join our mailing list" form posted to /api/newsletter, which
-- logged the address and returned success — nothing was stored, so every
-- subscriber since launch was told they had signed up and then lost. This is
-- where they go now. One row per address (lower-cased); a repeat sign-up is a
-- no-op rather than an error.
--
-- Hand-written and idempotent; apply with:
--   psql "$DATABASE_URL" -f drizzle/0012_newsletter_subscribers.sql

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
    "id"               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"            varchar(254)  NOT NULL UNIQUE,
    "source"           varchar(64)   NOT NULL DEFAULT 'website_footer',
    "created_at"       timestamp     NOT NULL DEFAULT now(),
    "unsubscribed_at"  timestamp
);
