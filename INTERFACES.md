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
- ReasonRule (E5-2, 2026-10-05; instrument.reason_rule, text, not null, default `differs`,
  migration 0035; design note 98): when an answer counts as complete only with its text
  written. `differs`: a value other than the proposal (change, disagree) needs its reason and
  Unclear its question; agree and pick need nothing (the rule before 2026-10-05, which every
  existing row takes). `never`: the boxes still show, and an empty reason or question still
  counts as complete. `always`: every answer needs its text: change, disagree and unclear
  their reason or question, agree and pick their comment (the card opens the comment box on
  its own and labels it required). The text sits where it always did: answer.reason for
  change, disagree and unclear, answer.comment for agree and pick (needsReason(kind) in
  src/lib/respondent-rules.ts picks the box; textRequired(kind, rule) says whether that
  box must be filled). Locked once the instrument is published, like the method. The SQL
  twin, for the counts over 500 rows, is completeSql(rule) in src/db/queries/complete.ts.
- Anonymity (E5-7, 2026-10-06; instrument.anonymity, text, not null, default `named`,
  migration 0036; design note 100): who sees whose answers. `named`: Results, the exports and
  the AI read names and fields as before (every row before 2026-10-06 takes it). `hidden`
  (Names hidden): personal invites and reminders still work and Share still shows who has
  finished, but every response reads "Anonymous [N]" (numbered by when it started, across all
  the instrument's links), with no fields, no submitted time and no reminders on Results, the
  exports and the AI, and no row for an invitee who has not started. `anonymous`: the public
  link only (no personal invite is sent), otherwise as `hidden`. Under `hidden` and `anonymous`
  the respondent fields can only be dropdowns (fieldsBlocking in src/lib/anonymity.ts names
  the text and email fields; saveFields and saveAnonymity refuse them under the instrument
  row's lock), a personal invite carries no name or role into the response (carriedFields),
  and a dropdown value picked by fewer than MIN_GROUP (3) counted respondents is not offered
  as a filter and is folded into one group in a split. Locked once the instrument is
  published, like the method; Build on version N copies it; the sample is `named`. The SQL
  enforces the names, fields and times (src/db/queries/results.ts head and
  src/db/queries/insights.ts people read instrument.anonymity), so no caller can show them.
- InviteKind: public, personal.
- ReaderStatus: suggested, accepted, rejected (E4; an item imported without AI has null).
- InsightState: open, done, dismissed.
- InsightKind (E9-1; insight.kind, null on rows written before it): rewrite, conflict,
  followUp, coverage.
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
- ResultsFilter (not stored; E8-1, written 2026-10-03, design note 40; built 2026-10-04,
  design note 60): the one parameter every results query and both CSV exports take:
  { fields: { [key]: string[] | string } (a dropdown field's chosen options, or the words a
  text field contains), kinds: ("agree" | "change" | "disagree" | "unclear" | "pick" |
  "none")[] ("none": not answered), withComment: boolean, perspective: string | null,
  status: ("submitted" | "inProgress")[], includeUnsubmitted: boolean, sort: { key, dir:
  "asc" | "desc" } | null } (E8-2: a column key in a safe shape, which each table maps to
  SQL from its own list; never a filter), split: string | null (E8-3: a dropdown field's key
  for "Split by"; never a filter), gaps: string | null (E8-6: the dropdown field "Where groups
  disagree" compares by, Role by default when the instrument has it, else its first dropdown
  field; never a filter). It selects people (started responses, and personal invites not opened yet
  with the name and role their About you starts with): a person with at least one answer of
  a chosen kind (or an item they see unanswered), with a reason or comment, whose fields,
  perspective and status match; the numbers count those people's answers. It travels in the
  URL (f.[key], kind, comment=1, perspective, status, unsubmitted=1 or 0, absent for the
  PM's stored choice, sort and dir, split, gaps when it is not the default) and is read and written by parseResultsFilter and filterQuery in
  src/lib/results-filter.ts, against the instrument's fields and perspectives. From E5-7
  (2026-10-06) the FilterContext is { fields, perspectives, anonymity, offered? } (offered:
  { [key]: string[] }, the dropdown values a filter may pick, present only under `hidden` and
  `anonymous`, where a value needs MIN_GROUP counted respondents; fields then holds the
  dropdown fields only). resultsContext(ws, instrument, query, stored) in
  src/lib/results-context.ts builds the context and the filter for the Results page and the
  export route.
- ResultsPrefs (jsonb, user.results_prefs, default {}; E8-1, migration 0019):
  { [instrumentId]: { tiles?: string[] (the tile ids of E8-1's catalogue, one to six),
  includeUnsubmitted?: boolean (decision 0030's switch, kept per PM), view?: "table" |
  "columns" | "share" (E8-3) } }.
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
Results (E8-1): results.numbers(ws, instrumentId, filter) gives ResultsNumbers
(src/lib/results-tiles.ts: invited, submitted, inProgress, shown, total, agree, change,
disagree, unclear, pick, answered, withComment, missing, unansweredItems, fullyAgreed,
pushedBackItems, medianMinutes, anyAnswer, actions) from one SQL query, or null for an
instrument outside the workspace; results.rows(ws, instrumentId, filter) the answers the
same filter keeps, one row each ({ id, responseId, itemId, kind, value, reason, comment,
submitted }), which E10-1's CSV writes; results.people(ws, instrumentId, filter) the people
it keeps as PersonOfRows { id, invited (an invite not opened), submitted, counted (its answers
count under the switch), minutesToSubmit (whole minutes, rounded in SQL; medianMinutes is
their median, rounded) } and results.missing(ws, instrumentId, filter) the
missing items of the counted people as MissingRow { id, responseId, text }, the rows of
E10-1's "People" and "Missing items" files; registers.answers(ws, instrumentId, filter, kinds, fieldKeys, method) and registers.missing(ws,
instrumentId, filter, fieldKeys, method) (E8-4) the answers of the kinds asked (change, disagree,
unclear) and the missing items the filter keeps, as RegisterRow { id, itemId, reference,
itemText, readerStatus, readerText, proposedValue, kind, value, reason, comment, fields, who,
anon, submitted, changedSince } and MissingRegisterRow { id, text, area, value, fields, who,
anon, submitted, changedSince } (who and anon as PersonRow's), sorted from the register's
list of columns, the value columns in the method's scale order; agreement.byItem(ws, instrumentId, filter, split)
(E8-3) the counts per item (and per group of the split field) as ItemCounts { itemId, group,
agree, change, disagree, unclear, pick, values (by code), couldSee, percent (agree over
answered, rounded half up in SQL; the tab sums with the same rule, src/lib/results-agreement.ts
percentOf, and shows no percentage where no proposal was shown, figureOf's "[N] rated", as
E10-1's items CSV will) }; tracker.people(ws, instrumentId, filter,
fieldKeys) (E8-2) the people the filter keeps, started or invited, as PersonRow { id, source,
fields, who (the name shown: the name field, else a personal invite's name or email; null
for a public-link response with no name), anon (for a public-link response with no
name, its number among the instrument's public-link responses by start; null otherwise), status, changedSince, submittedAgain, answered (complete answers to
the items seen), visible, submittedAt, reminders, withComment (answers that count under the
switch) }, sorted by the filter's sort from the tab's list of columns (a field
column only for a key in fieldKeys); onResultsChange(instrumentId, listener { change, ping }) (E8-7,
src/db/queries/results-events.ts) calls listener.change after every committed write to the instrument's
answers, responses or missing items and after a reconnect of the LISTEN, and listener.ping
with each heartbeat, from one LISTEN per process on the Postgres channel "results"
(drizzle/0020_results_notify.sql: a trigger sends the instrument's id and nothing else; the
process sends 'ping' every 5 seconds while a stream is open), and returns the function that
stops it; GET /api/projects/[projectId]/events streams them to Results as server-sent events
(ready { instrument, version }, change { instrument, version }, ping) for a project of the
session's workspace, and answers HEAD with 405; gaps.byField(ws, instrumentId, filter, fieldKey) (E8-6)
every item of the instrument as GapItem { itemId, gap (the largest difference in agreement
share between two groups with 3 answers or more, in percentage points; null when fewer than
two are compared), groups: GapGroup { group ('' for the people with no value, Not given on
screen), agree, answered, compared }[] }, largest gap first, then the item's position (the
view orders ties as the Agreement table lists the items, src/lib/results-gaps.ts); detail.item(ws, instrumentId, itemId, filter) (E8-5) one
item of the instrument as DetailItem { id, reference, area, originalText, readerText,
readerStatus, proposedValue } with DetailCounts { agree, change, disagree, unclear, pick,
notYet } counted in SQL and a DetailRow { personId, invited, submitted, fields, who,
anon, kind, value, reason, comment } per person the filter keeps who sees the item or
answered it before a change of perspective (kind null: no answer that counts under the
switch), or null for an item or instrument outside the workspace; resultsPrefs.get(userId, instrumentId) and
resultsPrefs.set(userId, instrumentId, { tiles?, includeUnsubmitted?, view? }) read and merge the
person's ResultsPrefs entry (the caller checks the instrument is in the current workspace).
Anonymity on Results (E5-7, 2026-10-06): under `hidden` and `anonymous` the people of every
query above have who null and anon numbered over all the instrument's responses by start
(created_at, id), no invite rows, and the rows each query returns carry fields {},
submittedAt null (ResultRow, PersonRow, SignOff; SignOff.submittedAt is Date or null) and
reminders null; the filters, the split and the gaps still read the stored dropdown values.
results.fieldValueCounts(ws, instrumentId, includeUnsubmitted) gives FieldValueCount { key,
value, n } for every field value of the instrument's counted responses (submitted ones only
when the switch is off), the source of FilterContext.offered.
Projects (E8-8): projects.update refuses a patch that carries isSample and projects.create
refuses isSample true (SampleFlagError); the flag is set only when the sample is seeded
(createSampleProject, imported from src/db/queries/projects.ts by src/db/seed/sample-seed.ts
only; not in the @/db/queries barrel).
Members: list, listWithUsers (with name and email), countOwners, get, add, setRole, remove by
(ws, userId); markQuickstartSeen(ws, userId, now): boolean stamps quickstart_seen_at once and
is true only for the call that stamped it (E12-2). Member carries quickstartSeenAt (Date or null). workspaceInvites: the scoped six over workspace_invite (E2-4); acceptPendingInvites
(userId, email) in src/db/queries/onboarding.ts turns open invitations for the session's email
into memberships. Brand (E2-5): workspaces.publicBrand(workspaceId) gives name, accent and logo key to public
pages; aiRuns.costThisMonthCents(ws); `saveBrand()` in src/lib/brand.ts; `effectiveAccent()`
in src/lib/brand-rules.ts is what the respondent side uses, and from E7-7 `liftAccent(hex)`
(OKLCH lightness DARK_LIGHTNESS, 0.72, the hue kept), `darkAccent(hex)` (the accent on dark:
the lift, or DARK_FALLBACK_ACCENT for SMEsay's own colours and a lift under 4.5:1 against
DARK_SURFACE or ON_DARK_ACCENT), `accentVars(accent)` ({ "--brand-accent",
"--brand-accent-dark" }), the classes ACCENT_FILL and ACCENT_BAR that paint with them, and
`showsPoweredBy(plan)` (the Free plan); the logo is at
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
inviteEmail(input) in src/lib/mail/templates/invite.ts (InviteEmailInput: pmName, workspaceName,
projectName, respondentName, itemCount, minutes, intro, url, opensAt when the link opens
after the send, closesAt); sendMail() takes fromName and replyTo.
Reminders (E6-3): invites.claimReminder(ws, id, now, minHours) (one statement: reminders_sent
+ 1 and last_reminder_at = now on a sent, unrevoked personal invite whose last reminder is
minHours old or none, and the newest response not submitted; null when refused),
invites.unclaimReminder(ws, id, claimedAt, previous) (only while claimedAt is on the row);
responses.forInvite(ws, inviteId) (the newest); answers.countForResponse(ws, responseId)
(complete answers under the instrument's ReasonRule, completeSql);
remindInvitee(ws, projectId, instrumentId, inviteId, sender, baseUrl, now, send) and
remindAll(...) in src/lib/reminders.ts (outcomes: email, sent, error); canRemind(row, now)
and REMIND_AFTER_HOURS in src/lib/reminders-rules.ts; reminderEmail(input) in
src/lib/mail/templates/reminder.ts; formatUtc now lives in src/lib/sharing-format.ts.
Email frame (E12-3): renderEmail(parts: EmailParts): Email in src/lib/mail/templates/layout.ts,
EmailParts { origin (string or null: no mark and no privacy link), subject, preheader?, before:
Para[], button? { label, url }, after?: Para[] }, Para { text, preLine? }, Email { subject, text,
html }; COMPANY and companyAddress() (COMPANY_ADDRESS, null when unset). Every email function
returns Email; deletionEmail(workspace, deletedAt, origin or null). sampleEmails(origin) in
samples.ts fills each for the unit test and `npm run email:samples`.
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
The builder's preview (E5-6): previewToken({ project, ws, user }, secret, now) and
readPreviewToken(token, secret, now) -> { project, ws, user, exp } | null in
src/lib/preview-token.ts ("p." + base64url claim + "." + base64url HMAC-SHA256, valid one to two hours;
isPreviewToken(token), previewAccess(claim, { user, ws }) -> ok | expired | otherWorkspace); previewKey(), loadPreview(ws, projectId, step, now) -> PreviewView
{ kind: none | noList | revoked | ready { spec, items, areas, closesAt } }, previewSrc(claim,
step, now) and STEP_RINGS in src/lib/preview.ts (steps import, shape, build, share; rings nav,
cards, wording, rating, fields, closing, note). /r/[preview token]?step=&ring=&v=&device=&screen=wrap
renders the respondent app with preview { rings }; PUT /r/[token]/answers, POST start,
PUT wrap and POST submit answer 403 { error } to a preview token. itemsFor(ws, instrument) in
src/lib/respondent.ts reads an instrument's items as the respondent sees them (itemsOf(link)
calls it).
The visitors' sample (E12-4): /sample renders the respondent app with preview { rings: [],
sample: true } and poweredBy "landing" (PoweredByShow = boolean or "landing", a link to
/landing-page); sampleInstrument() in src/lib/sample-instrument.ts builds the instrument, items
(id = reference) and areas from src/db/seed/sample.ts with no database read;
parseSample/readSample/keepSample in src/lib/sample-drafts.ts keep SampleKept { drafts, fields,
picks, wrap, started, submittedAt } in session storage under smesay-sample; SAMPLE_TOKEN
"sample" (src/lib/sample-copy.ts) makes the savers call nothing. RespondentApp takes
initialDrafts; ItemCard and ChapterScreen take savedLabel. ChapterScreen and WrapUp take
slide: "next" | "prev" | null, the way the respondent arrived (design note 99).
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
E7-4 landingOf(chapters, answers, rule, layout, at, started) (where a visit lands: the screen, the
item in the one-item layout, and the Welcome back counts or null), progressOf(chapters,
done) ({ done, count } per chapter) and gapsOf(chapters, done, card, rule) (each item not
complete on the server: itemId, reference, title, chapter, and what is missing: notRated,
sayWhy, writeQuestion or notSaved); Screen is about, chapter (index) or, from E7-4, wrap,
in the address as ?at=about, ?at=[chapter number] and ?at=wrap. The device queue's rules
in src/lib/answer-queue.ts, with doneFrom from E7-4 (whether a reply's `complete` replaces
the page's, by version). From 2026-10-05 (E5-2, acceptance 6) the completeness rules take the
instrument's ReasonRule: isComplete(answer, rule), noteFor(answer, rule),
answeredCount(items, answers, rule), resumeAt(chapters, answers, rule), tallyOf(method,
items, answers, rule), and textRequired(kind, rule); needsReason(kind) still picks the box
the text is stored in. RespondentApp's instrument, ChapterScreen and ItemCard take
reasonRule; PreviewSpec carries it; sampleInstrument() gives the default. From 2026-10-06
(E5-7) carriedFields(invite, spec, anonymity) carries nothing unless the instrument is
`named`; RespondentApp's instrument and PreviewSpec carry anonymity, AboutYou takes it and
says above the fields how the team sees the answers; sampleInstrument() gives `named`.
saveAnonymity(ws, projectId, instrumentId, raw) in src/lib/instruments.ts (under
instruments.updateLocked: refused once published and while a text or email field exists);
sendInvites and renewInvitee refuse an `anonymous` instrument (INVITEES_ERRORS.anonymous);
InviteEmailInput gains namesHidden (the instrument is `hidden`).
links.byToken(token) in src/db/queries/links.ts is the respondent side's one read: the
invite, its instrument, project and workspace brand (name, accent, logo key and, from E7-7,
plan, for "Powered by SMEsay" on the Free plan), with the workspace id as a WorkspaceId
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
(getWorkspaceById, createEmptyWorkspace, deletedWorkspaces, purgeWorkspace, hardDeleteWorkspace,
productAiCostCentsThisMonth, setAiBudgetEur, requireWorkspaceForUser) takes no session and is
importable only from src/db, src/lib/workspace.ts, src/lib/ai/client.ts with its test,
src/lib/insights.test.ts and src/lib/workspace-removal.ts (decision 0036, E11-2). Importing "@/db",
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
  and pick (null otherwise). An answer is complete when the instrument's ReasonRule needs no
  text for its kind or the text is written (isComplete, src/lib/respondent-rules.ts; from
  2026-10-05); an incomplete answer is stored and does not count as answered.
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
maxOutputTokens?, expectedOutputTokens? }, deps?)` in src/lib/ai/client.ts, the only file that reads
ANTHROPIC_API_KEY or imports the SDK (lint rule smesay/ai-sdk, which also keeps the module
out of "use client" files). It returns `{ ok: true, output, run }` (run: id, model, tokensIn,
tokensOut, costEurCents, durationMs) or `{ ok: false, reason: "paused" | "budget" | "plan" |
"rateLimited" | "failed" | "invalid", message, detail, estimateCents? }` (estimateCents on a
paused or budget refusal, E9-3) (paused: the product's monthly cap,
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
The budget checks use the estimate estimateCents(model, text, outputTokens) over
estimateText(instructions, data, outputFormat) in src/lib/ai/client.ts: the prompt and the
output schema the API sends, at four characters a token, and expectedOutputTokens, or the
whole allowance when the caller gives none (E9-3; Write actions expects 1,500,
ACTIONS_EXPECTED_OUTPUT); each answered run logs the estimate next to the actual.
formatEur(cents) gives "EUR 0.05". aiRuns.lastFor(ws, projectId, purpose) is a project's latest
answered run of one purpose (a row with no tokens, a call not answered, is skipped).
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

## AI actions output (ai -> dashboard)
Owner: E9-1. Consumer: the Actions tab (Results) and E9-2.
Version 1, 2026-10-04. The zod schema is InsightOutput in src/lib/ai/insights-schema.ts; every
object strict. Refs are the ones the prompt gives (src/lib/ai/prompts/insights.ts
buildActionsPrompt): I[n] items, R[n] respondents (their dropdown fields only, the name field
left out even as a dropdown; from E5-7 no field at all under `hidden` and `anonymous`, the
groups empty, the prompt's text and shape unchanged), A[n] answers that carry a reason or a question, M[n] missing items, never database ids.
{ actions: [{ kind: "rewrite" | "conflict" | "followUp" | "coverage", title: string (1 to 140
chars), why: string (1 to 400 chars), answers: string[] (A refs), missing: string[] (M refs) }]
(up to 8) }
The app keeps an action only when it cites at least one ref and every ref it cites was sent
(src/lib/insights.ts keptActions; acceptance 2 and 3), and stores it as an insight row with
kind, title, why, cited_answer_ids and cited_missing_item_ids, the model, and its share of the
run's tokens and cost (share(); the shares add up to the run). writeActions(actor, projectId,
deps) runs it: results.read, the sample refused, the answers of submitted responses only
(decision 0030), ai_run purpose insights. A run that keeps none leaves the open actions as they are. insights.replaceOpen(ws, projectId,
rows) replaces the open actions in one transaction, under the project row's lock, and keeps
done and dismissed; insights.listWithCitations
(ws, projectId) leaves out an action whose every citation is gone and gives each action its cited answers (item, reference, item text, the name as on
Results) and missing items, open first, then done, then dismissed, each in the order written.
E9-2: setActionState(actor, projectId, insightId, from, state) marks an action done or
dismissed (closed_at, closed_by) or open again (both null) when it is still in `from`, the state
the page showed, refusing the sample, an action not the project's and an unknown state;
insights.setState(ws, projectId, insightId, from, state, userId, now) under the project row's
lock; replaceOpen skips an action matching a done or dismissed one (sameAction: kind and the sets of cited answers and missing
items). citationLines(answers, missing, anonymous) gives "[Name] and [Name] on [REF]" (an item with no
reference by its text in quotes, cut at 40 characters) and "[Name], missing item".

## CSV exports (results -> files)
Owner: E10-1. Consumer: the Export tab; E11-2 reads export_log.
Version 1, 2026-10-04. GET /api/projects/[projectId]/export/[file] with the Results page's
query (file: answers, items, people, missing; EXPORT_FILES in src/db/types.ts): the project
through the session's workspace, else 404; the filter by parseResultsFilter with the PM's
stored switch. exportTable(ws, instrument, file, filter, ctx, sample) in
src/lib/export/files.ts returns { preamble, header, rows } from results.rows (each ResultRow
now carries who, anon, fields, perspectives, source, submittedAt, changedSince; from E5-7,
under `hidden` and `anonymous`, the answers, people and missing files have no field columns,
no Submitted at, no Source, no Reminders and no Perspectives, every respondent "Anonymous
[N]"),
agreement.byItem,
tracker.people with results.people (minutes to submit) and registers.missing. csv(preamble,
header, rows), line, field (a text cell starting like a formula gets a single quote, safeText),
isoUtc and BOM in src/lib/export/csv.ts. A request with Sec-Fetch-Site: cross-site gets 403.
Every download writes an export_log row (workspace_id, project_id, made_by, file, filter in
words with a text filter's value left out (describeFilter(f, ctx, true)) or null, rows,
created_at; exportLogs in src/db/queries).

## Whole project export (ProjectExport)
Owner: E10-2. Consumers: Import a project; E11-2's workspace export.
Version 1, 2026-10-04. GET /api/projects/[projectId]/export/project returns the file;
exportProject(actor, projectId) and importProject(actor, text) in src/lib/export/project.ts,
readProject(ws, projectId) and writeProject(ws, input, userId, now) in
src/db/queries/projectTransfer.ts. The zod schema ProjectFile in project.ts is the contract:
{ format: "smesay.project", version: 1, exportedAt, sample, note (the watermark line on the
sample, else null), project { name, contextGoal, contextTerms, createdAt }, itemSets [{ id,
version, source, sourceFilename, importReport, importedAt, areas, shapeRuns, shapedAt,
contextUsed, items [{ id, position, sourceRef, originalText, readerText, readerStatus, area,
areaRationale, proposedValue, custom, flags, perspectives }] }], instruments [{ id, itemSetId,
title, intro, method, showProposed, layout, reasonRule (from 2026-10-05; optional on
import, a file without it reads `differs`, so version 1 files from before still import),
anonymity (from 2026-10-06, E5-7; optional on import, absent reads `named`),
respondentFields, scaleLabels, perspectives, closing, publishedAt, createdAt }], invites [{ id, instrumentId, kind, email, name, roleHint,
opensAt, closesAt, hadPasscode, revokedAt, remindersSent, lastReminderAt, sentAt, createdAt }],
responses [{ id, instrumentId, itemSetId, inviteId (null, with fields {}, for a response
of a `hidden` or `anonymous` instrument, from E5-7: the file does not tie it to a personal
invite; the import puts it on its instrument's public invite and refuses a null on a
`named` one), fields, perspectives, confidence,
signedOff, submittedAt, firstSubmittedAt, closingAnswer, signOffText, createdAt, updatedAt,
answers [{ id, itemId, kind, value, reason, comment, updatedAt }] }], missingItems [{ id,
responseId, text, suggestedArea, suggestedValue, createdAt }], insights [{ kind, title, why,
citedAnswerIds, citedMissingItemIds, state, closedAt, closedBy (an email), model, tokensIn,
tokensOut, costEurCents, createdAt }] }. Dates are ISO 8601 with an offset. Ids are keys inside
the file; the import makes new ones. No token, passcode hash or device token is in the file.
The JSON columns (importReport, areas, contextUsed, custom, flags, respondentFields,
scaleLabels, closing) have the shapes listed at the top of this file. The file is one line of
JSON, at most 5 MB on import (PROJECT_FILE_MAX). importProject returns { projectId } or
{ error } (the sentences of docs/copy/errors.md, Import a project), never throws on a file.
roomInPlan(ws, kind, now) in src/lib/plans.ts gives how many more of a kind the plan takes
this month, or null.
EXPORT_FILES gains "project" (migration 0024); CSV_FILES are the four CSV files.

## PDF summary (E10-3)
Owner: E10-3. Consumer: the Export tab.
Version 1, 2026-10-04. GET /api/projects/[projectId]/export/summary?[the Results page's query]
returns application/pdf with x-summary-pages: [N]. summaryView({ ws, workspace, project,
instrument, filter, ctx, tiles, now }) in src/lib/export/summary.ts returns SummaryView or null
(another workspace's instrument); summaryHtml(view), summaryHeader(view) and summaryFooter() in
summary-html.ts; renderPdf(html, { header, footer }) and pageCount(bytes) in pdf.ts.
results.signOffs(ws, instrumentId, filter) returns SignOff { id, who, anon, submittedAt,
confidence, signedOff } for every submitted response the filter keeps, oldest first (from
E5-7, under `hidden` and `anonymous`: submittedAt null, in the order of anon); the
people CTE carries r.confidence. SUMMARY_PAGE_LIMIT = 30 in src/lib/export/copy.ts.
EXPORT_FILES gains "summary" (migration 0025); the export log keeps the page count as rows.

## Rate limits (E11-1)
Owner: E11-1. Consumers: src/proxy.ts, src/lib/auth.ts.
Version 1, 2026-10-04. src/lib/ratelimit.ts: windowLimiter({ max, windowMs }) with hit(key,
now); backoffLimiter({ max, windowMs, baseMs, quietMs, capMs }) with check(key, now) and
attempt(key, now); both return { allowed: true } or { allowed: false, retryAfterMs }.
addressOf(headers) gives the last X-Forwarded-For entry or LOCAL ("local", never limited by
address). respondentLimit (100 a minute) and signInLimit (5 in 15 minutes, then 1, 2, 4
minutes, capped at 60). A respondent route over its limit answers 429 with Retry-After: HTML for
a page request, else { error: [sentence], code: "rateLimited", waitMinutes }; a server action
(a POST with the next-action header to /r/[token] itself) is not counted there. The magic link endpoint over its
limit answers 429 { code: "RATE_LIMITED", message, waitMinutes }.

## Workspace export and deletion (E11-2)
Owner: E11-2. Consumers: Settings, Data; the removal job; E11-3's privacy policy.
Version 1, 2026-10-04. GET /api/workspace/export: application/zip, owner only (403), with
projects/[NNN]-[PROJECT].json (ProjectExport), workspace.json { name, slug, plan, accentHex,
createdAt, logo, exportedAt } (no AI budget, decision 0036), members.csv (Name, Email, Role, Joined) and
logo/[FILE]; export_log gets file "workspace", project_id null (migration 0026).
exportWorkspace(actor, now) and deleteWorkspace(actor, typedName, now) in
src/lib/workspace-data.ts; zip(entries, now) in src/lib/export/zip.ts; listKeys(prefix) in
src/lib/storage.ts. workspace.deleted_by (user id, set null). workspaces.markDeleted(ws, userId,
now) and deletedForUser(userId, id or null) give DeletedWorkspace { id, name, deletedAt,
deletedByEmail }; leaveDeleted(userId, id) ends a membership of a deleted workspace;
AppContext.deleted. internal.deletedWorkspaces() and purgeWorkspace(id) for
purgeDeletedWorkspaces(send) in src/lib/workspace-removal.ts (`npm run jobs:purge`). A deleted
workspace's link from links.byToken carries revokedAt = deleted_at.

Product events (E13-1): EventName, the keys of EVENTS in src/lib/analytics-catalogue.ts, with
their properties: signed_up, workspace_created, member_joined, project_created { from: new |
import }, import_committed { source: upload | paste, rows }, shape_run { items, costCents }, shape_failed { reason: paused | budget | plan | rateLimited | failed | invalid, project } (E15-4),
instrument_published { method: moscow | fit | kcd, layout: chapters | item | page },
invite_sent { kind: personal | public, project (E15-2) }, link_opened { kind, instrument }, response_started
{ instrument }, response_submitted { instrument, items, minutes }, reminder_sent, insight_run
{ actions, costCents }, export_downloaded { format: csv | json | pdf | zip }, sample_opened,
sample_deleted, quickstart_seen, workspace_deleted, guide_shown { tip, action: yes | no },
guide_dismissed and guide_acted { tip } (tip: one of GUIDE_TIPS, the ids of docs/copy/guide.md, E15-1). rows, items, minutes, actions and
costCents are whole numbers from 0 to COUNT_MAX (1,000,000,000); instrument is a uuid. track(name,
properties, { workspaceId: WorkspaceId or null, userId: string or null }): Promise<boolean> in
src/lib/analytics.ts is the only writer (events.record in src/db/queries/events.ts); it returns
false and logs on a refusal or a failed write, never throws. RESPONDENT_EVENTS carry no user;
NO_WORKSPACE_EVENTS (signed_up, workspace_deleted) carry no workspace. publishLink now also
returns the instrument; acceptPendingInvites takes an optional joined: string[] that receives
the workspaces joined.

Admin (E13-2): requireAdmin(): { session, proof: AdminProof } in src/lib/admin.ts (notFound()
unless the signed-in, verified email is in ADMIN_EMAILS; adminEmails(value), isAdmin(email,
list)); AdminProof in src/db/types.ts. The one cross-workspace module, src/db/queries/admin.ts
(lint: src/app/admin/ and database tests only), every read taking the proof first:
funnel(proof, now): FunnelWeek[] { week (Monday UTC), counts by FunnelStep } newest first,
FUNNEL_WEEKS 12, deleted workspaces' events left out; workspaceUsage(proof, now):
AdminWorkspace[] { id, name, createdAt, members, projects, published, responsesThisMonth,
aiCostCentsThisMonth, lastActivity }; totals(proof): { workspaces, projects, published,
submitted }; weekStart(date). usageByWorkspace(now): Map of workspace id to Usage in
src/db/queries/usage.ts, on usage()'s conditions. FUNNEL_STEPS and FunnelStep in
src/db/types.ts; PLAN_METRICS { label, value(rows) } and PAID_PLAN_SWITCH { metric, threshold }
in src/lib/plans.ts; share(n, before) in src/lib/admin-copy.ts.

Visitor analytics (E13-3): plausibleConfig(env): { domain, scriptSrc } or null, PLAUSIBLE_ORIGIN,
GOALS (Start free, Try the sample, Sign up, First project, First validation published),
sendGoal(name, { url, userAgent, forwardedFor }, send?) and goalRequest(path) in
src/lib/plausible.ts; <PlausibleScript /> and <GoalLink goal> / <GoalOnOpen goal> in
src/components/analytics/; wasFirst(name, ws) in src/lib/analytics.ts. CspOptions gains
analytics (an origin for connect-src). cleanSource(value), nextWithSource(next, source) and
signInHref(source) in src/lib/utm.ts; events.countInWorkspace(ws, name) in
src/db/queries/events.ts (used by wasFirst); goalBody(config, name, url) and SIGN_UP_WINDOW_MS
in src/lib/plausible.ts; sendClientGoal(goal) in src/components/analytics/goal-link.tsx; workspace.firstSource (text, null), set by
createWorkspaceWithSample({ name, slug, firstSource }); AdminWorkspace gains firstSource.

Admin audit (E14-1): ADMIN_ACTIONS in src/db/types.ts (plan_changed, ai_budget_set,
invite_resent, link_revoked, workspace_restored, note_added, magic_link_sent,
signed_out_everywhere, member_removed, account_deleted, view_started, view_stopped) and
AdminAction; AUDIT_OUTCOMES (done, refused, failed) and AuditOutcome. AdminProof gains userId
(the session's). Table admin_audit { id, adminUserId, action (AdminAction), targetWorkspaceId
(uuid, null), targetUserId (text, null), changes (jsonb Record<string, string | number |
boolean | null>), outcome (AuditOutcome, null until recorded), createdAt }: no foreign keys, so a
row outlives its target and its admin; at least one target. In src/db/queries/admin.ts:
audited(proof, { action, targetWorkspaceId?, targetUserId?, changes? }, fn): fn's result; the
row (adminUserId from the proof) is written first and fn runs only when it is in; then outcome
done, refused (fn returned { error }) or failed (fn threw, rethrown). changes: at most 12 keys,
strings at most CHANGE_MAX (80) characters. auditLog(proof, { page, workspaceId?, adminUserId?
}): { rows: AuditRow[] { id, action, outcome, adminEmail (null when the user is gone),
targetWorkspaceId, targetWorkspaceName (null when gone), targetWorkspaceDeleted, targetUserId,
targetUserEmail (null when gone), changes, createdAt }, total, page } newest first, AUDIT_PAGE
50 per page, a page past the end read as the last; auditFilters(proof): { workspaces: { id,
name or null }[], admins: { id, email or null }[] } from the rows. requireAdmin() is cached per
request.

Admin workspaces (E14-2): in src/db/queries/admin.ts, workspaceDirectory(proof, { q }, now):
AdminDirectoryRow[] { id, name, slug, plan, createdAt, deletedAt, owners (emails), members,
projects, published, responsesThisMonth, aiCostCentsThisMonth, lastActivity } sorted by last
activity, deleted workspaces included, q matching name, slug or a member's email;
adminWorkspace(proof, id): { ws: WorkspaceId, workspace } or null (deleted ones too);
workspaceInstruments(proof, ws): AdminInstrument[] { id, projectId, title, publishedAt,
createdAt, version, publicLink ({ id, opensAt, closesAt, revokedAt } or null), personalLinks };
workspaceUploads(proof, ws): { id, projectId, filename, kind, byteSize, createdAt }[];
workspaceEvents(proof, ws, limit): { name, properties, createdAt }[] newest first;
adminNotes.list(proof, ws) and adminNotes.add(proof, ws, adminUserId, text): AdminNote { id,
adminEmail, text, createdAt }. Table admin_note { id, workspaceId, adminUserId, text, createdAt }.
workspaces.restoreDeleted(ws): Workspace or null (clears deletedAt and deletedBy while the row
is still marked deleted). sendWorkspaceInvite(ws, { email, invitedBy, headers }) and
resendInvite(ws, inviteId, headers) in src/lib/members.ts (inviteMember keeps its role check
and calls the first). instrumentState(publishedAt, publicLink, now): "draft" | "published" |
"closed" | "revoked" in src/lib/admin-copy.ts.

Admin people (E14-3): in src/db/queries/admin.ts, peopleDirectory(proof, { q, id }, now):
AdminPerson[] { id, email, name, emailVerified, createdAt, methods ("link", "google"),
workspaces: { id, name, role }[], lastSignIn (user.lastSignInAt, or null), openSessions } newest
sign-in first, q matching email or name; adminPerson(proof, id): AdminPerson or null;
personSessions(proof, userId): { id, createdAt, expiresAt, open, userAgent }[] (never the token
or the address); personEvents(proof, userId, limit); invitesFor(proof, email, validMinutes): {
id, workspaceId, workspaceName, invitedAt, open }[] not accepted, live workspaces only;
soleOwnedBy(proof, userId): { id, name }[] where the user is the only owner, deleted workspaces
waiting for removal included; forgetEmail(proof, email): { invites, links } (every workspace
invitation to the address and its unused sign-in links deleted); assertAdmin(proof). user gains
lastSignInAt (timestamp, null), set by better-auth's session.create.after hook in
src/lib/auth.ts. In src/lib/accounts.ts, each taking the proof: userAgentFamily(ua): { browser,
os }; signOutEverywhere(proof, userId): the number of open sessions ended;
removeMemberAsAdmin(proof, ws, userId): { error } or { removed: true } (the last-owner rule);
deleteAccount(proof, userId, email): { error } or { deleted: true }, refused while the person is
a workspace's only owner, the address forgotten, then better-auth's internalAdapter.deleteUser.

View as (E14-4): session gains viewAsWorkspaceId (uuid, null) and viewAsUntil (timestamp, null),
better-auth additional fields (src/lib/auth.ts). In src/lib/view-as.ts: VIEW_MINUTES 60;
Viewing { workspace, ws, until }; viewFields(session): { workspaceId, until }; viewingOf(session,
now): Viewing or null (an expired view or a deleted workspace writes view_stopped, then clears
the fields; an email no longer an admin's clears them with no row); startView(proof, session,
ws, now): until (a view held is stopped first); stopView(proof, session, now). adminProofFor(session):
AdminProof or null in src/lib/admin.ts. AppContext gains viewing (Viewing or null);
requireWritableWorkspace(nextPath) and refuseWhileViewing(session) in
src/lib/current-workspace.ts send a write during a view to /app/view-only. openDraft(ws, project,
{ create }) in src/lib/instruments.ts (create false never makes an instrument). VIEW_AS_COPY in
src/lib/view-as-copy.ts.

Guide (E15-1, E15-2): user.guideState (GuideState, default { tipsOff: false, dismissed: [] },
drizzle/0034). GUIDE_LINES { [TipId]: { pose, line, action or null } }, TIP_IDS, GUIDE_COPY and
GuidePose (hi, idea, reading, analysis, help) in src/lib/guide-lines.ts, equal to
docs/copy/guide.md by test; GUIDE_TIPS in the analytics catalogue is TIP_IDS. In
src/db/queries/guide.ts: guide.state(userId), guide.dismiss(userId, tipId), guide.setTipsOff(
userId, off); firstProjectFacts(ws, userId): FirstProjectFacts { project (the person's newest,
{ id, name } or null), hasSet, shaped, built, published, firstPublishedAt }. In src/lib/guide.ts:
tipVisible(state, id), pathHidden(state), PATH_STEPS, DONE_HOURS 24, pathView(facts, now): { tip, projectId, ticked } or null. Server
actions dismissTipAction(tipId) and setShowTipsAction(on) in src/app/app/(shell)/
guide-actions.ts. Components: <GuideCard id action? secondary? (path.start only)> and <ShowTips on
disabled?> in src/components/app/; MascotPose gains "help".

Step and rescue tips (E15-3, E15-4): in src/lib/guide.ts, importTip({ hasSet, pending: {
createdAt } or null }, now), shapeTip({ hasSet, importedAt, shapedAt, lastFailedAt, pending }),
buildTip({ intro, fields }), shareTip({ publishedAt, open, openSince, responses }, now): TipId or null;
RESCUE_UPLOAD_MINUTES 10, RESCUE_NO_RESPONSE_DAYS 3; SampleScreen (strip, registers, detail),
SAMPLE_TIPS, walkthroughOver(state). <StepTip tip action? path> in src/app/app/(shell)/
projects/[projectId]/step-tip.tsx. events.lastWith(ws, name, key, value): the newest
row's { createdAt, properties } or null, in src/db/queries/events.ts, and lastEventWith(name,
ws, key, value): { at, properties } or null, in src/lib/analytics.ts;
responses.countForInstrument(ws, instrumentId).

Guide measurement (E15-5): events.recordOncePerDay(ws, { userId, name, properties }, key) in
src/db/queries/events.ts; trackOncePerDay(name, props, who, key) and guideShown(tip, withAction, who) in
src/lib/analytics.ts; actedTipAction(tipId) in src/app/app/(shell)/guide-actions.ts
(guide_acted), dismissTipAction also writes guide_dismissed; all three once a day per tip and
person.
In src/db/queries/admin.ts: GUIDE_DAYS 30; guideStats(proof, now): GuideTipRow[] { tip,
hasAction, shown, dismissed, acted, toReview }; firstProjectFunnel(proof, now):
FirstProjectWeek[] { week, signups, imported, shaped, built, shared, medianHoursToLink } newest
first, FUNNEL_WEEKS weeks. GUIDE_ADMIN_COPY and actedRate(acted, shown) in src/lib/admin-copy.ts.

## Question bubble (E12-5)
Owner: E12-5. Consumer: src/app/landing-page/question-bubble.tsx.
Version 1, 2026-10-05. POST /api/support, JSON (application/json, at most 16 KB) { email,
question, page, website }: 200 { sent: true } (also when website, the hidden field, is filled,
whatever else is sent; nothing is mailed then), 400 { problem: "email" | "questionEmpty" |
"questionLong" }, 413 or 415 { problem: "body" }, 429 { tooMany: "connection" | "address" }
with Retry-After, 404 { problem: "off" } when NEXT_PUBLIC_SUPPORT_EMAIL is empty, 503
{ problem: "mail" } when the mail did not go. src/lib/support.ts: readSupport(body),
takeConnection(connection, now) (20 posts an hour, before the body is read; LOCAL not
counted), takeAddress(email, now) (5 an hour), giveBack(email, connection) after a failed
mail, supportEmail(to, input, origin, now) (email 5, text only, Reply-To the visitor).
QUESTION_MAX (2000), SUPPORT_PER_ADDRESS (5) and isSupportAddress(value) in
src/lib/support-copy.ts with the words. windowLimiter gains undo(key). Mail.html is optional
for a text-only message.
