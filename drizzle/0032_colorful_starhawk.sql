ALTER TABLE "companies" ALTER COLUMN "plan" SET DEFAULT 'pro';--> statement-breakpoint
UPDATE "companies" SET "plan" = 'pro' WHERE "plan" = 'standard';
