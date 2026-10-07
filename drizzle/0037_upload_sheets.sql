ALTER TABLE "upload" ADD COLUMN "sheets" jsonb;--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "sheet_areas" boolean DEFAULT true NOT NULL;