ALTER TABLE "instrument" ADD COLUMN "perspectives" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "perspectives" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "response" ADD COLUMN "perspectives" text[] DEFAULT '{}'::text[] NOT NULL;