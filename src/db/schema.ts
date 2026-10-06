// Schema v1 (stories/E1-2-schema-v1.md, docs/schema.md). Every application table carries
// workspace_id with a foreign key to workspace, not null except on event (E13-1: sign-ups and
// deletions belong to no workspace; docs/review-list.md); child rows reference their parent on
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
import { ADMIN_ACTIONS, AUDIT_OUTCOMES, EXPORT_FILES, INSIGHT_KINDS, INSIGHT_STATES } from "./types";
import type { AuditChanges, ClosingSpec, ColumnMapping, ImportReport, ItemFlags, ProjectContext, RespondentFieldSpec, ResponseFields, ScaleLabels, ShapeArea, UploadPreview } from "./types";

export * from "./auth-schema";

export const ANSWER_KINDS = ["agree", "change", "disagree", "unclear", "pick"] as const;
export const SCORING_METHODS = ["moscow", "fit", "kcd"] as const;
export const LAYOUTS = ["chapters", "item", "page"] as const;
export const REASON_RULES = ["differs", "never", "always"] as const;
export const ANONYMITY_LEVELS = ["named", "hidden", "anonymous"] as const;
export const INVITE_KINDS = ["public", "personal"] as const;
export const READER_STATUSES = ["suggested", "accepted", "rejected"] as const;
export { INSIGHT_STATES };
export const MEMBER_ROLES = ["owner", "member"] as const;
export const ITEM_SET_SOURCES = ["xlsx", "csv", "pasted"] as const;
export const UPLOAD_KINDS = ["xlsx", "csv", "pasted"] as const;
export const AI_PURPOSES = ["shape", "insights"] as const;
export const PLAN_KEYS = ["free", "pro", "team", "enterprise"] as const;

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
  aiBudgetEur: integer("ai_budget_eur").notNull().default(10),
  // The plan (stories/E2-6): a column change switches a workspace; the limits are in
  // src/lib/plans.ts and the free entry has none while the product is validated (decision 0008).
  plan: text("plan", { enum: PLAN_KEYS }).notNull().default("free"),
  createdAt: ts("created_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
  // Who deleted it (stories/E11-2): the owner the deleted page names and the removal job emails.
  deletedBy: text("deleted_by").references(() => user.id, { onDelete: "set null" }),
  // The utm_source the first owner arrived with, cleaned (stories/E13-3; src/lib/utm.ts).
  firstSource: text("first_source"),
}, (t) => [uniqueIndex("workspace_slug_idx").on(t.slug), check("workspace_plan_check", oneOf("plan", PLAN_KEYS))]);

export const workspaceMember = pgTable("workspace_member", {
  workspaceId: wsRef(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: MEMBER_ROLES }).notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  // When this person was first shown the quickstart in this workspace (stories/E12-2): null
  // until then, so it is shown once per person per workspace.
  quickstartSeenAt: ts("quickstart_seen_at"),
}, (t) => [
  primaryKey({ columns: [t.workspaceId, t.userId] }),
  index("workspace_member_user_idx").on(t.userId),
  check("workspace_member_role_check", oneOf("role", MEMBER_ROLES)),
]);

// A pending invitation (stories/E2-4): the address has no user row yet, so it cannot be a
// workspace_member; it becomes one on the invitee's first signed-in request, through
// acceptPendingInvites() in src/db/queries/onboarding.ts. One open invite per address and
// workspace; invited_by is kept for the list, set null when that user is deleted.
export const workspaceInvite = pgTable("workspace_invite", {
  id: id(),
  workspaceId: wsRef(),
  email: text("email").notNull(),
  role: text("role", { enum: MEMBER_ROLES }).notNull().default("member"),
  invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
  invitedAt: ts("invited_at").notNull().defaultNow(),
  acceptedAt: ts("accepted_at"),
}, (t) => [
  uniqueIndex("workspace_invite_email_uq").on(t.workspaceId, t.email),
  index("workspace_invite_email_idx").on(t.email),
  check("workspace_invite_role_check", oneOf("role", MEMBER_ROLES)),
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
  // Set by the helpers that change the project (stories/E3-1 audit, finding 7): the list's
  // Updated column reads it.
  updatedAt: ts("updated_at").notNull().defaultNow(),
  archivedAt: ts("archived_at"),
}, (t) => [
  index("project_workspace_idx").on(t.workspaceId),
  index("project_created_by_idx").on(t.createdBy),
  unique("project_id_workspace_uq").on(t.id, t.workspaceId),
]);

// A file a PM uploaded for a project (stories/E3-2): the object in the bucket under the
// workspace's prefix, what the server found in it (the sheet, the header row, a ten-row preview
// in jsonb, UploadPreview in INTERFACES.md), and who uploaded it. The import commit (E3-5)
// makes the item set from it; until then it is a draft the Import step shows.
export const upload = pgTable("upload", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id").notNull(),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  kind: text("kind", { enum: UPLOAD_KINDS }).notNull(),
  byteSize: integer("byte_size").notNull(),
  sheet: text("sheet"),
  headerRow: integer("header_row"),
  preview: jsonb("preview").$type<UploadPreview>().notNull(),
  // The mapping of this upload's columns (stories/E3-3), ColumnMapping in INTERFACES.md; null
  // until the preview has columns.
  mapping: jsonb("mapping").$type<ColumnMapping>(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "upload_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("upload_project_idx").on(t.projectId),
  unique("upload_id_workspace_uq").on(t.id, t.workspaceId),
  check("upload_kind_check", oneOf("kind", UPLOAD_KINDS)),
]);

// A column mapping remembered per workspace (stories/E3-3, acceptance 3), keyed by the sorted
// list of headers (src/lib/import/mapping.ts, headersKey): the next file with the same headers
// maps itself.
export const workspaceMapping = pgTable("workspace_mapping", {
  id: id(),
  workspaceId: wsRef(),
  headersKey: text("headers_key").notNull(),
  mapping: jsonb("mapping").$type<ColumnMapping>().notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("workspace_mapping_headers_idx").on(t.workspaceId, t.headersKey),
]);

export const itemSet = pgTable("item_set", {
  id: id(),
  workspaceId: wsRef(),
  projectId: uuid("project_id").notNull(),
  version: integer("version").notNull(),
  source: text("source", { enum: ITEM_SET_SOURCES }).notNull(),
  sourceFilename: text("source_filename"),
  importReport: jsonb("import_report").$type<ImportReport>(),
  // Who imported (stories/E3-6, the import log); the upload the set came from (E3-5), null for
  // the sample and for sets made before E3-5.
  importedBy: text("imported_by").references(() => user.id, { onDelete: "set null" }),
  uploadId: uuid("upload_id"),
  importedAt: ts("imported_at").notNull().defaultNow(),
  // Shaping (stories/E4-2; ShapeState in INTERFACES.md): the areas in the model's order with
  // their rationale, how many runs, when the last one was.
  areas: jsonb("areas").$type<ShapeArea[]>(),
  shapeRuns: integer("shape_runs").notNull().default(0),
  shapedAt: ts("shaped_at"),
  // The project context the last run was given (stories/E4-5), so the page says what was
  // used, not what the project says now.
  contextUsed: jsonb("context_used").$type<ProjectContext>(),
}, (t) => [
  foreignKey({ name: "item_set_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  // No delete action: "set null" on a composite key would null workspace_id too (E3-4 audit,
  // finding 3). An upload that became a version is not deleted on its own; the workspace
  // deletion cascades through both tables.
  foreignKey({ name: "item_set_upload_fk", columns: [t.uploadId, t.workspaceId], foreignColumns: [upload.id, upload.workspaceId] }),
  index("item_set_workspace_idx").on(t.workspaceId),
  uniqueIndex("item_set_project_version_idx").on(t.projectId, t.version),
  // One set per upload (stories/E3-5; E3-5 audit, finding 1): a replayed Import form cannot
  // write a second, identical version.
  uniqueIndex("item_set_upload_idx").on(t.uploadId),
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
  // E5-4: the perspectives this item is shown to; empty means everyone.
  perspectives: text("perspectives").array().notNull().default(sql`'{}'::text[]`),
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
  // E5-2 (2026-10-05, design note 98): when an answer needs its reason, question or comment
  // written to count as complete (INTERFACES.md ReasonRule); existing rows take "differs".
  reasonRule: text("reason_rule", { enum: REASON_RULES }).notNull().default("differs"),
  // E5-7 (2026-10-06, design note 100): who sees whose answers (INTERFACES.md Anonymity);
  // existing rows take "named".
  anonymity: text("anonymity", { enum: ANONYMITY_LEVELS }).notNull().default("named"),
  respondentFields: jsonb("respondent_fields").$type<RespondentFieldSpec[]>().notNull().default(sql`'[]'::jsonb`),
  // E5-2: the PM's labels for the scale's values, by code; null means the defaults.
  scaleLabels: jsonb("scale_labels").$type<ScaleLabels>(),
  // E5-4: the perspective names respondents pick from; empty means the question is not asked.
  perspectives: jsonb("perspectives").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  closing: jsonb("closing").$type<ClosingSpec>().notNull().default(sql`'{"confidence": true, "missingForm": true, "signOffText": ""}'::jsonb`),
  // E6-1: set when the first public link is created; null on a draft.
  publishedAt: ts("published_at"),
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
  check("instrument_reason_rule_check", oneOf("reason_rule", REASON_RULES)),
  check("instrument_anonymity_check", oneOf("anonymity", ANONYMITY_LEVELS)),
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
  // E6-2: when the last send of the personal invite's email started (the row is that
  // request's for RESEND_AFTER_MINUTES), when it went out, and the provider's reason when
  // it did not.
  sendStartedAt: ts("send_started_at"),
  sentAt: ts("sent_at"),
  sendError: text("send_error"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "invite_instrument_fk", columns: [t.instrumentId, t.workspaceId], foreignColumns: [instrument.id, instrument.workspaceId] }).onDelete("cascade"),
  index("invite_workspace_idx").on(t.workspaceId),
  index("invite_instrument_idx").on(t.instrumentId),
  uniqueIndex("invite_token_idx").on(t.token),
  // E6-2: one personal invite per address on an instrument (two sends at once cannot both
  // create one; partial unique index: postgresql.org/docs/current/indexes-partial.html).
  uniqueIndex("invite_personal_email_idx").on(t.instrumentId, t.email).where(sql`${t.kind} = 'personal'`),
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
  // E5-4: the perspectives the respondent picked on About you.
  perspectives: text("perspectives").array().notNull().default(sql`'{}'::text[]`),
  confidence: integer("confidence"),
  signedOff: boolean("signed_off").notNull().default(false),
  submittedAt: ts("submitted_at"),
  // E7-5: the first Submit (submitted_at is the latest), the closing question's answer and
  // the sign-off sentence the respondent ticked (INTERFACES.md, Response schema v2).
  firstSubmittedAt: ts("first_submitted_at"),
  closingAnswer: text("closing_answer"),
  signOffText: text("sign_off_text"),
  // E7-5: the Wrap up's version (its confidence, closing answer and missing item), counted up
  // on every write, the open page that wrote it last and that page's number for the write; the
  // same rule as an answer's (below; src/db/queries/responses.ts).
  wrapVersion: integer("wrap_version").notNull().default(0),
  wrapWriter: text("wrap_writer"),
  wrapWriterSeq: integer("wrap_writer_seq").notNull().default(0),
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
  // E7-3: the answer's version, counted up on every write, the open page that wrote it last
  // and that page's number for the save. A write lands when it was made on the stored version,
  // comes from the same page with a higher number, or names the writer's save among the saves
  // it was made on top of (src/db/queries/answers.ts).
  version: integer("version").notNull().default(0),
  writer: text("writer"),
  writerSeq: integer("writer_seq").notNull().default(0),
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
  // E7-5: a code of the instrument's scale, or null.
  suggestedValue: text("suggested_value"),
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
  // E9-1 (decision 0033): the missing items an action cites, and its kind (null for rows from
  // before E9-1).
  citedMissingItemIds: uuid("cited_missing_item_ids").array().notNull().default(sql`'{}'::uuid[]`),
  kind: text("kind", { enum: INSIGHT_KINDS }),
  state: text("state", { enum: INSIGHT_STATES }).notNull().default("open"),
  // E9-2: when and by whom an action was marked done or dismissed (null while open).
  closedAt: ts("closed_at"),
  closedBy: text("closed_by").references(() => user.id, { onDelete: "set null" }),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costEurCents: integer("cost_eur_cents"),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "insight_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("insight_workspace_idx").on(t.workspaceId),
  index("insight_project_idx").on(t.projectId),
  index("insight_closed_by_idx").on(t.closedBy),
  check("insight_state_check", oneOf("state", INSIGHT_STATES)),
  check("insight_kind_check", sql`"kind" is null or ${oneOf("kind", INSIGHT_KINDS)}`),
  // An open action has no closed date; a done or dismissed one has one (E9-2).
  check("insight_closed_check", sql`("state" = 'open') = ("closed_at" is null)`),
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

// E10-1, acceptance 5: every download, who made it, when and what (the file, the filter in
// words, the rows), for E11-2's account of a workspace's data leaving it. Kept with the
// workspace; a deleted user keeps the row with no name.
export const exportLog = pgTable("export_log", {
  id: id(),
  workspaceId: wsRef(),
  // Null for Export everything (stories/E11-2), which is the whole workspace.
  projectId: uuid("project_id"),
  madeBy: text("made_by").references(() => user.id, { onDelete: "set null" }),
  file: text("file", { enum: EXPORT_FILES }).notNull(),
  filter: text("filter"),
  rows: integer("rows").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  foreignKey({ name: "export_log_project_fk", columns: [t.projectId, t.workspaceId], foreignColumns: [project.id, project.workspaceId] }).onDelete("cascade"),
  index("export_log_workspace_idx").on(t.workspaceId),
  index("export_log_project_idx").on(t.projectId),
  index("export_log_made_by_idx").on(t.madeBy),
  check("export_log_file_check", oneOf("file", EXPORT_FILES)),
]);

// Product events (stories/E13-1): one row per step that matters, named from the catalogue in
// src/lib/analytics-catalogue.ts and written only by track() (src/lib/analytics.ts). No personal
// data: the properties are counts, ids and fixed values. workspace_id is null for an event before
// any workspace exists (signed_up); a deleted workspace's events go with it (the cascade, E11-2).
// user_id is null for respondent events and goes null when the user row is removed.
export const event = pgTable("event", {
  id: id(),
  workspaceId: uuid("workspace_id").references(() => workspace.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  properties: jsonb("properties").$type<Record<string, string | number>>().notNull().default({}),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("event_name_created_idx").on(t.name, t.createdAt),
  index("event_workspace_idx").on(t.workspaceId),
  index("event_user_idx").on(t.userId),
  // Respondent events never carry a user (stories/E13-1, acceptance 2), held in the database
  // too: src/lib/analytics-catalogue.ts RESPONDENT_EVENTS.
  check("event_respondent_no_user_check", sql`${t.name} not in ('link_opened', 'response_started', 'response_submitted') or ${t.userId} is null`),
]);


// What admins did (stories/E14-1): one row per admin action, written before the action runs
// and marked with its outcome after (src/db/queries/admin.ts audited), so no action runs without
// its row. No workspace_id of its own and no foreign keys:
// the target is a column, and a row outlives its target and its admin, so the log shows
// "deleted" rather than losing the line. changes holds ids and fixed values, never a secret and
// never respondent text.
export const adminAudit = pgTable("admin_audit", {
  id: id(),
  adminUserId: text("admin_user_id").notNull(),
  action: text("action", { enum: ADMIN_ACTIONS }).notNull(),
  targetWorkspaceId: uuid("target_workspace_id"),
  targetUserId: text("target_user_id"),
  changes: jsonb("changes").$type<AuditChanges>().notNull().default({}),
  outcome: text("outcome", { enum: AUDIT_OUTCOMES }),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("admin_audit_created_idx").on(t.createdAt),
  index("admin_audit_workspace_idx").on(t.targetWorkspaceId),
  index("admin_audit_admin_idx").on(t.adminUserId),
  check("admin_audit_action_check", oneOf("action", ADMIN_ACTIONS)),
  check("admin_audit_outcome_check", sql`${t.outcome} is null or ${oneOf("outcome", AUDIT_OUTCOMES)}`),
  check("admin_audit_target_check", sql`${t.targetWorkspaceId} is not null or ${t.targetUserId} is not null`),
]);

// Support notes (stories/E14-2, acceptance 3): free text an admin writes on a workspace, shown
// only on its admin page. Goes with the workspace (the cascade, E11-2). The admin is a plain
// column, like admin_audit's, so a note outlives its writer.
export const adminNote = pgTable("admin_note", {
  id: id(),
  workspaceId: wsRef(),
  adminUserId: text("admin_user_id").notNull(),
  text: text("text").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
}, (t) => [
  index("admin_note_workspace_idx").on(t.workspaceId),
  check("admin_note_text_check", sql`char_length(${t.text}) between 1 and 2000`),
]);
