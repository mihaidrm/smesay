ALTER TABLE "answer" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "answer" ADD COLUMN "writer" text;--> statement-breakpoint
ALTER TABLE "answer" ADD COLUMN "writer_seq" integer DEFAULT 0 NOT NULL;