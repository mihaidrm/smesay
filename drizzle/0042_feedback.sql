CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text,
	"kind" text NOT NULL,
	"text" text NOT NULL,
	"page" text,
	"status" text DEFAULT 'open' NOT NULL,
	"solved_at" timestamp with time zone,
	"solved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_kind_check" CHECK ("kind" in ('wrong', 'idea', 'question', 'other')),
	CONSTRAINT "feedback_status_check" CHECK ("status" in ('open', 'solved')),
	CONSTRAINT "feedback_text_check" CHECK (char_length("feedback"."text") between 1 and 2000),
	CONSTRAINT "feedback_page_check" CHECK ("feedback"."page" is null or char_length("feedback"."page") between 1 and 300)
);
--> statement-breakpoint
ALTER TABLE "admin_audit" DROP CONSTRAINT "admin_audit_action_check";--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_solved_by_user_id_fk" FOREIGN KEY ("solved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_workspace_idx" ON "feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "feedback_status_created_idx" ON "feedback" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_action_check" CHECK ("action" in ('plan_changed', 'ai_budget_set', 'ai_credits_set', 'product_launched', 'product_taken_back', 'invite_resent', 'link_revoked', 'workspace_restored', 'note_added', 'magic_link_sent', 'signed_out_everywhere', 'member_removed', 'account_deleted', 'view_started', 'view_stopped', 'feedback_solved', 'feedback_reopened', 'feedback_removed'));