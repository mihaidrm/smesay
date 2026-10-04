CREATE TABLE "export_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"made_by" text,
	"file" text NOT NULL,
	"filter" text,
	"rows" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "export_log_file_check" CHECK ("file" in ('answers', 'items', 'people', 'missing'))
);
--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_made_by_user_id_fk" FOREIGN KEY ("made_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_log" ADD CONSTRAINT "export_log_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "export_log_workspace_idx" ON "export_log" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "export_log_project_idx" ON "export_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "export_log_made_by_idx" ON "export_log" USING btree ("made_by");