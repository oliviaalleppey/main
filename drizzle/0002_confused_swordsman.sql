CREATE TYPE "public"."seating_style" AS ENUM('theatre', 'cluster', 'classroom', 'u_shape', 'boardroom', 'banquet', 'cocktail');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('ballroom', 'meeting_room', 'outdoor', 'boardroom', 'conference_hall');--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'initiated';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'pending_payment';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'payment_success';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'booking_requested';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'expired';--> statement-breakpoint
CREATE TABLE "booking_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"previous_state" varchar(50),
	"new_state" varchar(50) NOT NULL,
	"reason" text,
	"actor" varchar(255),
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"confirmation_number" varchar(100) NOT NULL,
	"axis_rooms_booking_id" varchar(100),
	"voucher_url" text,
	"api_response" json,
	"confirmed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"guest_type" varchar(20) DEFAULT 'adult',
	"title" varchar(20),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"age" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"action" varchar(255) NOT NULL,
	"endpoint" varchar(255),
	"request_payload" json,
	"response_payload" json,
	"response_hash" varchar(64),
	"status_code" integer,
	"duration_ms" integer,
	"error_message" text,
	"level" varchar(20) DEFAULT 'info',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_processing_lock" (
	"booking_id" uuid PRIMARY KEY NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"processed_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "booking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"step" varchar(50) DEFAULT 'search',
	"check_in" date,
	"check_out" date,
	"adults" integer DEFAULT 1,
	"children" integer DEFAULT 0,
	"selected_room_type_id" uuid,
	"selected_rate_plan_id" uuid,
	"cart_data" json,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "booking_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"method" varchar(20) NOT NULL,
	"path" varchar(255) NOT NULL,
	"params_hash" varchar(255),
	"response_data" json,
	"status_code" integer,
	"locked_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "idempotency_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "inventory_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"room_id" uuid,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"locked_price" integer,
	"expires_at" timestamp NOT NULL,
	"session_id" varchar(255),
	"booking_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_session_id" uuid,
	"room_type_id" uuid,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"available_count" integer NOT NULL,
	"snapshot_data" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" varchar(50) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"hits" integer DEFAULT 1,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_session_id" uuid,
	"room_type_id" uuid,
	"rate_plan_id" uuid,
	"total_price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR',
	"snapshot_data" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"venue_type" "venue_type" NOT NULL,
	"length" numeric(10, 2),
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"area" integer,
	"capacity_theatre" integer,
	"capacity_cluster" varchar(50),
	"capacity_classroom" integer,
	"capacity_u_shape" integer,
	"capacity_boardroom" integer,
	"capacity_banquet" integer,
	"capacity_cocktail" integer,
	"is_divisible" boolean DEFAULT false,
	"has_natural_light" boolean DEFAULT false,
	"has_av" boolean DEFAULT true,
	"has_wifi" boolean DEFAULT true,
	"has_projector" boolean DEFAULT false,
	"has_whiteboard" boolean DEFAULT false,
	"has_stage" boolean DEFAULT false,
	"has_dance_floor" boolean DEFAULT false,
	"floor" integer,
	"location" varchar(100),
	"featured_image" text,
	"images" json DEFAULT '[]'::json,
	"floor_plan" text,
	"half_day_rate" numeric(10, 2),
	"full_day_rate" numeric(10, 2),
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"equipment" json DEFAULT '[]'::json,
	"amenities" json DEFAULT '[]'::json,
	"suitable_for" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "retry_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_status" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_audit_logs" ADD CONSTRAINT "booking_audit_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_confirmations" ADD CONSTRAINT "booking_confirmations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_logs" ADD CONSTRAINT "booking_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_processing_lock" ADD CONSTRAINT "booking_processing_lock_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locks" ADD CONSTRAINT "inventory_locks_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locks" ADD CONSTRAINT "inventory_locks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_locks" ADD CONSTRAINT "inventory_locks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_booking_session_id_booking_sessions_id_fk" FOREIGN KEY ("booking_session_id") REFERENCES "public"."booking_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_snapshots" ADD CONSTRAINT "inventory_snapshots_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_snapshots" ADD CONSTRAINT "rate_snapshots_booking_session_id_booking_sessions_id_fk" FOREIGN KEY ("booking_session_id") REFERENCES "public"."booking_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_snapshots" ADD CONSTRAINT "rate_snapshots_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;