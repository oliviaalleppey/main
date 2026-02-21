CREATE TYPE "public"."outlet_status" AS ENUM('operational', 'upcoming', 'temporarily_closed');--> statement-breakpoint
CREATE TABLE "dining_outlets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"capacity" integer,
	"opening_time" varchar(20),
	"closing_time" varchar(20),
	"operating_hours" varchar(100),
	"cuisine_type" varchar(255),
	"outlet_type" varchar(50),
	"location" varchar(100),
	"floor" integer,
	"status" "outlet_status" DEFAULT 'operational',
	"featured_image" text,
	"images" json DEFAULT '[]'::json,
	"phone" varchar(20),
	"email" varchar(255),
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"menu_url" text,
	"special_features" json DEFAULT '[]'::json,
	"dress_code" varchar(100),
	"reservation_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dining_outlets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "room_id" uuid;--> statement-breakpoint
ALTER TABLE "room_types" ADD COLUMN "base_occupancy" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "room_types" ADD COLUMN "extra_adult_price" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "room_types" ADD COLUMN "extra_child_price" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;