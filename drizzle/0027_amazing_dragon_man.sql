ALTER TABLE "companies" ALTER COLUMN "move_floor_surcharge_cents" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stair_minutes_per_floor" integer DEFAULT 45 NOT NULL;--> statement-breakpoint
-- Trappen tellen nu als tijd: bedrijven op de oude standaardtoeslag (€25) naar €0.
UPDATE "companies" SET "move_floor_surcharge_cents" = 0 WHERE "move_floor_surcharge_cents" = 2500;
