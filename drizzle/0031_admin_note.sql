CREATE TABLE "admin_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"admin_user_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_note_text_check" CHECK (char_length("admin_note"."text") between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "admin_note" ADD CONSTRAINT "admin_note_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_note_workspace_idx" ON "admin_note" USING btree ("workspace_id");