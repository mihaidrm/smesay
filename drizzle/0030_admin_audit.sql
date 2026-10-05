CREATE TABLE "admin_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_workspace_id" uuid,
	"target_user_id" text,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_action_check" CHECK ("action" in ('plan_changed', 'ai_budget_set', 'invite_resent', 'link_revoked', 'workspace_restored', 'note_added', 'magic_link_sent', 'signed_out_everywhere', 'member_removed', 'account_deleted', 'view_started', 'view_stopped')),
	CONSTRAINT "admin_audit_target_check" CHECK ("admin_audit"."target_workspace_id" is not null or "admin_audit"."target_user_id" is not null)
);
--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "admin_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_workspace_idx" ON "admin_audit" USING btree ("target_workspace_id");--> statement-breakpoint
CREATE INDEX "admin_audit_admin_idx" ON "admin_audit" USING btree ("admin_user_id");