// Schema v1 (stories/E1-2-schema-v1.md, docs/schema.md). Every application table carries
// workspace_id with a foreign key to workspace; child rows reference their parent on
// (parent_id, workspace_id) (unique constraints on the parents), so a row can never point at
// another workspace's parent. Item text
// is never overwritten (a trigger in drizzle/0001 refuses the update); a response is pinned to
// the set version its instrument was built from. The enums are INTERFACES.md's; change that
// file first. Drizzle pg-core API: pgTable, uuid, text, integer, boolean, timestamp, jsonb,
// index, uniqueIndex, unique, check, primaryKey, foreignKey (node_modules/drizzle-orm/pg-core/*.d.ts);
// text({ enum }) and .$type<T>() type the enum and jsonb columns (column-builder.d.ts, columns/text.d.ts).
import { sql } from "drizzle-orm";
import {
  boolean, check, foreignKey, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import type { ClosingSpec, ImportReport, ItemFlags, RespondentFieldSpec, ResponseFields } from "./types";

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
const wsRef = () => uuid("workspace_id").notNull().references(() => workspace.id, { onDelete: "cascade" });

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
  workspaceId: wsRef(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: MEMBER_ROLES }).notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.workspaceId, t.userId] }),
  index("workspace_member_user_idx").on(t.userId),
  check("workspace_member_role_check", oneOf("role", MEMBER_ROLES)),
]);

export const project = pgTable("project", {
  id: id(),
  workspaceId: wsRef(),
  name: text("name").notNull(),
  contextGoal: text("context_goal"),
  contextTerms: text("context_terms"),
  isSample: boolean("is_sample").notNull().default(false),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: ts("created_at").notNull().defaultNow(),
  archivedAt: ts("archived_at"),
}, (t) => [
  index("project_workspace_idx").on(t.workspaceId),
  index("project_created_by_idx").on(t.createdBy),
  unique("project_id_workspace_uq").on(t.id, t.workspaceId),
]);

export const itemSet = pgTable("item_set", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id").notNull(),
  version: integer("version").notNull(),
  source: text("source", { enum: ITEM_SET_SOURCES }).notNull(),
  sourceFilename: text("source_filename"),
  importReport: jsonb("import_report").$type<ImportReport>(),
  importedAt: ts("imported_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "item_set_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("item_set_workspace_idx").on(t.workspaceId),
  uniqueIndex("item_set_project_version_idx").on(t.projectId, t.version),
  unique("item_set_id_workspace_uq").on(t.id, t.workspaceId),
  unique("item_set_id_project_uq").on(t.id, t.projectId),
  check("item_set_source_check", oneOf("source", ITEM_SET_SOURCES)),
  check("item_set_version_check", sql`"version" >= 1`),
]);

export const item = pgTable("item", {
  id: id(),
  workspaceId: wsRef(),
  itemSetId: uuid("item_set_id").notNull(),
  position: integer("position").notNull(),
  sourceRef: text("source_ref"),
  originalText: text("original_text").notNull(),
  readerText: text("reader_text"),
  readerStatus: text("reader_status", { enum: READER_STATUSES }),
  area: text("area"),
  areaRationale: text("area_rationale"),
  proposedValue: text("proposed_value"),
  custom: jsonb("custom"),
  flags: jsonb("flags").$type<ItemFlags>(),
}, (t) => [
  foreignKey({ name: "item_item_set_fk", columns: [t.itemSetId, t.workspaceId], foreignColumns: [itemSet.id, itemSet.workspaceId] }).onDelete("cascade"),
  index("item_workspace_idx").on(t.workspaceId),
  index("item_set_idx").on(t.itemSetId),
  unique("item_id_workspace_uq").on(t.id, t.workspaceId),
  unique("item_id_item_set_uq").on(t.id, t.itemSetId),
  check("item_original_text_check", sql`length(btrim("original_text")) > 0`),
  check("item_reader_status_check", sql`"reader_status" is null or ${oneOf("reader_status", READER_STATUSES)}`),
]);

export const instrument = pgTable("instrument", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id").notNull(),
  itemSetId: uuid("item_set_id").notNull(),
  title: text("title").notNull(),
  intro: text("intro"),
  method: text("method", { enum: SCORING_METHODS }).notNull().default("moscow"),
  showProposed: boolean("show_proposed").notNull().default(true),
  layout: text("layout", { enum: LAYOUTS }).notNull().default("chapters"),
  respondentFields: jsonb("respondent_fields").$type<RespondentFieldSpec[]>().notNull().default(sql`'[]'::jsonb`),
  closing: jsonb("closing").$type<ClosingSpec>().notNull().default(sql`'{"confidence": true, "missingForm": true, "signOffText": ""}'::jsonb`),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "instrument_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  foreignKey({ name: "instrument_item_set_fk", columns: [t.itemSetId, t.workspaceId], foreignColumns: [itemSet.id, itemSet.workspaceId] }).onDelete("restrict"),
  foreignKey({ name: "instrument_item_set_project_fk", columns: [t.itemSetId, t.projectId], foreignColumns: [itemSet.id, itemSet.projectId] }).onDelete("restrict"),
  index("instrument_workspace_idx").on(t.workspaceId),
  index("instrument_project_idx").on(t.projectId),
  index("instrument_item_set_idx").on(t.itemSetId),
  unique("instrument_id_workspace_uq").on(t.id, t.workspaceId),
  unique("instrument_id_item_set_uq").on(t.id, t.itemSetId),
  check("instrument_method_check", oneOf("method", SCORING_METHODS)),
  check("instrument_layout_check", oneOf("layout", LAYOUTS)),
]);

export const invite = pgTable("invite", {
  id: id(),
  workspaceId: wsRef(),
  instrumentId: uuid("instrument_id").notNull(),
  kind: text("kind", { enum: INVITE_KINDS }).notNull(),
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
  foreignKey({ name: "invite_instrument_fk", columns: [t.instrumentId, t.workspaceId], foreignColumns: [instrument.id, instrument.workspaceId] }).onDelete("cascade"),
  index("invite_workspace_idx").on(t.workspaceId),
  index("invite_instrument_idx").on(t.instrumentId),
  uniqueIndex("invite_token_idx").on(t.token),
  unique("invite_id_workspace_uq").on(t.id, t.workspaceId),
  unique("invite_id_instrument_uq").on(t.id, t.instrumentId),
  check("invite_kind_check", oneOf("kind", INVITE_KINDS)),
  check("invite_personal_email_check", sql`"kind" = 'public' or "email" is not null`),
  check("invite_token_length_check", sql`length("token") >= 32`),
]);

export const response = pgTable("response", {
  id: id(),
  workspaceId: wsRef(),
  instrumentId: uuid("instrument_id").notNull(),
  itemSetId: uuid("item_set_id").notNull(),
  inviteId: uuid("invite_id").notNull(),
  deviceToken: text("device_token").notNull(),
  fields: jsonb("fields").$type<ResponseFields>().notNull().default(sql`'{}'::jsonb`),
  confidence: integer("confidence"),
  signedOff: boolean("signed_off").notNull().default(false),
  submittedAt: ts("submitted_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "response_instrument_fk", columns: [t.instrumentId, t.workspaceId], foreignColumns: [instrument.id, instrument.workspaceId] }).onDelete("restrict"),
  foreignKey({ name: "response_instrument_set_fk", columns: [t.instrumentId, t.itemSetId], foreignColumns: [instrument.id, instrument.itemSetId] }).onDelete("restrict"),
  foreignKey({ name: "response_invite_fk", columns: [t.inviteId, t.workspaceId], foreignColumns: [invite.id, invite.workspaceId] }).onDelete("restrict"),
  foreignKey({ name: "response_invite_instrument_fk", columns: [t.inviteId, t.instrumentId], foreignColumns: [invite.id, invite.instrumentId] }).onDelete("restrict"),
  index("response_workspace_idx").on(t.workspaceId),
  index("response_instrument_submitted_idx").on(t.instrumentId, t.submittedAt),
  uniqueIndex("response_device_token_idx").on(t.deviceToken),
  unique("response_id_workspace_uq").on(t.id, t.workspaceId),
  unique("response_id_item_set_uq").on(t.id, t.itemSetId),
  index("response_invite_idx").on(t.inviteId),
  check("response_confidence_check", sql`"confidence" is null or ("confidence" between 1 and 5)`),
  check("response_device_token_length_check", sql`length("device_token") >= 32`),
]);

export const answer = pgTable("answer", {
  id: id(),
  workspaceId: wsRef(),
  responseId: uuid("response_id").notNull(),
  itemSetId: uuid("item_set_id").notNull(),
  itemId: uuid("item_id").notNull(),
  kind: text("kind", { enum: ANSWER_KINDS }).notNull(),
  value: text("value"),
  reason: text("reason"),
  comment: text("comment"),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "answer_response_fk", columns: [t.responseId, t.workspaceId], foreignColumns: [response.id, response.workspaceId] }).onDelete("cascade"),
  foreignKey({ name: "answer_item_fk", columns: [t.itemId, t.workspaceId], foreignColumns: [item.id, item.workspaceId] }).onDelete("restrict"),
  foreignKey({ name: "answer_response_set_fk", columns: [t.responseId, t.itemSetId], foreignColumns: [response.id, response.itemSetId] }).onDelete("cascade"),
  foreignKey({ name: "answer_item_set_fk", columns: [t.itemId, t.itemSetId], foreignColumns: [item.id, item.itemSetId] }).onDelete("restrict"),
  index("answer_workspace_idx").on(t.workspaceId),
  uniqueIndex("answer_response_item_idx").on(t.responseId, t.itemId),
  index("answer_item_idx").on(t.itemId),
  check("answer_kind_check", oneOf("kind", ANSWER_KINDS)),
]);

export const missingItem = pgTable("missing_item", {
  id: id(),
  workspaceId: wsRef(),
  responseId: uuid("response_id").notNull(),
  text: text("text").notNull(),
  suggestedArea: text("suggested_area"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "missing_item_response_fk", columns: [t.responseId, t.workspaceId], foreignColumns: [response.id, response.workspaceId] }).onDelete("cascade"),
  index("missing_item_workspace_idx").on(t.workspaceId),
  index("missing_item_response_idx").on(t.responseId),
  check("missing_item_text_check", sql`length(btrim("text")) > 0`),
]);

export const insight = pgTable("insight", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  why: text("why"),
  citedAnswerIds: uuid("cited_answer_ids").array().notNull().default(sql`'{}'::uuid[]`),
  state: text("state", { enum: INSIGHT_STATES }).notNull().default("open"),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costEurCents: integer("cost_eur_cents"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "insight_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("insight_workspace_idx").on(t.workspaceId),
  index("insight_project_idx").on(t.projectId),
  check("insight_state_check", oneOf("state", INSIGHT_STATES)),
]);

export const aiRun = pgTable("ai_run", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id"),
  purpose: text("purpose", { enum: AI_PURPOSES }).notNull(),
  model: text("model").notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  costEurCents: integer("cost_eur_cents").notNull().default(0),
  durationMs: integer("duration_ms"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "ai_run_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("ai_run_workspace_idx").on(t.workspaceId),
  index("ai_run_project_idx").on(t.projectId),
  check("ai_run_purpose_check", oneOf("purpose", AI_PURPOSES)),
]);
