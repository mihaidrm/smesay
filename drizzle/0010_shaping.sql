ALTER TABLE "item_set" ADD COLUMN "area_order" jsonb;--> statement-breakpoint
ALTER TABLE "item_set" ADD COLUMN "shape_runs" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "item_set" ADD COLUMN "shaped_at" timestamp with time zone;