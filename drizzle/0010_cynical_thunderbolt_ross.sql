ALTER TABLE "companies" DROP CONSTRAINT "companies_clerk_user_id_unique";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "clerk_org_id" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_clerk_org_id_unique" UNIQUE("clerk_org_id");