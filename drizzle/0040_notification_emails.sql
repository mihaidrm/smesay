ALTER TABLE "instrument" ADD COLUMN "closed_email_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "instrument" ADD COLUMN "complete_email_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_prefs" jsonb DEFAULT '{"validations": true, "digest": false, "guide": true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_state" jsonb DEFAULT '{"token": null, "digestAt": null, "steps": {}}'::jsonb NOT NULL;