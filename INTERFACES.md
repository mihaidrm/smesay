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
- PlanKey: free, pro, team, enterprise (workspace.plan, default free; E2-6). The limits per plan
  live in src/lib/plans.ts, the one place in the code that names a limit (decision 0008).
- MemberRole: owner, member.
- ItemSetSource: xlsx, csv, pasted.
- ColumnRole (E3-3): text, area, value, ref, custom, skip. ColumnMapping (jsonb,
  upload.mapping and workspace_mapping.mapping): { [column]: ColumnRole }, keyed by the
  column's header, or its letter when the file has no header; one column per text, area, value
  and ref, up to five custom. workspace_mapping is keyed by the sorted headers joined with
  U+001F (headersKey in src/lib/import/mapping.ts).
- AiPurpose: shape, insights.
- RespondentFieldSpec (jsonb, instrument.respondent_fields, array):
  { key: string, label: string, type: "text" | "dropdown", mandatory: boolean, options?: string[] }
- ClosingSpec (jsonb, instrument.closing):
  { confidence: true, missingForm: boolean, signOffText: string }
- ImportReport (jsonb, item_set.import_report):
  { emptyRows: number, exactDuplicates: number, overLimit: number, rowsRead: number, headerRow: number }
- ItemFlags (jsonb, item.flags): { duplicateOf?: string, ambiguity?: string, dismissed?: boolean }
- ResponseFields (jsonb, response.fields): { [key: string]: string }, keys from RespondentFieldSpec.
- UploadPreview (jsonb, upload.preview; E3-2): { sheets: string[], sheet: string | null,
  headerRow: number | null (1-based), columns: { letter, name }[], rows: string[][] (the first
  ten data rows), rowsRead: number }. UploadKind: xlsx, csv.

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
Members: list, listWithUsers (with name and email), countOwners, get, add, setRole, remove by
(ws, userId). workspaceInvites: the scoped six over workspace_invite (E2-4); acceptPendingInvites
(userId, email) in src/db/queries/onboarding.ts turns open invitations for the session's email
into memberships. Brand (E2-5): workspaces.publicBrand(workspaceId) gives name, accent and logo key to public
pages; aiRuns.costThisMonthCents(ws); `saveBrand()` in src/lib/brand.ts; `effectiveAccent()`
in src/lib/brand-rules.ts is what the respondent side uses; the logo is at
/brand/[workspaceId]/logo. Object storage: putObject, getObject, deleteObject in
src/lib/storage.ts, keyed by path; nothing else touches the bucket.
Projects (E3-1): projects.summaries(ws, { archived }) (each project with items, submitted,
invites and the links its status derives from), projects.setArchived(ws, id, archived),
projects.deleteSample(ws, id); the status rule is projectStatus() in src/lib/project-status.ts,
the context rule src/lib/project-context.ts.
Uploads (E3-2): uploads, the scoped six over upload plus uploads.latestForProject(ws, projectId)
(the draft the Import step shows); `saveUpload(actor, projectId, { name, bytes })` and
`rechoose(ws, uploadId, { sheet, headerRow })` in src/lib/uploads.ts, each returning
{ error } or { upload }; UPLOAD_COPY in src/lib/import/copy.ts (no database import, so the
client can use it). upload.preview is UploadPreview (above): rowsRead counts the data rows
below the chosen header row of the chosen sheet (every row when there is no header), at most
2,000 after the checks; rows holds the first ten of them. Objects are at
uploads/<workspace id>/<16 hex>.<xlsx|csv>, logos at logos/<workspace id>/..., so a workspace's
objects are its segment under each of the two prefixes (E11-2 lists both).
Usage and plans (E2-6): usage(ws, now) in src/db/queries/usage.ts (projects, responsesThisMonth,
aiRunsThisMonth, aiCostCentsThisMonth, by SQL); PLANS and withinPlan(ws, kind) in
src/lib/plans.ts; workspaces.setPlan(ws, plan) is the column change, with no screen until R3.
Permissions (E2-4): `can(role, action)` in src/lib/permissions.ts over the
Action union; `requireRole()` in src/lib/members.ts throws ForbiddenError (403). Onboarding (E2-3):
createWorkspaceWithSample(data, ownerUserId) in src/db/queries/onboarding.ts, imported by
name (not in the barrel), creates the workspace with its owner and its own copy of the sample.
The session row carries currentWorkspaceId (uuid, nullable, migration 0002), set only by
src/lib/current-workspace.ts after a membership check and read back on every request; the
current workspace is never taken from a URL alone. src/db/queries/internal.ts
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
