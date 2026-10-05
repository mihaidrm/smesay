ALTER TABLE "export_log" DROP CONSTRAINT "export_log_file_check";--> statement-breakpoint
ALTER TABLE "export_log" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_file_check" CHECK ("file" in ('answers', 'items', 'people', 'missing', 'project', 'summary', 'workspace'));