CREATE TABLE "upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"filename" text NOT NULL,
	"kind" text NOT NULL,
	"byte_size" integer NOT NULL,
	"sheet" text,
	"header_row" integer,
	"preview" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_kind_check" CHECK ("kind" in ('xlsx', 'csv'))
);
--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_project_idx" ON "upload" USING btree ("project_id");