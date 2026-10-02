# Interfaces between components

Add an entry whenever two builders depend on each other. Each entry: owner, consumer, shape,
version, date. Change the shape here first, then the code.

## Schema v1 enums and shapes (database -> every epic)
Owner: E1-2. Consumers: every query helper, the builder, the respondent app, the dashboard,
exports. Written before the migration is generated (stories/E1-2-schema-v1.md).
Version 1, 2026-10-01. The code twin is src/db/schema.ts (the arrays are exported from there and
the check constraints use them). Change this file first.

- AnswerKind: agree, change, disagree, unclear, pick (decisions 0014, 0018). `pick` is the
  rate-blind answer: a value with no proposal to agree with.
- ScoringMethod: moscow, fit, kcd.
- Layout: chapters, item, page (decision 0016).
- InviteKind: public, personal.
- ReaderStatus: suggested, accepted, rejected (E4; an item imported without AI has null).
- InsightState: open, done, dismissed.
- MemberRole: owner, member.
- ItemSetSource: xlsx, csv, pasted.
- AiPurpose: shape, insights.
- RespondentFieldSpec (jsonb, instrument.respondent_fields, array):
  { key: string, label: string, type: "text" | "dropdown", mandatory: boolean, options?: string[] }
- ClosingSpec (jsonb, instrument.closing):
  { confidence: true, missingForm: boolean, signOffText: string }
- ImportReport (jsonb, item_set.import_report):
  { emptyRows: number, exactDuplicates: number, overLimit: number, rowsRead: number, headerRow: number }
- ItemFlags (jsonb, item.flags): { duplicateOf?: string, ambiguity?: string, dismissed?: boolean }
- ResponseFields (jsonb, response.fields): { [key: string]: string }, keys from RespondentFieldSpec.

## Query helpers (database -> every route and page)
Owner: E1-3. Consumers: every route, page, server action and the seed. Version 1, 2026-10-02.
Code: src/db/queries/. Every table helper takes a WorkspaceId first (src/db/types.ts, a
branded string that only `requireWorkspace(headers, workspaceId)` in src/lib/workspace.ts
produces from the session); a plain string from a URL or a body is a type error, and a cast
to WorkspaceId or never fails lint outside tests. Each table exports list(ws), get(ws, id),
count(ws), create(ws, data), update(ws, id, patch), remove(ws, id); get, update and remove
return null when the row is not in that workspace or the id is not a uuid; create and update
keep only the table's columns, never `id` or `workspaceId`, and refuse a non-uuid parent id
with 404. Workspaces: listForUser(userId), getForUser(userId, workspaceId), create(data,
ownerUserId), update(ws, patch) (name, slug, accent, logo, budget only), markDeleted(ws).
Members: list, get, add, setRole, remove by (ws, userId). src/db/queries/internal.ts
(getWorkspaceById, createEmptyWorkspace, hardDeleteWorkspace, requireWorkspaceForUser) takes
no session and is importable only from src/db and src/lib/workspace.ts. Importing "@/db",
"@/db/schema", drizzle-orm or postgres outside src/db/ fails lint for every import spelling
tested (src/db/queries/lint-rule.test.ts); what src/db/queries/ exports is the reviewer's
reading.

## Response schema (runtime -> dashboard, runtime -> exports)
Owner: runtime. Consumers: dashboard, exports, offline import.
Status: to be written in E7, on top of the E1-2 shapes.

## AI shaping output (ai -> builder)
Owner: ai route. Consumer: builder review view.
Status: JSON schema in evals/schema.json, to be written with E4.
