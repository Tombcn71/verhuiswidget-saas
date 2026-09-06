ALTER TABLE "leads" ADD COLUMN "photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "notes" text;