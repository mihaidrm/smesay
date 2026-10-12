CREATE TABLE "product" (
	"id" smallint PRIMARY KEY NOT NULL,
	"launched_at" timestamp with time zone,
	"launched_by" text,
	CONSTRAINT "product_one_row_check" CHECK ("product"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "admin_audit" DROP CONSTRAINT "admin_audit_action_check";--> statement-breakpoint
ALTER TABLE "admin_audit" DROP CONSTRAINT "admin_audit_target_check";--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "ai_credits_cents" integer;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_launched_by_user_id_fk" FOREIGN KEY ("launched_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_action_check" CHECK ("action" in ('plan_changed', 'ai_budget_set', 'ai_credits_set', 'product_launched', 'product_taken_back', 'invite_resent', 'link_revoked', 'workspace_restored', 'note_added', 'magic_link_sent', 'signed_out_everywhere', 'member_removed', 'account_deleted', 'view_started', 'view_stopped'));--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_target_check" CHECK ("admin_audit"."target_workspace_id" is not null or "admin_audit"."target_user_id" is not null or "admin_audit"."action" in ('product_launched', 'product_taken_back'));