ALTER TABLE "prospects" ADD COLUMN "meeting_clicked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "reminder_email_id" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "follow_up_email_id" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "follow_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "auto_mail_off" boolean DEFAULT false NOT NULL;