CREATE TABLE "workspace_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"headers_key" text NOT NULL,
	"mapping" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "mapping" jsonb;--> statement-breakpoint
ALTER TABLE "workspace_mapping" ADD CONSTRAINT "workspace_mapping_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_mapping_headers_idx" ON "workspace_mapping" USING btree ("workspace_id","headers_key");