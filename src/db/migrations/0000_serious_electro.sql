CREATE TYPE "public"."aqi_standard" AS ENUM('india_cpcb', 'us_epa', 'european');--> statement-breakpoint
CREATE TYPE "public"."cooking_fuel" AS ENUM('lpg', 'electric', 'induction', 'wood', 'piped_gas', 'other');--> statement-breakpoint
CREATE TYPE "public"."environment_type" AS ENUM('urban', 'suburban', 'rural');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('aqi_alert', 'pm25_alert', 'festival_warning', 'seasonal_warning', 'forecast_alert');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartment', 'independent_house', 'flat', 'villa', 'other');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."transport_mode" AS ENUM('bike', 'car', 'public_transport', 'walking', 'work_from_home');--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_city" text NOT NULL,
	"aqi_at_generation" integer,
	"recommendations" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New Conversation',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environmental_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"city" text,
	"aqi" integer,
	"pm25" real,
	"pm10" real,
	"co" real,
	"no2" real,
	"so2" real,
	"o3" real,
	"temperature" real,
	"humidity" real,
	"wind_speed" real,
	"source" text,
	"source_type" text,
	"observed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "festival_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" text NOT NULL,
	"end_date" text,
	"region" text NOT NULL,
	"pollution_impact" text NOT NULL,
	"pollution_types" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"historical_aqi_impact" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"age_group" text NOT NULL,
	"has_respiratory_issues" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_plants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"location" text NOT NULL,
	"air_purifying_rating" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city" text NOT NULL,
	"environment_type" "environment_type",
	"transport_mode" "transport_mode",
	"daily_outdoor_hours" real,
	"outdoor_timings" text,
	"property_type" "property_type",
	"is_owned" boolean,
	"total_floors" integer,
	"floor_number" integer,
	"bhk" integer,
	"approximate_size" integer,
	"has_balcony" boolean,
	"has_garden" boolean,
	"has_proper_ventilation" boolean,
	"windows_usually_open" boolean,
	"nearby_features" jsonb DEFAULT '[]'::jsonb,
	"has_air_purifier" boolean,
	"has_ac" boolean,
	"has_exhaust_fan" boolean,
	"cooking_fuel" "cooking_fuel",
	"is_kitchen_ventilated" boolean,
	"burns_incense" boolean,
	"experiences_dust" boolean,
	"profile_completion_percent" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"enable_aqi_alerts" boolean DEFAULT true,
	"aqi_threshold" integer DEFAULT 200,
	"enable_pm25_alerts" boolean DEFAULT true,
	"pm25_threshold" integer DEFAULT 60,
	"enable_festival_alerts" boolean DEFAULT true,
	"festival_alert_days_before" integer DEFAULT 7,
	"enable_seasonal_alerts" boolean DEFAULT true,
	"enable_forecast_alerts" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" text NOT NULL,
	"email" text,
	"display_name" text,
	"avatar_url" text,
	"preferred_aqi_standard" "aqi_standard" DEFAULT 'india_cpcb',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"country" text,
	"local_area" text,
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "severity" DEFAULT 'info',
	"is_read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_household_profiles_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_plants" ADD CONSTRAINT "household_plants_household_id_household_profiles_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_profiles" ADD CONSTRAINT "household_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;