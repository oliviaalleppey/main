CREATE TYPE "public"."membership_status" AS ENUM('pending', 'contacted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "add_on_room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"add_on_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" varchar(50),
	"nationality" varchar(100),
	"member_photograph_url" text,
	"mobile_number" varchar(20) NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"alternate_contact_number" varchar(20),
	"residential_address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"pin_code" varchar(20) NOT NULL,
	"id_type" varchar(50) NOT NULL,
	"id_number" varchar(255) NOT NULL,
	"preferred_mode" varchar(50),
	"emergency_name" varchar(255) NOT NULL,
	"emergency_relationship" varchar(100) NOT NULL,
	"emergency_contact_number" varchar(20) NOT NULL,
	"status" "membership_status" DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "add_ons" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "add_ons" ADD COLUMN "tax_rate" integer DEFAULT 18;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "omniware_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "omniware_transaction_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "omniware_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "room_types" ADD COLUMN "tax_rate" integer DEFAULT 12;--> statement-breakpoint
ALTER TABLE "add_on_room_types" ADD CONSTRAINT "add_on_room_types_add_on_id_add_ons_id_fk" FOREIGN KEY ("add_on_id") REFERENCES "public"."add_ons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "add_on_room_types" ADD CONSTRAINT "add_on_room_types_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "razorpay_order_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "razorpay_payment_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "razorpay_signature";