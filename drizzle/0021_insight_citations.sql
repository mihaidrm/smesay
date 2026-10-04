ALTER TABLE "insight" ADD COLUMN "cited_missing_item_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "insight" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_kind_check" CHECK ("kind" is null or "kind" in ('rewrite', 'conflict', 'followUp', 'coverage'));