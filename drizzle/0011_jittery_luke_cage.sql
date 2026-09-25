ALTER TABLE "companies" ADD COLUMN "plan" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "trial_ends_at" timestamp with time zone DEFAULT now() + interval '14 days' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "subscription_status" text DEFAULT 'trialing' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "extra_seats" integer DEFAULT 0 NOT NULL;