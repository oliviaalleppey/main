-- Add missing columns to rooms table
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "housekeeping_status" text DEFAULT 'clean';
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "last_cleaned_at" timestamp;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "last_inspected_at" timestamp;

-- Create the housekeeping_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."housekeeping_status" AS ENUM('clean', 'dirty', 'touch_up', 'inspect', 'out_of_service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the column to use the enum type
ALTER TABLE "rooms" ALTER COLUMN "housekeeping_status" TYPE "housekeeping_status" USING "housekeeping_status"::"housekeeping_status";
