import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
    try {
        // Create the housekeeping_status enum if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "public"."housekeeping_status" AS ENUM('clean', 'dirty', 'touch_up', 'inspect', 'out_of_service');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add missing columns to rooms table
        await db.execute(sql`
            ALTER TABLE "rooms" 
            ADD COLUMN IF NOT EXISTS "housekeeping_status" "housekeeping_status" DEFAULT 'clean',
            ADD COLUMN IF NOT EXISTS "last_cleaned_at" timestamp,
            ADD COLUMN IF NOT EXISTS "last_inspected_at" timestamp;
        `);

        // Create cancellation_policy enum if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict', 'non_refundable');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create channel_type enum if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "public"."channel_type" AS ENUM('direct', 'ota', 'gds', 'agent', 'walk_in');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create payment_mode enum if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "public"."payment_mode" AS ENUM('hotel_collect', 'channel_collect', 'prepaid');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create vip_level enum if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "public"."vip_level" AS ENUM('regular', 'silver', 'gold', 'platinum', 'diamond');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create rate_plans table if it doesn't exist
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "rate_plans" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "name" varchar(255) NOT NULL,
                "code" varchar(50) NOT NULL UNIQUE,
                "room_type_id" uuid NOT NULL REFERENCES "room_types"("id"),
                "description" text,
                "base_price_modifier" integer DEFAULT 100,
                "min_los" integer DEFAULT 1,
                "max_los" integer,
                "includes_breakfast" boolean DEFAULT false,
                "includes_airport_transfer" boolean DEFAULT false,
                "includes_late_checkout" boolean DEFAULT false,
                "includes_spa" boolean DEFAULT false,
                "includes_dinner" boolean DEFAULT false,
                "inclusions_description" text,
                "cancellation_policy" "cancellation_policy" DEFAULT 'moderate',
                "cancellation_days" integer DEFAULT 1,
                "deposit_required" integer DEFAULT 0,
                "deposit_amount" integer DEFAULT 0,
                "is_active" boolean DEFAULT true,
                "bookable_from" date,
                "bookable_to" date,
                "is_default" boolean DEFAULT false,
                "is_promotional" boolean DEFAULT false,
                "display_order" integer DEFAULT 0,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now()
            );
        `);

        // Create booking_channels table if it doesn't exist
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "booking_channels" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "name" varchar(100) NOT NULL,
                "code" varchar(50) NOT NULL UNIQUE,
                "type" "channel_type" DEFAULT 'direct',
                "commission_type" varchar(20),
                "commission_value" integer DEFAULT 0,
                "is_active" boolean DEFAULT true,
                "auto_confirm" boolean DEFAULT true,
                "payment_mode" "payment_mode" DEFAULT 'hotel_collect',
                "api_endpoint" text,
                "api_key" text,
                "sync_inventory" boolean DEFAULT true,
                "sync_rates" boolean DEFAULT true,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now()
            );
        `);

        // Create guest_profiles table if it doesn't exist
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "guest_profiles" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "email" varchar(255) NOT NULL UNIQUE,
                "first_name" varchar(100),
                "last_name" varchar(100),
                "phone" varchar(20),
                "alternate_phone" varchar(20),
                "address" text,
                "city" varchar(100),
                "state" varchar(100),
                "country" varchar(100),
                "pincode" varchar(20),
                "date_of_birth" date,
                "anniversary" date,
                "company_name" varchar(255),
                "gst_number" varchar(50),
                "preferred_room_type_id" uuid REFERENCES "room_types"("id"),
                "preferred_floor" integer,
                "bed_preference" varchar(50),
                "smoking_preference" varchar(20),
                "dietary_restrictions" text,
                "pillow_preference" varchar(100),
                "temperature_preference" varchar(50),
                "special_requests" text,
                "total_stays" integer DEFAULT 0,
                "total_room_nights" integer DEFAULT 0,
                "total_spent" integer DEFAULT 0,
                "first_stay_at" timestamp,
                "last_stay_at" timestamp,
                "is_vip" boolean DEFAULT false,
                "vip_level" "vip_level" DEFAULT 'regular',
                "vip_since" timestamp,
                "marketing_opt_in" boolean DEFAULT false,
                "communication_preference" varchar(50),
                "internal_notes" text,
                "guest_notes" text,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now()
            );
        `);

        // Add missing columns to bookings table
        await db.execute(sql`
            DO $$ BEGIN
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guest_profile_id" uuid REFERENCES "guest_profiles"("id");
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "rate_plan_id" uuid REFERENCES "rate_plans"("id");
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "channel_id" uuid REFERENCES "booking_channels"("id");
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "channel_booking_id" varchar(100);
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "base_amount" integer DEFAULT 0;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "discount_reason" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "commission_amount" integer DEFAULT 0;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "net_amount" integer DEFAULT 0;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "offer_id" uuid REFERENCES "offers"("id");
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" "payment_status" DEFAULT 'pending';
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guest_preferences" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "is_vip_booking" boolean DEFAULT false;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "vip_benefits_applied" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "created_by" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "modified_by" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "confirmed_by" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_by" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "check_in_at" timestamp;
                ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "check_out_at" timestamp;
            EXCEPTION
                WHEN duplicate_column THEN null;
            END $$;
        `);

        // Create booking_history table if it doesn't exist
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "booking_history" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "booking_id" uuid NOT NULL REFERENCES "bookings"("id"),
                "action" varchar(50) NOT NULL,
                "changes" json,
                "performed_by" text,
                "performed_by_name" varchar(255),
                "notes" text,
                "ip_address" varchar(50),
                "user_agent" text,
                "created_at" timestamp DEFAULT now()
            );
        `);

        // Add rate_plan_id to booking_items if it doesn't exist
        await db.execute(sql`
            DO $$ BEGIN
                ALTER TABLE "booking_items" ADD COLUMN IF NOT EXISTS "rate_plan_id" uuid REFERENCES "rate_plans"("id");
            EXCEPTION
                WHEN duplicate_column THEN null;
            END $$;
        `);

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
