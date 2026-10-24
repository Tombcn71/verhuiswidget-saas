ALTER TABLE "companies" ALTER COLUMN "base_fee_cents" SET DEFAULT 7500;--> statement-breakpoint
-- Voorrijkosten: bedrijven op de oude standaard (€350) naar €75.
UPDATE "companies" SET "base_fee_cents" = 7500 WHERE "base_fee_cents" = 35000;
