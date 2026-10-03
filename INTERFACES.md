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
  { key: string, label: string, type: "text" | "dropdown" | "email", mandatory: boolean,
  options?: string[] } (E5-1, 2026-10-03: `email` added for the submission receipt,
  docs/copy/emails.md email 4; the key is the label's slug, unique per instrument, suffixed
  -2, -3 when two labels slug the same; label 1 to 60 characters, up to 8 fields, a dropdown
  has 2 to 20 options, each up to 60 characters and different from the others ignoring
  case; src/lib/respondent-fields.ts is the code twin of the rule).
- ClosingSpec (jsonb, instrument.closing):
  { confidence: true, missingForm: boolean, signOffText: string }
- ImportReport (jsonb, item_set.import_report):
  { emptyRows: number, exactDuplicates: number, overLimit: number, rowsRead: number, headerRow:
  number (0 when the file had none), unrecognisedValues: number, duplicateRefs: { kept: string,
  folded: string[] }[] } (E3-5; kept is the reference of the item kept, or "row N").
- ImportRow (not stored; src/lib/import/report.ts, E3-4 and E3-5): the row shape the check
  and the commit read, from a file or a pasted list: { row, ref, text, area, value, custom,
  foldedRefs }.
- ItemFlags (jsonb, item.flags): { duplicateOf?: string (E4-4; the position of the other item
  in the set, as a string, shown by its source reference), ambiguity?: string (up to 300
  characters, whitespace folded), dismissed?: boolean (E4-4: the PM dismissed the item's
  flags; it stays whatever the model says on later runs, so a later flag on that item is
  not shown), foldedRefs?: string[] (E3-5: the references of the exact
  duplicates folded into this item), areaBy?: "ai" | "pm" (E4-2: who put the item in its
  area; "ai" the model, placed again on a re-run and, when the import had an area column,
  shown as "Placed by AI"; "pm" a move, left alone by a re-run; absent, the area came with
  the import and the model may not move it), importedArea?: string (E4-2: the area the item
  came with, written at the first run and kept whatever happens to item.area, so a moved
  item still says where it came from and the pills know the import had areas) }
- ShapeState (E4-2, on item_set): areas jsonb ShapeArea[] = { name, rationale }[] (the areas
  in the model's order, each with its one-sentence rationale; an area the PM has emptied
  stays until the next run; null until shaped), shape_runs integer (how many times shaping
  ran on this set, default 0), shaped_at timestamp (the last run, null until shaped),
  context_used jsonb ProjectContext = { goal, terms } (E4-5: what the last run was given,
  null fields when the project had none; null until shaped). Each item also carries its
  area's rationale as item.area_rationale, for the respondent side.
- ResponseFields (jsonb, response.fields): { [key: string]: string }, keys from RespondentFieldSpec.
- GuideState (jsonb, user.guide_state; E15-1, written 2026-10-03, column added with that
  story): { tipsOff: boolean, dismissed: string[] } (the ids of docs/copy/guide.md the
  person dismissed; per person, every workspace).
- UploadPreview (jsonb, upload.preview; E3-2): { sheets: string[], sheet: string | null,
  headerRow: number | null (1-based), columns: { letter, name }[], rows: string[][] (the first
  ten data rows), rowsRead: number }. UploadKind: xlsx, csv, pasted (E3-4: a pasted list is
  stored as text with three columns, Item, Area, Proposed value, and no header row).

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
ownerUserId), update(ws, patch) (name, slug, accent, logo only; the AI budget is
internal.setAiBudgetEur, decision 0036), markDeleted(ws).
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
uploads/<workspace id>/<16 hex>.<xlsx|csv|txt> (txt for a pasted list, `savePaste()` in
src/lib/uploads.ts), logos at logos/<workspace id>/..., so a workspace's objects are its
segment under each of the two prefixes (E11-2 lists both).
Import (E3-5, E3-6): `checkUpload(upload)`, `commitUpload(ws, uploadId, userId)` (one set per
upload), `importLog(ws, projectId)` and `latestSet(ws, projectId)` in src/lib/imports.ts;
`commitImport(ws, input)` in src/db/queries/importCommit.ts (imported by name, the one
transaction); itemSets.versions(ws, projectId) (every set with its item count and importer).
Usage and plans (E2-6): usage(ws, now) in src/db/queries/usage.ts (projects, responsesThisMonth,
aiRunsThisMonth, aiCostCentsThisMonth, by SQL); internal.productAiCostCentsThisMonth(now),
the product's spend across every workspace for the cap of decision 0036 (a sum, never a row,
in the fenced module); PLANS and withinPlan(ws, kind) in
src/lib/plans.ts; workspaces.setPlan(ws, plan) is the column change, with no screen until R3.
Permissions (E2-4): `can(role, action)` in src/lib/permissions.ts over the
Action union; `requireRole()` in src/lib/members.ts throws ForbiddenError (403). Onboarding (E2-3):
createWorkspaceWithSample(data, ownerUserId) in src/db/queries/onboarding.ts, imported by
name (not in the barrel), creates the workspace with its owner and its own copy of the sample.
The session row carries currentWorkspaceId (uuid, nullable, migration 0002), set only by
src/lib/current-workspace.ts after a membership check and read back on every request; the
current workspace is never taken from a URL alone. src/db/queries/internal.ts
(getWorkspaceById, createEmptyWorkspace, hardDeleteWorkspace, productAiCostCentsThisMonth,
setAiBudgetEur, requireWorkspaceForUser) takes no session and is importable only from src/db,
src/lib/workspace.ts and src/lib/ai/client.ts with its test (decision 0036). Importing "@/db",
"@/db/schema", drizzle-orm or postgres outside src/db/ fails lint for every import spelling
tested (src/db/queries/lint-rule.test.ts); what src/db/queries/ exports is the reviewer's
reading.

## Response schema (runtime -> dashboard, runtime -> exports)
Owner: runtime. Consumers: dashboard, exports, offline import.
Status: to be written in E7, on top of the E1-2 shapes.

## AI shaping output (ai -> builder)
Owner: ai route. Consumer: builder review view.
Version 1, 2026-10-02 (E4-2). The zod schema is ShapeOutput in src/lib/ai/shape-schema.ts;
evals/schema.json is written from it (`npm run evals:schema`, and a test fails when they
differ). Every object strict. Refs are the item positions in the set as decimal strings
("1", "2", ...), never the source reference, which can repeat or be missing.
{ areas: [{ name: string (1 to 60 chars), rationale: string (1 to 200 chars), items: string[]
(refs, at least one) }] (1 to 12 areas), items: [{ ref: string, reader: string (1 to 1,000
chars, the plain-words version, E4-3), flags: { ambiguity: string (up to 300 chars, what the
item does not say, E4-4) | null, duplicateOf: string (a ref, E4-4) | null } }] }
The app checks on top of the schema (src/lib/shaping.ts, checkShape): every item of the set
appears in exactly one area and in items once; no unknown ref in areas or items; area names
trimmed, none blank, no two the same (case folded); when the import carried an area column,
the area names are the imported ones, unchanged, and every item that came with an area is
still in it; when it did not, 3 to 8 areas, among them every area the PM moved an item into
(the item is sent as "keep in" and stays there). A failed check is E4-1's "invalid" refusal. A
duplicateOf that names an unknown ref, the item itself or a later item is dropped, not
refused (E4-4, acceptance 4). Before the call: more than 12 imported areas, an imported area
name over 60 characters, more than 400 items, or a prompt over E4-1's 500,000 characters are
refused with their own messages (docs/copy/errors.md, Shaping).
The route (E4-1): `runModel({ ws, projectId, purpose, instructions, data, schema, check,
maxOutputTokens? }, deps?)` in src/lib/ai/client.ts, the only file that reads
ANTHROPIC_API_KEY or imports the SDK (lint rule smesay/ai-sdk, which also keeps the module
out of "use client" files). It returns `{ ok: true, output, run }` (run: id, model, tokensIn,
tokensOut, costEurCents, durationMs) or `{ ok: false, reason: "paused" | "budget" | "plan" |
"rateLimited" | "failed" | "invalid", message, detail }` (paused: the product's monthly cap,
ANTHROPIC_MONTHLY_BUDGET_EUR, decision 0036; budget: the workspace's); message is what the screen shows
(AI_COPY in src/lib/ai/copy.ts, no database import), detail is for the server log (codes and
paths from the route, plus the caller's check reason, which the caller keeps free of list text). The instructions are the system prompt; data is
its own content block of the user message; every object in the schema is a z.strictObject
(checked at the call, src/lib/ai/strict.ts) and the answer is validated against it after the
API's structured output; check(output), required, returns the reason to refuse or null.
Ceilings: 500,000 input characters and 16,000 output tokens; a caller over them gets an
Error. Every call is an ai_run row, answered or not (zero tokens when not; usage() counts
them). The price table, the default model and the euro rate, with the dates they were read,
are in src/lib/ai/prices.ts; costEurCents(model, tokensIn, tokensOut) rounds up to the cent.
Shaping (E4-2): `shapeSet(actor, projectId)`, `moveItemTo(actor, projectId, itemId, area)`,
`groupByArea(set, rows)`, `areaNames(set, rows)` in src/lib/shaping.ts; `applyShaping` and
`moveItem` in src/db/queries/shaping.ts; `items.forSet(ws, setId)`. Reader versions (E4-3):
`decideReader(actor, projectId, itemId, "accept" | "reject" | "undo")`, `editReader(actor,
projectId, itemId, text)` (accepts the edited text, blank refused), `decideAllReaders(actor,
projectId, "accept" | "reject")` over the latest set's suggested versions in one update;
`textFor(item)` in src/lib/item-text.ts (no database import) is the one rule for which text
an item shows: the reader version only where reader_status is accepted, else the original;
`hasReaderVersion`, `readerIsOriginal`, `readerCounts` beside it. The respondent side (E7)
and the preview (E5-6) read textFor(). Flags (E4-4): `flagsFor(rows)` (one ItemFlag per
flag, an item with both has two; dismissed items and duplicates whose target left the set
dropped), `dismissFlag(actor, projectId, itemId)` on `dismissItemFlags`. The ambiguity text
is stored with its whitespace folded and dropped when blank. Project context (E4-5):
`contextBlock({ goal, terms })` in src/lib/ai/context.ts gives the PROJECT CONTEXT data
section (null when both are blank), `contextOf()` the two fields folded, and
CONTEXT_INSTRUCTION the instruction for the system prompt, purpose-neutral and saying the
section is data; each prompt adds its own line on what the goal is for. buildShapePrompt
(items, context) puts the section before AREAS and the list; E9's insights prompt reuses
contextBlock and CONTEXT_INSTRUCTION the same way. shapeSet stores the context it sent on
the set (context_used); `contextLine(set, project)` says what the page shows: used, next,
none, and whether Import's context changed since the run.
