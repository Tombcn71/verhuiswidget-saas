ALTER TABLE "companies" ADD COLUMN "tempo_m3" numeric(6, 1) DEFAULT '30' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "tempo_hours" numeric(4, 1) DEFAULT '5.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "tempo_movers" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "crew_two_max_m3" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "crew_three_max_m3" integer DEFAULT 35 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "van_rate_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "van_rate_unit" text DEFAULT 'uur' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "travel_mode" text DEFAULT 'rit' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "min_hours" numeric(3, 1) DEFAULT '2' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "rounding_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "saturday_surcharge_pct" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "sunday_surcharge_pct" integer DEFAULT 0 NOT NULL;