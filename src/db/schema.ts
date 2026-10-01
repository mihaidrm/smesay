// Schema v1 (stories/E1-2-schema-v1.md, docs/schema.md). Every table carries workspace_id or
// is reachable only through one that does; item text is never overwritten; a response points
// at the set version it was given. The enums are INTERFACES.md's; change that file first.
// Drizzle pg-core API: pgTable, uuid, text, integer, boolean, timestamp, jsonb, index,
// uniqueIndex, check, primaryKey (node_modules/drizzle-orm/pg-core/*.d.ts).
import { sql } from "drizzle-orm";
import {
  boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const ANSWER_KINDS = ["agree", "change", "disagree", "unclear", "pick"] as const;
export const SCORING_METHODS = ["moscow", "fit", "kcd"] as const;
export const LAYOUTS = ["chapters", "item", "page"] as const;
export const INVITE_KINDS = ["public", "personal"] as const;
export const READER_STATUSES = ["suggested", "accepted", "rejected"] as const;
export const INSIGHT_STATES = ["open", "done", "dismissed"] as const;
export const MEMBER_ROLES = ["owner", "member"] as const;
export const ITEM_SET_SOURCES = ["xlsx", "csv", "pasted"] as const;
export const AI_PURPOSES = ["shape", "insights"] as const;

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const oneOf = (column: string, values: readonly string[]) =>
  sql.raw(`"${column}" in (${values.map((v) => `'${v}'`).join(", ")})`);

export const workspace = pgTable("workspace", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  accentHex: text("accent_hex"),
  logoObjectKey: text("logo_object_key"),
  aiBudgetEur: integer("ai_budget_eur").notNull().default(50),
  createdAt: ts("created_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
}, (t) => [uniqueIndex("workspace_slug_idx").on(t.slug)]);

export const workspaceMember = pgTable("workspace_member", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.workspaceId, t.userId] }),
  check("workspace_member_role_check", oneOf("role", MEMBER_ROLES)),
]);

export const project = pgTable("project", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contextGoal: text("context_goal"),
  contextTerms: text("context_terms"),
  isSample: boolean("is_sample").notNull().default(false),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: ts("created_at").notNull().defaultNow(),
  archivedAt: ts("archived_at"),
}, (t) => [index("project_workspace_idx").on(t.workspaceId)]);

export const itemSet = pgTable("item_set", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  source: text("source").notNull(),
  sourceFilename: text("source_filename"),
  importReport: jsonb("import_report"),
  importedAt: ts("imported_at").notNull().defaultNow(),
}, (t) => [
  index("item_set_workspace_idx").on(t.workspaceId),
  uniqueIndex("item_set_project_version_idx").on(t.projectId, t.version),
  check("item_set_source_check", oneOf("source", ITEM_SET_SOURCES)),
  check("item_set_version_check", sql`"version" >= 1`),
]);

export const item = pgTable("item", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  itemSetId: uuid("item_set_id").notNull().references(() => itemSet.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  sourceRef: text("source_ref"),
  originalText: text("original_text").notNull(),
  readerText: text("reader_text"),
  readerStatus: text("reader_status"),
  area: text("area"),
  areaRationale: text("area_rationale"),
  proposedValue: text("proposed_value"),
  custom: jsonb("custom"),
  flags: jsonb("flags"),
}, (t) => [
  index("item_workspace_idx").on(t.workspaceId),
  index("item_set_idx").on(t.itemSetId),
  check("item_original_text_check", sql`length(btrim("original_text")) > 0`),
  check("item_reader_status_check", sql`"reader_status" is null or ${oneOf("reader_status", READER_STATUSES)}`),
]);

export const instrument = pgTable("instrument", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  itemSetId: uuid("item_set_id").notNull().references(() => itemSet.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  intro: text("intro"),
  method: text("method").notNull().default("moscow"),
  showProposed: boolean("show_proposed").notNull().default(true),
  layout: text("layout").notNull().default("chapters"),
  respondentFields: jsonb("respondent_fields").notNull().default(sql`'[]'::jsonb`),
  closing: jsonb("closing").notNull().default(sql`'{}'::jsonb`),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("instrument_workspace_idx").on(t.workspaceId),
  index("instrument_project_idx").on(t.projectId),
  check("instrument_method_check", oneOf("method", SCORING_METHODS)),
  check("instrument_layout_check", oneOf("layout", LAYOUTS)),
]);

export const invite = pgTable("invite", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  instrumentId: uuid("instrument_id").notNull().references(() => instrument.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  token: text("token").notNull(),
  email: text("email"),
  name: text("name"),
  roleHint: text("role_hint"),
  opensAt: ts("opens_at"),
  closesAt: ts("closes_at"),
  passcodeHash: text("passcode_hash"),
  revokedAt: ts("revoked_at"),
  remindersSent: integer("reminders_sent").notNull().default(0),
  lastReminderAt: ts("last_reminder_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("invite_workspace_idx").on(t.workspaceId),
  index("invite_instrument_idx").on(t.instrumentId),
  uniqueIndex("invite_token_idx").on(t.token),
  check("invite_kind_check", oneOf("kind", INVITE_KINDS)),
  check("invite_personal_email_check", sql`"kind" = 'public' or "email" is not null`),
]);

export const response = pgTable("response", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  instrumentId: uuid("instrument_id").notNull().references(() => instrument.id, { onDelete: "cascade" }),
  itemSetId: uuid("item_set_id").notNull().references(() => itemSet.id, { onDelete: "restrict" }),
  inviteId: uuid("invite_id").notNull().references(() => invite.id, { onDelete: "cascade" }),
  deviceToken: text("device_token").notNull(),
  fields: jsonb("fields").notNull().default(sql`'{}'::jsonb`),
  confidence: integer("confidence"),
  signedOff: boolean("signed_off").notNull().default(false),
  submittedAt: ts("submitted_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  index("response_workspace_idx").on(t.workspaceId),
  index("response_instrument_submitted_idx").on(t.instrumentId, t.submittedAt),
  uniqueIndex("response_device_token_idx").on(t.deviceToken),
  check("response_confidence_check", sql`"confidence" is null or ("confidence" between 1 and 5)`),
]);

export const answer = pgTable("answer", {
  id: id(),
  responseId: uuid("response_id").notNull().references(() => response.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull().references(() => item.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  value: text("value"),
  reason: text("reason"),
  comment: text("comment"),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("answer_response_item_idx").on(t.responseId, t.itemId),
  index("answer_item_idx").on(t.itemId),
  check("answer_kind_check", oneOf("kind", ANSWER_KINDS)),
]);

export const missingItem = pgTable("missing_item", {
  id: id(),
  responseId: uuid("response_id").notNull().references(() => response.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  suggestedArea: text("suggested_area"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("missing_item_response_idx").on(t.responseId),
  check("missing_item_text_check", sql`length(btrim("text")) > 0`),
]);

export const insight = pgTable("insight", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  why: text("why"),
  citedAnswerIds: uuid("cited_answer_ids").array().notNull().default(sql`'{}'::uuid[]`),
  state: text("state").notNull().default("open"),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costEur: integer("cost_eur_cents"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("insight_workspace_idx").on(t.workspaceId),
  index("insight_project_idx").on(t.projectId),
  check("insight_state_check", oneOf("state", INSIGHT_STATES)),
]);

export const aiRun = pgTable("ai_run", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
  purpose: text("purpose").notNull(),
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costEurCents: integer("cost_eur_cents").notNull().default(0),
  durationMs: integer("duration_ms"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("ai_run_workspace_idx").on(t.workspaceId),
  check("ai_run_purpose_check", oneOf("purpose", AI_PURPOSES)),
]);
