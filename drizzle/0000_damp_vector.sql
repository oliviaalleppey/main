CREATE TYPE "public"."addon_type" AS ENUM('per_person', 'per_unit');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict', 'non_refundable');--> statement-breakpoint
CREATE TYPE "public"."channel_type" AS ENUM('direct', 'ota', 'gds', 'agent', 'walk_in');--> statement-breakpoint
CREATE TYPE "public"."housekeeping_status" AS ENUM('clean', 'dirty', 'touch_up', 'inspect', 'out_of_service');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('hotel_collect', 'channel_collect', 'prepaid');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('active', 'inactive', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vip_level" AS ENUM('regular', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"type" "addon_type" DEFAULT 'per_unit',
	"icon" varchar(100),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "booking_add_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"add_on_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1,
	"price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "booking_channels_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "booking_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes" json,
	"performed_by" text,
	"performed_by_name" varchar(255),
	"notes" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"room_id" uuid,
	"rate_plan_id" uuid,
	"quantity" integer DEFAULT 1,
	"price_per_night" integer NOT NULL,
	"nights" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_number" varchar(50) NOT NULL,
	"guest_profile_id" uuid,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"guest_phone" varchar(20) NOT NULL,
	"guest_address" text,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0,
	"rate_plan_id" uuid,
	"channel_id" uuid,
	"channel_booking_id" varchar(100),
	"base_amount" integer DEFAULT 0,
	"subtotal" integer NOT NULL,
	"tax_amount" integer DEFAULT 0,
	"discount_amount" integer DEFAULT 0,
	"discount_reason" text,
	"total_amount" integer NOT NULL,
	"commission_amount" integer DEFAULT 0,
	"net_amount" integer DEFAULT 0,
	"promo_code" varchar(50),
	"offer_id" uuid,
	"status" "booking_status" DEFAULT 'pending',
	"payment_status" "payment_status" DEFAULT 'pending',
	"special_requests" text,
	"guest_preferences" text,
	"is_vip_booking" boolean DEFAULT false,
	"vip_benefits_applied" text,
	"created_by" text,
	"modified_by" text,
	"confirmed_by" text,
	"cancelled_by" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"confirmed_at" timestamp,
	"check_in_at" timestamp,
	"check_out_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number")
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"room_type_id" uuid,
	"total_rooms" integer NOT NULL,
	"available_rooms" integer NOT NULL,
	"occupied_rooms" integer NOT NULL,
	"blocked_rooms" integer DEFAULT 0,
	"room_revenue" integer DEFAULT 0,
	"addon_revenue" integer DEFAULT 0,
	"food_revenue" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"occupancy_rate" integer DEFAULT 0,
	"adr" integer DEFAULT 0,
	"revpar" integer DEFAULT 0,
	"new_bookings" integer DEFAULT 0,
	"cancellations" integer DEFAULT 0,
	"modifications" integer DEFAULT 0,
	"check_ins" integer DEFAULT 0,
	"check_outs" integer DEFAULT 0,
	"no_shows" integer DEFAULT 0,
	"direct_bookings" integer DEFAULT 0,
	"ota_bookings" integer DEFAULT 0,
	"agent_bookings" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"description" text,
	"image_url" text NOT NULL,
	"category" varchar(100),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guest_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
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
	"preferred_room_type_id" uuid,
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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "guest_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"event_date" date,
	"guest_count" integer,
	"message" text,
	"status" varchar(20) DEFAULT 'new',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "occupancy_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"min_occupancy" integer NOT NULL,
	"max_occupancy" integer NOT NULL,
	"price_modifier" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" integer NOT NULL,
	"min_booking_amount" integer DEFAULT 0,
	"max_discount" integer,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "offers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"razorpay_signature" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR',
	"status" "payment_status" DEFAULT 'pending',
	"payment_method" varchar(50),
	"refund_amount" integer DEFAULT 0,
	"refund_reason" text,
	"refunded_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"room_type_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price_modifier" integer NOT NULL,
	"minimum_stay" integer DEFAULT 1,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"room_type_id" uuid NOT NULL,
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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rate_plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "room_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"price_modifier" integer DEFAULT 0,
	"category" varchar(50),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "room_attributes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "room_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"room_type_id" uuid,
	"total_rooms" integer NOT NULL,
	"booked_rooms" integer DEFAULT 0,
	"released_rooms" integer DEFAULT 0,
	"release_date" date,
	"cut_off_date" date,
	"negotiated_rate" integer,
	"rate_plan_id" uuid,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"status" varchar(20) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(255),
	"sort_order" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_rooms" integer NOT NULL,
	"available_rooms" integer NOT NULL,
	"blocked_rooms" integer DEFAULT 0,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"base_price" integer NOT NULL,
	"max_guests" integer DEFAULT 2 NOT NULL,
	"max_adults" integer DEFAULT 2 NOT NULL,
	"max_children" integer DEFAULT 0,
	"size" integer,
	"size_unit" varchar(10) DEFAULT 'sqft',
	"bed_type" varchar(100),
	"amenities" json DEFAULT '[]'::json,
	"images" json DEFAULT '[]'::json,
	"featured_image" text,
	"status" "room_status" DEFAULT 'active',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "room_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_type_id" uuid NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"floor" integer,
	"status" "room_status" DEFAULT 'active',
	"notes" text,
	"housekeeping_status" "housekeeping_status" DEFAULT 'clean',
	"last_cleaned_at" timestamp,
	"last_inspected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" json NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_location" varchar(255),
	"rating" integer DEFAULT 5 NOT NULL,
	"review" text NOT NULL,
	"avatar" text,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" "user_role" DEFAULT 'user'
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"guest_phone" varchar(20) NOT NULL,
	"room_type_id" uuid,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"adults" integer DEFAULT 1,
	"children" integer DEFAULT 0,
	"room_count" integer DEFAULT 1,
	"priority" integer DEFAULT 0,
	"notes" text,
	"status" varchar(20) DEFAULT 'waiting',
	"offered_at" timestamp,
	"expires_at" timestamp,
	"converted_booking_id" uuid,
	"channel_id" uuid,
	"source" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_add_on_id_add_ons_id_fk" FOREIGN KEY ("add_on_id") REFERENCES "public"."add_ons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_history" ADD CONSTRAINT "booking_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_profile_id_guest_profiles_id_fk" FOREIGN KEY ("guest_profile_id") REFERENCES "public"."guest_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_channel_id_booking_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."booking_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_profiles" ADD CONSTRAINT "guest_profiles_preferred_room_type_id_room_types_id_fk" FOREIGN KEY ("preferred_room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancy_pricing" ADD CONSTRAINT "occupancy_pricing_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_attribute_values" ADD CONSTRAINT "room_attribute_values_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_attribute_values" ADD CONSTRAINT "room_attribute_values_attribute_id_room_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."room_attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_blocks" ADD CONSTRAINT "room_blocks_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_inventory" ADD CONSTRAINT "room_inventory_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_converted_booking_id_bookings_id_fk" FOREIGN KEY ("converted_booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_channel_id_booking_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."booking_channels"("id") ON DELETE no action ON UPDATE no action;