CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text DEFAULT 'Mijn verhuisbedrijf' NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"website" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#2563eb' NOT NULL,
	"base_fee_cents" integer DEFAULT 35000 NOT NULL,
	"price_per_m3_cents" integer DEFAULT 4500 NOT NULL,
	"price_per_km_cents" integer DEFAULT 150 NOT NULL,
	"packing_fee_cents" integer DEFAULT 12000 NOT NULL,
	"assembly_fee_cents" integer DEFAULT 8000 NOT NULL,
	"storage_per_month_cents" integer DEFAULT 9500 NOT NULL,
	"min_price_cents" integer DEFAULT 15000 NOT NULL,
	"vat_rate" numeric(4, 3) DEFAULT '0.210' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"move_type" text DEFAULT 'verhuizing' NOT NULL,
	"from_address" text,
	"to_address" text,
	"from_floor" text,
	"to_floor" text,
	"move_date" date,
	"distance_km" numeric(7, 1) DEFAULT '0' NOT NULL,
	"rooms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inventory" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_volume_m3" numeric(8, 2) DEFAULT '0' NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"vat_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'nieuw' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_company_id_created_at_idx" ON "leads" USING btree ("company_id","created_at" DESC NULLS LAST);