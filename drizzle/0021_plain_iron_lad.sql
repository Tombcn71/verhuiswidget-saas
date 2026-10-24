CREATE TABLE "admin_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "place_id" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "rating" double precision;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_place_id_unique" UNIQUE("place_id");