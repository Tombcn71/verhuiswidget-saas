ALTER TABLE "companies" ADD COLUMN "move_floor_surcharge_cents" integer DEFAULT 2500 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "lift_fee_cents" integer DEFAULT 15000 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "move_discounts" jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "move" jsonb;