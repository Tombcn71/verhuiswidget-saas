ALTER TABLE "companies" ADD COLUMN "quote_follow_up" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "google_review_url" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "follow_up_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "review_request_sent_at" timestamp with time zone;