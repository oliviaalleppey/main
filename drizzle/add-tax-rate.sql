-- Migration: Add tax_rate column to room_types
-- Default: 12 (12% GST - standard for hotel rooms ≤ ₹7,500/night in India)
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS tax_rate integer NOT NULL DEFAULT 12;
