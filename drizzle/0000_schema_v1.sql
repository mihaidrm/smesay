CREATE TABLE "ai_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"purpose" text NOT NULL,
	"model" text NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cost_eur_cents" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_run_purpose_check" CHECK ("purpose" in ('shape', 'insights'))
);
--> statement-breakpoint
CREATE TABLE "answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"item_set_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"value" text,
	"reason" text,
	"comment" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_kind_check" CHECK ("kind" in ('agree', 'change', 'disagree', 'unclear', 'pick'))
);
--> statement-breakpoint
CREATE TABLE "insight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"cited_answer_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"model" text,
	"tokens_in" integer,
	"tokens_out" integer,
	"cost_eur_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insight_state_check" CHECK ("state" in ('open', 'done', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "instrument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"item_set_id" uuid NOT NULL,
	"title" text NOT NULL,
	"intro" text,
	"method" text DEFAULT 'moscow' NOT NULL,
	"show_proposed" boolean DEFAULT true NOT NULL,
	"layout" text DEFAULT 'chapters' NOT NULL,
	"respondent_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"closing" jsonb DEFAULT '{"confidence": true, "missingForm": true, "signOffText": ""}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instrument_id_workspace_uq" UNIQUE("id","workspace_id"),
	CONSTRAINT "instrument_id_item_set_uq" UNIQUE("id","item_set_id"),
	CONSTRAINT "instrument_method_check" CHECK ("method" in ('moscow', 'fit', 'kcd')),
	CONSTRAINT "instrument_layout_check" CHECK ("layout" in ('chapters', 'item', 'page'))
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"token" text NOT NULL,
	"email" text,
	"name" text,
	"role_hint" text,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"passcode_hash" text,
	"revoked_at" timestamp with time zone,
	"reminders_sent" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_id_workspace_uq" UNIQUE("id","workspace_id"),
	CONSTRAINT "invite_id_instrument_uq" UNIQUE("id","instrument_id"),
	CONSTRAINT "invite_kind_check" CHECK ("kind" in ('public', 'personal')),
	CONSTRAINT "invite_personal_email_check" CHECK ("kind" = 'public' or "email" is not null),
	CONSTRAINT "invite_token_length_check" CHECK (length("token") >= 32)
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"item_set_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"source_ref" text,
	"original_text" text NOT NULL,
	"reader_text" text,
	"reader_status" text,
	"area" text,
	"area_rationale" text,
	"proposed_value" text,
	"custom" jsonb,
	"flags" jsonb,
	CONSTRAINT "item_id_workspace_uq" UNIQUE("id","workspace_id"),
	CONSTRAINT "item_id_item_set_uq" UNIQUE("id","item_set_id"),
	CONSTRAINT "item_original_text_check" CHECK (length(btrim("original_text")) > 0),
	CONSTRAINT "item_reader_status_check" CHECK ("reader_status" is null or "reader_status" in ('suggested', 'accepted', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "item_set" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"source" text NOT NULL,
	"source_filename" text,
	"import_report" jsonb,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_set_id_workspace_uq" UNIQUE("id","workspace_id"),
	CONSTRAINT "item_set_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "item_set_source_check" CHECK ("source" in ('xlsx', 'csv', 'pasted')),
	CONSTRAINT "item_set_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "missing_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"text" text NOT NULL,
	"suggested_area" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "missing_item_text_check" CHECK (length(btrim("text")) > 0)
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"context_goal" text,
	"context_terms" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "project_id_workspace_uq" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"item_set_id" uuid NOT NULL,
	"invite_id" uuid NOT NULL,
	"device_token" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" integer,
	"signed_off" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "response_id_workspace_uq" UNIQUE("id","workspace_id"),
	CONSTRAINT "response_id_item_set_uq" UNIQUE("id","item_set_id"),
	CONSTRAINT "response_confidence_check" CHECK ("confidence" is null or ("confidence" between 1 and 5)),
	CONSTRAINT "response_device_token_length_check" CHECK (length("device_token") >= 32)
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"accent_hex" text,
	"logo_object_key" text,
	"ai_budget_eur" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_member_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id"),
	CONSTRAINT "workspace_member_role_check" CHECK ("role" in ('owner', 'member'))
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_run" ADD CONSTRAINT "ai_run_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_run" ADD CONSTRAINT "ai_run_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_response_fk" FOREIGN KEY ("response_id","workspace_id") REFERENCES "public"."response"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_item_fk" FOREIGN KEY ("item_id","workspace_id") REFERENCES "public"."item"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_response_set_fk" FOREIGN KEY ("response_id","item_set_id") REFERENCES "public"."response"("id","item_set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_item_set_fk" FOREIGN KEY ("item_id","item_set_id") REFERENCES "public"."item"("id","item_set_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight" ADD CONSTRAINT "insight_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_item_set_fk" FOREIGN KEY ("item_set_id","workspace_id") REFERENCES "public"."item_set"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument" ADD CONSTRAINT "instrument_item_set_project_fk" FOREIGN KEY ("item_set_id","project_id") REFERENCES "public"."item_set"("id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_instrument_fk" FOREIGN KEY ("instrument_id","workspace_id") REFERENCES "public"."instrument"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_item_set_fk" FOREIGN KEY ("item_set_id","workspace_id") REFERENCES "public"."item_set"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_set" ADD CONSTRAINT "item_set_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_set" ADD CONSTRAINT "item_set_project_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_item" ADD CONSTRAINT "missing_item_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_item" ADD CONSTRAINT "missing_item_response_fk" FOREIGN KEY ("response_id","workspace_id") REFERENCES "public"."response"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_instrument_fk" FOREIGN KEY ("instrument_id","workspace_id") REFERENCES "public"."instrument"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_instrument_set_fk" FOREIGN KEY ("instrument_id","item_set_id") REFERENCES "public"."instrument"("id","item_set_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_invite_fk" FOREIGN KEY ("invite_id","workspace_id") REFERENCES "public"."invite"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_invite_instrument_fk" FOREIGN KEY ("invite_id","instrument_id") REFERENCES "public"."invite"("id","instrument_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_run_workspace_idx" ON "ai_run" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "ai_run_project_idx" ON "ai_run" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "answer_workspace_idx" ON "answer" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "answer_response_item_idx" ON "answer" USING btree ("response_id","item_id");--> statement-breakpoint
CREATE INDEX "answer_item_idx" ON "answer" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "insight_workspace_idx" ON "insight" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "insight_project_idx" ON "insight" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "instrument_workspace_idx" ON "instrument" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "instrument_project_idx" ON "instrument" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "instrument_item_set_idx" ON "instrument" USING btree ("item_set_id");--> statement-breakpoint
CREATE INDEX "invite_workspace_idx" ON "invite" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "invite_instrument_idx" ON "invite" USING btree ("instrument_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_token_idx" ON "invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "item_workspace_idx" ON "item" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "item_set_idx" ON "item" USING btree ("item_set_id");--> statement-breakpoint
CREATE INDEX "item_set_workspace_idx" ON "item_set" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "item_set_project_version_idx" ON "item_set" USING btree ("project_id","version");--> statement-breakpoint
CREATE INDEX "missing_item_workspace_idx" ON "missing_item" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "missing_item_response_idx" ON "missing_item" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "project_workspace_idx" ON "project" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "project_created_by_idx" ON "project" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "response_workspace_idx" ON "response" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "response_instrument_submitted_idx" ON "response" USING btree ("instrument_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "response_device_token_idx" ON "response" USING btree ("device_token");--> statement-breakpoint
CREATE INDEX "response_invite_idx" ON "response" USING btree ("invite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_idx" ON "workspace" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");