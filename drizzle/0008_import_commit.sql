ALTER TABLE "upload" DROP CONSTRAINT "upload_kind_check";--> statement-breakpoint
ALTER TABLE "item_set" ADD COLUMN "imported_by" text;--> statement-breakpoint
ALTER TABLE "item_set" ADD COLUMN "upload_id" uuid;--> statement-breakpoint
ALTER TABLE "item_set" ADD CONSTRAINT "item_set_imported_by_user_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_id_workspace_uq" UNIQUE("id","workspace_id");--> statement-breakpoint
-- Edited by hand (2026-10-02, MISTAKES.md): drizzle-kit emitted this foreign key before the
-- unique constraint it needs, and "ON DELETE set null" on a composite key would null
-- workspace_id too, so the key has no delete action.
ALTER TABLE "item_set" ADD CONSTRAINT "item_set_upload_fk" FOREIGN KEY ("upload_id","workspace_id") REFERENCES "public"."upload"("id","workspace_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_kind_check" CHECK ("kind" in ('xlsx', 'csv', 'pasted'));