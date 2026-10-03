ALTER TABLE "invite" ADD COLUMN "send_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invite" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invite" ADD COLUMN "send_error" text;--> statement-breakpoint
CREATE UNIQUE INDEX "invite_personal_email_idx" ON "invite" USING btree ("instrument_id","email") WHERE "invite"."kind" = 'personal';