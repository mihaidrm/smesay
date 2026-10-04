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
  options?: string[] } (E5-1, 2026-10-03: `email` added for the submission receipt; from E7-5
  the receipt goes only to a personal invite's address, so an email field is a field like
  the others, docs/copy/emails.md email 4; the key is the label's slug, unique per instrument, suffixed
  -2, -3 when two labels slug the same; label 1 to 60 characters, up to 8 fields, a dropdown
  has 2 to 20 options, each up to 60 characters and different from the others ignoring
  case; src/lib/respondent-fields.ts is the code twin of the rule).
- ClosingSpec (jsonb, instrument.closing; E5-5, 2026-10-03):
  { confidence: true, missingForm: boolean, signOffText: string, closingQuestion?: string }
  (confidence is always true and the server refuses false; missingForm defaults to true;
  signOffText 1 to 300 characters, where "" on a row means the default sentence in
  src/lib/closing.ts; closingQuestion 1 to 200 characters, absent means no question. The
  PM's words are theirs: the only copy rule applied at save time is no em dash. The rule is
  parseClosing() in src/lib/closing.ts. Once published the question locks, since its
  answers are stored per response (response.closing_answer, E7-5); the form and the
  sign-off text still change.)
- Perspectives (E5-4, 2026-10-03): instrument.perspectives jsonb string[] (the names
  respondents pick from, up to 10, each 1 to 30 characters, unique ignoring case; empty
  means About you asks nothing); item.perspectives text[] (the names this item is shown
  to; empty means everyone; every name is one of its instrument's); response.perspectives
  text[] (what the respondent picked). The visible set is visibleItems() in
  src/lib/perspectives.ts: the items with no perspective plus those sharing one with the
  respondent's picks; E7 reads it for one respondent. Its SQL twin, for E8's counts over
  500 rows (build rule: aggregates in SQL), is
  `item.perspectives = '{}' OR item.perspectives && response.perspectives`. The names and
  the tags lock once the instrument is published, like the method.
- ScaleLabels (jsonb, instrument.scale_labels, nullable; E5-2, 2026-10-03): { [code]: label }
  for the codes of the instrument's method (moscow: M, S, C, W; fit: 1, 2, 3, 4, 5; kcd: K,
  C, D), each label 1 to 20 characters; a code not present keeps the default label; null
  means every default. The stored answer value is always the code (answer.value), never the
  label (stories/E5-2, acceptance 3). The codes, the default labels, the captions and the
  mapping from (method, showProposed, proposed code, picked code) to AnswerKind are in
  src/lib/scoring.ts, shared by Build, the respondent app (E7-2) and Results (E8).
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
- ResultsFilter (not stored; E8-1, written 2026-10-03, design note 40): the one parameter
  every results query and both CSV exports take: { fields?: { [key]: string[] | string }
  (a dropdown field's chosen options, or a text field's contains), kinds?: AnswerKind[]
  plus "none" for not answered, withComment?: boolean, perspective?: string, status?:
  ("submitted" | "inProgress")[], includeUnsubmitted: boolean, sort?: { key, dir } }; it
  travels in the URL as query parameters and is parsed by one function in
  src/lib/results-filter.ts (the sort key a whitelist).
- ResultsPrefs (jsonb, user.results_prefs; E8-1, column added with that story):
  { [instrumentId]: { tiles: string[] (the tile ids of E8-1's catalogue, up to six), view:
  "table" | "columns" | "share" } }.
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
Links (E6-1): invites.publicForInstrument(ws, instrumentId), invites.livePublic(ws,
projectId) (the project's link in force: the newest instrument's that has one),
invites.publish(ws, instrumentId, { token, opensAt, closesAt, passcodeHash }, now) (one
public link per instrument, created under the instrument row's lock; an existing one comes
back with created: false; sets instrument.published_at and closes the project's older
public links at `now`), invites.updatePublic(ws, instrumentId, inviteId, patch) (the row the
page showed; E6-4); instruments.updateLocked(ws, instrumentId,
(published) => patch | null), the same lock, so saveScoring and saveClosing decide under it,
and setPerspectives and tagItem refuse under it once an invite exists (E6-1, acceptance 5).
Personal invites (E6-2): invites.personalWithStatus(ws, instrumentId) (each row with
responseStatus none, inProgress or submitted and answeredAt), invites.personalByEmail(ws,
instrumentId, email); invite.send_started_at, invite.sent_at and invite.send_error (migration 0016; sent_at null:
Not sent) and the partial unique index
invite_personal_email_idx on (instrument_id, email) where kind = 'personal'.
invites.createPersonal(ws, instrumentId, people, now) (one insert under the instrument row
then the project row, both FOR NO KEY UPDATE, publish's order; the public link checked
there as the project's link in force, not revoked, not closed at now, its dates on the rows;
ON CONFLICT DO NOTHING on the partial index; returns { created } or { refused: none |
replaced | revoked | closed }, null outside the workspace);
invites.countPersonalSince(ws, minutes, now) (the 500 per 24 hours limit); invites.claimResend(ws,
id, { name, roleHint }, now) (one statement that moves invite.send_started_at: a Not sent
row whose send failed, or one whose last send started RESEND_AFTER_MINUTES before now with
no outcome); invites.updatePublic
copies a date change to the instrument's personal links and invites.publish closes the
older instruments' personal links with their public one.
sendInvites(ws, projectId, instrumentId, rawList, sender, baseUrl, now, send) in
src/lib/invitees.ts (outcomes: email, line, sent, error, in the order pasted), with
refusalCopy(refused), cutServers(line) and reasonOf(error) beside it; parseInvitees and minutesFor in src/lib/invitees-rules.ts;
inviteEmail(input) in src/lib/mail/invite-email.ts (InviteEmailInput: pmName, workspaceName,
projectName, respondentName, itemCount, minutes, intro, url, opensAt when the link opens
after the send, closesAt); sendMail() takes fromName and replyTo.
Reminders (E6-3): invites.claimReminder(ws, id, now, minHours) (one statement: reminders_sent
+ 1 and last_reminder_at = now on a sent, unrevoked personal invite whose last reminder is
minHours old or none, and the newest response not submitted; null when refused),
invites.unclaimReminder(ws, id, claimedAt, previous) (only while claimedAt is on the row);
responses.forInvite(ws, inviteId) (the newest); answers.countForResponse(ws, responseId);
remindInvitee(ws, projectId, instrumentId, inviteId, sender, baseUrl, now, send) and
remindAll(...) in src/lib/reminders.ts (outcomes: email, sent, error); canRemind(row, now)
and REMIND_AFTER_HOURS in src/lib/reminders-rules.ts; reminderEmail(input) in
src/lib/mail/reminder-email.ts; formatUtc now lives in src/lib/sharing-format.ts.
The kill switch (E6-4): invites.revokePublic(ws, instrumentId, inviteId, now) (the project's
link in force, under the project row's lock, when it is the row named; refused: none,
replaced, revoked, changed), invites.revokePersonal(ws, id, token, now) (the row's token, read
on the server; the page carries linkMark(token), a 16-character hash), invites.renewPersonal(ws, instrumentId, id, token, now) (under the instrument and
project locks with the link in force checked as createPersonal does: a revoked personal
row gets a fresh token, the link's dates, no revocation, not sent yet; refused: none,
replaced, revoked, closed, notRevoked); invites.publish creates a new row when the newest
public row is revoked and puts its dates on the open personal rows; invites.updatePublic
refuses "revoked" and, with its new inviteId argument, "changed" for a row no longer in
force; invites.claimResend skips revoked rows. revokeLink(ws, projectId, instrumentId,
inviteId, now) and saveLink(ws, projectId, instrumentId, inviteId, ...) in src/lib/sharing.ts;
revokeInvitee(ws, projectId, instrumentId, inviteId, mark, now), linkMark(token) and
renewInvitee(ws, projectId, instrumentId, inviteId, sender, baseUrl, now, send) in
src/lib/invitees.ts. linkStatus(token, cookie, now) in src/lib/link-access.ts
({ status: 200 | 404 | 410, state }) and GET /r/[token]/state (the same, as JSON { state },
no-store); LINK_POLL_SECONDS = 60 in src/app/r/[token]/link-watch.tsx.
The respondent journey (E7-1): loadRespondent(token, { passcode, device }, now) in
src/lib/respondent.ts (the link's page kind: unknown, sample, notOpen, closed, closedOwn,
closedSubmitted (E7-6: a closed personal link with a submitted response, its submitted and
closed times), revoked, passcode, or ready with the device's response, the items and areas,
the answers, from E7-3 each answer's version, and from E7-5 the Wrap up with its version);
from E7-6 changedAfterSubmit(response) and changedSinceSubmit(response) in
src/lib/respondent-rules.ts for the tracker (E8-2): the last save after the first Submit,
and submitted but not signed off (every change after a Submit takes the sign-off back; a
write that changes nothing, a Submit that carries no change and a Start that changes nothing
move neither; responses.restart moves the last save forward only). The saves of an answer and
of the Wrap up (taken or stale), Start and a stale Submit answer changedSince
(changedSinceSubmit of the response after the write) and submittedAt (its latest Submit,
ISO, or null). Between two Submits changedSince only goes from false to true, so the page
counts a true for the Submit it names and shows "You changed answers after submitting.
Submit again to send them." while that is the latest Submit it has heard of (heardSubmit),
whatever order the answers arrive in;
startResponse(token, cookies, body, now) (POST /r/[token]/start, JSON { fields,
perspectives }; refusals 404, 403, 409, 410, 422 with the sentence, and from the route 415
not JSON, 413 over 16 KB, 400 not parsable, by readJson in src/lib/request-json.ts; a
public link's first Start returns the device token for the smesay-device cookie on the
link's path);
openLinkFor(token, cookies, now) (the same check for every respondent write);
responses.forDevice(ws, inviteId, deviceToken), responses.startPersonal(ws, data,
stillOpen) (one response per personal invite, under the invite row's lock) and
responses.createPublic(ws, data, stillOpen) (under a shared lock), both returning
{ refused: dates } when the link stopped being open, answers.forResponse(ws,
responseId). Answers (E7-2): saveAnswer(token, cookies, body, now) in src/lib/respondent.ts
(PUT /r/[token]/answers, JSON { itemId, picked, reason, comment, base, page, seq, after,
response } from E7-3; 200 { saved, kind, complete, version, writer, writerSeq, changedSince,
submittedAt (E7-6) }; 409 stale with the stored answer, changedSince and submittedAt, see
Response schema; refusals as Start's, 409 with a sentence when this device has no response or not
the one named, 422
for a malformed body, a reason or comment over 2,000 characters, an item not in the
respondent's list or a value off the scale); answers.upsert(ws, inviteId, data, stillOpen,
now) (one answer per response and item; from E7-3 a write lands on the version it was made
on, after the same page's earlier save, or after a save it names in after (or an earlier one
of that page), and returns { stale } with the stored answer otherwise; under a shared lock on the invite and an
update lock on the response, so writes for one response run in order). Client-safe rules in
src/lib/respondent-rules.ts: parseFieldValues, parsePicks, carriedFields, chaptersFor
(RespondentItem, AreaMeta, Chapter), isComplete, answeredCount, parseScreen, from E7-2
answerFor, noteFor, parseAnswerInput, pickedOf, screenCount, from E7-3 resumeAt, and from
E7-4 landingOf(chapters, answers, layout, at, started) (where a visit lands: the screen, the
item in the one-item layout, and the Welcome back counts or null), progressOf(chapters,
done) ({ done, count } per chapter) and gapsOf(chapters, done, card) (each item not
complete on the server: itemId, reference, title, chapter, and what is missing: notRated,
sayWhy, writeQuestion or notSaved); Screen is about, chapter (index) or, from E7-4, wrap,
in the address as ?at=about, ?at=[chapter number] and ?at=wrap. The device queue's rules
in src/lib/answer-queue.ts, with doneFrom from E7-4 (whether a reply's `complete` replaces
the page's, by version).
links.byToken(token) in src/db/queries/links.ts is the respondent side's one read: the
invite, its instrument, project and workspace brand, with the workspace id as a WorkspaceId
(the token is the credential, SECURITY.md); null for anything else, nothing listed.
`publishLink()`, `saveLink()`, `linkState()`, `formatUtc()` in src/lib/sharing.ts;
`viewLink(token, cookie)`, the passcode proof and the attempt limit in src/lib/link-access.ts;
the passcode hash ("scrypt$N$r$p$salt$key", async, src/lib/passcode.ts). The passcode cookie "smesay-passcode" is scoped to
/r/[token] and holds an HMAC of the token and the stored hash under the app's secret.
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
Version 1, 2026-10-04 (stories/E7-3, acceptance 6), on top of the E1-2 shapes; the answer's
version, writer and save number and the response id added the same day after the audits
(migration 0017).

- The autosave payload: PUT /r/[token]/answers, JSON (application/json, at most 16 KB)
  { itemId: string, picked: string, reason?: string | null, comment?: string | null,
  base: number, page: string, seq: number, after?: { page: string, seq: number }[],
  response: string }. base is the answer's version
  the change was made on (0 when the page knows no answer for the item), page a random id of
  the open page (crypto.randomUUID; 8 to 64 letters, digits or hyphens), seq that page's
  number for the save, counting up from 1; base and seq are whole numbers up to 2147483647
  (src/lib/respondent-rules.ts validCount, validPage). after names the saves of other pages
  the change was made on top of while the server had not answered for them (at most 8,
  parseAfter; src/lib/answer-queue.ts nextEntry). response is the response the page
  answers for; when it is not the device's (an open window whose cookie was replaced) the
  answer is "not started".
  picked is a code of the instrument's scale (MoSCoW M, S, C, W; fit 1 to 5; kcd K, C, D)
  or "unclear". reason and comment are trimmed, empty means null, each at most 2000
  characters. The device cookie (smesay-device, public links) or the personal link's
  invite names the response; the passcode cookie when the link has one.
- The answer: 200 { saved: true, kind: AnswerKind, complete: boolean, version: number,
  writer: string, writerSeq: number, changedSince: boolean, submittedAt: string | null
  (E7-6) }; 409 { error: "stale", answer: { kind, value, reason, comment }, complete,
  version, writer: string | null, writerSeq, changedSince, submittedAt } when the stored
  answer has
  moved past the write (the page shows it when it is not its own: src/lib/answer-queue.ts
  ownWrite);
  refusals
  { error } with 404 unknown, 403 sample or passcode, 409 notOpen or not started (the
  sentence), 410 revoked or closed, 413, 415, 400, 422 (the sentence). Nothing is written
  on a refusal or a stale write. POST /r/[token]/start answers { ok: true, response,
  submittedAt, changedSince } with the response's id, which ties the device's queue to it,
  and from E7-6 when it was last submitted (ISO, or null) and whether it is submitted with
  changes not submitted again.
- The stored answer (table answer, one per response and item; a write lands only when the
  stored version is its base, or the stored writer is its page with a lower writer_seq, or
  the stored writer is a page it names in after with writer_seq at most that save's; the
  version then counts up by one, writer and writer_seq take the write's page and number,
  and updated_at moves; a new answer starts at version 1; no clock decides): kind and value from classify (src/lib/scoring.ts) over the method,
  the switch and the item's proposal, never the client's word; value is the picked code,
  null for unclear; reason only for change, disagree and unclear, comment only for agree
  and pick (null otherwise). An answer is complete when it needs no reason or carries one
  (isComplete, src/lib/respondent-rules.ts); an incomplete answer is stored and does not
  count as answered.
- The response (table response): fields (the PM's keys only), perspectives, confidence,
  signed_off and submitted_at (E7-5), updated_at moving on every answer that changes. From
  E7-6 (version 3, 2026-10-04, no migration) signed_off is true from a Submit until the next
  change: an answer, a Wrap up write or a Start that changes something sets it false and
  moves updated_at; a write that changes nothing moves neither, and Submit moves updated_at
  only when it carries a change. A submitted response with signed_off false has changes not
  submitted again (changedSinceSubmit); its answers are stored in place, so the dashboard
  reads the latest ones (E8-1, docs/review-list.md). A response is
  pinned to its instrument and item set; the dashboard reads answers per response and
  item. Version 2, 2026-10-04 (E7-5, migration 0018): closing_answer (text, the answer to
  the PM's closing question, at most 2000 characters, null when none or no question),
  sign_off_text (the sentence the respondent ticked, as shown), first_submitted_at (the
  first Submit; submitted_at is the latest, so E8-2's "changed after submitting" needs no
  history), wrap_version, wrap_writer and wrap_writer_seq (the Wrap up's version, counted up
  on every Wrap up write and Submit, the page that wrote it last and that page's number: the
  answer's rule, wrapTakes in src/lib/respondent-rules.ts). missing_item gains
  suggested_value (a code of the instrument's scale, or null); suggested_area is one of the
  list's areas the respondent sees (areasOf: not "Other items") or null; a response has at
  most one missing item, written by every Wrap up save and Submit that changes it, updated
  in place so it keeps its id. updated_at moves on a Wrap up write or Submit only when it
  changes the Wrap up. The plan's monthly responses count first_submitted_at
  (src/db/queries/usage.ts).
- The Wrap up's save: PUT /r/[token]/wrap, JSON { response, confidence: 1 to 5 or null,
  closingAnswer?: string, missing?: { text, area?, value? } | null, base, page, seq, after? }
  (the Wrap up's version the write was made on, the page's id, its number for the write, the
  saves of other pages it was made on top of, as an answer's), as the respondent writes
  (saveWrap, parseWrapInput). 200 { saved: true, version, writer, writerSeq, changedSince,
  submittedAt }; 409 { error: "stale", wrap: { confidence, signed: false, closingAnswer,
  missing: { text, area, value } }, version, writer, writerSeq, changedSince, submittedAt }
  when the stored Wrap up is not
  one the write was made on;
  refusals as an answer's (409 when this device has no response or not the one named,
  checked before the rest of the body, 422 with the sentence). It stores the response's
  confidence, closing answer and missing item; the response is not submitted. A write that
  says what is stored moves only the version.
- The submit payload: POST /r/[token]/submit, JSON { response (the response the page answers
  for; 409 not started when it is not this device's, checked first), confidence: 1 to 5,
  signedOff: true, signOffText?: string (the sentence the page showed; refused when the PM's
  differs), closingAnswer?: string, missing?: { text, area?, value? } | null, base, page,
  seq, after? (as the Wrap up's save) }. 200 { submittedAt (ISO, UTC; the stored time, at
  least a millisecond after the response's Submit before, E7-6), name (the first name,
  or null), version (the Wrap up's) }; 409 { error: "stale", wrap, version, writer,
  writerSeq, changedSince, submittedAt } as the Wrap up's save; refusals { error } with the
  link's statuses, 409 not
  started, 422 with the sentence (items to finish, a field missing, confidence, the sign-off
  or its changed sentence, a bad missing item), 403 when the plan's monthly responses are
  used (withinPlan). Submitting again updates the same response.
  submitResponse(token, cookies, body, baseUrl, now, send) in src/lib/respondent.ts returns
  { submittedAt, name, version, receipt } (receipt: the email 4 send for a personal invite's
  first Submit, run by the route with after(), or null) or { stale };
  responses.submit(ws, inviteId, responseId, data, stillOpen, check, now) checks the
  version, then reads the answers under the response's update lock and returns { invalid:
  sentence } when check(rows, perspectives as locked) refuses; responses.saveWrap(ws,
  inviteId, responseId, data, stillOpen, now) under the same locks returns { saved, changed }
  or { stale }. loadRespondent's ready view carries wrap: { confidence, signed: false,
  closingAnswer, missing: { text, area, value } } as the server holds it (empty before any)
  and wrapSync: { version, writer, writerSeq }; the page keeps its newest change the server
  has not confirmed under smesay-wrap:[token] as JSON { response, value, base, page, seq,
  after? } (src/lib/wrap-queue.ts) and sends it when it opens if the server would still take
  it.

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
