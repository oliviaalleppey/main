-- Record the GST rate each add-on line was sold at.
--
-- Until now the charge hard-coded 18% while the admin's Tax % column was only
-- read by the screens, so changing that column moved what a booking displayed
-- without moving what it collected. The rate now travels with the line, the
-- way the price already does, and editing an add-on leaves old bookings alone.
--
-- Existing rows were all charged 18%, which is also the column default, so the
-- backfill is what ADD COLUMN ... DEFAULT already writes. Idempotent.

ALTER TABLE booking_add_ons
    ADD COLUMN IF NOT EXISTS tax_rate integer DEFAULT 18;

UPDATE booking_add_ons SET tax_rate = 18 WHERE tax_rate IS NULL;
