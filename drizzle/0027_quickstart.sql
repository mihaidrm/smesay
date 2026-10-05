ALTER TABLE "workspace_member" ADD COLUMN "quickstart_seen_at" timestamp with time zone;--> statement-breakpoint
-- Memberships from before the quickstart (stories/E12-2) count as seen: people already using the app are not sent to it.
UPDATE "workspace_member" SET "quickstart_seen_at" = "created_at";