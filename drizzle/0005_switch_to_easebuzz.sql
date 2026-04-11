-- Migration: Replace Omniware columns with Easebuzz columns in payments table
-- This migration renames the payment gateway fields from Omniware to Easebuzz

-- Drop the old columns
ALTER TABLE "payments" DROP COLUMN IF EXISTS "omniware_order_id";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "omniware_transaction_id";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "omniware_hash";

-- Add new columns for Easebuzz
ALTER TABLE "payments" ADD COLUMN "easebuzz_order_id" varchar(255);
ALTER TABLE "payments" ADD COLUMN "easebuzz_transaction_id" varchar(255);
ALTER TABLE "payments" ADD COLUMN "easebuzz_hash" varchar(255);
