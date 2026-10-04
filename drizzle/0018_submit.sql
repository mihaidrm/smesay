ALTER TABLE "missing_item" ADD COLUMN "suggested_value" text;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "first_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "closing_answer" text;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "sign_off_text" text;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "wrap_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "wrap_writer" text;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "wrap_writer_seq" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- E7-5: a response submitted before this migration was submitted once (hand-written).
UPDATE "response" SET "first_submitted_at" = "submitted_at" WHERE "submitted_at" IS NOT NULL AND "first_submitted_at" IS NULL;