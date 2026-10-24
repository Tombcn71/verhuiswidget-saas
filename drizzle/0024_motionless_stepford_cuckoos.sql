ALTER TABLE "companies" ALTER COLUMN "price_per_m3_cents" SET DEFAULT 0;--> statement-breakpoint
-- Dubbele telling weg: bedrijven op de oude standaard (€45/m³ bovenop mankracht) naar €0.
UPDATE "companies" SET "price_per_m3_cents" = 0 WHERE "price_per_m3_cents" = 4500;
