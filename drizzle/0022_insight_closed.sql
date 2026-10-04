ALTER TABLE "insight" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "insight" ADD COLUMN "closed_by" text;--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insight_closed_by_idx" ON "insight" USING btree ("closed_by");--> statement-breakpoint
-- Actions marked before E9-2 get their creation date as the closed date, so the check holds.
UPDATE "insight" SET "closed_at" = "created_at" WHERE "state" <> 'open';--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_closed_check" CHECK (("state" = 'open') = ("closed_at" is null));