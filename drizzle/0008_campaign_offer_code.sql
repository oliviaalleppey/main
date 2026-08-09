-- Migration: attach a promo code to a WhatsApp campaign
--
-- Hand-written and idempotent, same convention as 0006 and 0007. Applied through
-- the project's Neon Pool; psql is not installed (gotcha 14).

BEGIN;

-- The promo code a campaign advertises. When a guest arrives through
-- /w/<token>, the click cookie identifies the campaign, and this is the code
-- applied to their booking session automatically.
--
-- It is a plain varchar rather than a foreign key to `offers` because the code
-- is what the guest sees in the message and types if the link is forwarded; the
-- offer row it resolves to is looked up at redemption time, so a campaign whose
-- offer is later deactivated degrades to no discount rather than a broken FK.
ALTER TABLE "wa_campaigns" ADD COLUMN IF NOT EXISTS "offer_code" varchar(50);

COMMIT;
