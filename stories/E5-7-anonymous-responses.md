# E5-7 Anonymous responses: the PM chooses Named, Names hidden or Anonymous

User: a PM whose experts answer more freely when they are not named
Status: built
Outcome: on Build the PM picks how far respondents are identified, the respondent is told on
About you, and Results, exports and the AI show nothing that names a person beyond what the
level allows.

Mihai, 2026-10-06: "Do we have the option of making responses annonymous? i mean the PM
setting up should have this option". Asked whether personal invites stay, he picked "Both, PM
picks": two levels besides today's.

## Acceptance criteria
Amended 2026-10-06 after the audit: an audit showed the two levels could be defeated by
narrowing a list of people with filters, by small groups and by items few people see; the
criteria below are the stricter model (design note 100, docs/review-list.md rows of
2026-10-06).

1. Build has a card "Who sees whose answers" with three choices, stored on the validation
   (instrument.anonymity: named, hidden, anonymous; a migration gives every existing row
   named):
   - Named (the default, today's behaviour): Results show each person's name and fields.
   - Names hidden: personal invites and reminders still work, and Share still shows who has
     finished; Results, exports and the AI show answers without names or fields. The card says
     that with few people, the finishing times on Share can still point to someone.
   - Anonymous: the public link only; no personal invites, no name or email fields.
   Under both levels the card's hint adds "Do not ask for a name in a dropdown or in the
   closing question." The choice is checked on the server and locked once published, like
   the method (E5-2). "Build on version N" copies it; the project export and import carry it.
2. Under Names hidden and Anonymous the respondent fields can only be dropdowns. A text or
   email field is refused on save with a message that names the fields to change, and choosing
   either level while such a field exists is refused the same way (the default fields Name
   and Role are text, so the PM removes Name and makes Role a dropdown).
3. About you tells the respondent, above the fields: Anonymous: "Your answers are anonymous.
   No name or email is asked, and the team sees your answers without a name."; Names
   hidden: "The team sees your answers without your name. They can see that you have
   finished." The invite email under Names hidden drops "recorded under your name" and says the
   same as About you. Named pages and emails do not change.
4. Results under Names hidden and Anonymous: every response is "Anonymous [N]", numbered by
   when it started across all its links; the Responses tab has no field columns, no submitted
   time and no sort by field, and no row for an invitee who has not started; the item detail
   and the registers show "Anonymous [N]" and no field column. A dropdown value or a
   perspective picked by fewer than 3 counted respondents (MIN_GROUP) is not offered as a
   filter. No text field exists under these levels, so the text "contains" filter does not
   show (a search over answers and reasons was not built). Then:
   - Lists of people never follow a field or perspective filter. The lists are the Responses
     tab's rows, the registers' rows, the item detail's who-said-what list, the Actions
     citations, the answers, people and missing CSV rows, and the PDF's registers and sign-off
     record. A field or perspective filter applies to the tiles, the Agreement view and the
     gaps only; the lists show the whole validation with the line "Filters by a field or
     perspective change the charts only, so no list can be narrowed to a few people." The
     answer kind, comment and include-unsubmitted filters still apply to the lists.
   - A filter (all its parts together) that keeps fewer than MIN_GROUP counted respondents
     draws no tile and no Agreement view: "Fewer than 3 people match these filters. Widen them
     to see the results." The query keeps nobody, so the CSV items file and the PDF draw
     nothing either and say the same.
   - In a split and in the gaps view, a group with fewer than MIN_GROUP respondents within the
     filter is not drawn: the small values (and Not given) are one group, "Groups under 3
     people", only when together they reach MIN_GROUP, else they are left out; the folded
     group is keyed apart from any option's text, and the gaps view names no value the filter
     does not offer.
   - An item fewer than MIN_GROUP counted respondents could see reads "Fewer than 3 answers" in
     the Agreement table, with no count; the item detail lists nobody for it; it has no
     register row and no row in the answers file; its answers count in no tile.
   - Under Names hidden the Responses tab lists Anonymous [N] and "With a reason or comment"
     only, in the order of the numbers, with no Status, Progress or status filter (Share
     already shows each invitee's state); no register row, detail row, file or the PDF says who
     has submitted. Under both levels no row fades on a live update.
5. Exports under Names hidden and Anonymous: the answers, people and missing-item CSVs use
   "Anonymous [N]" and carry no field columns and no times; under Names hidden the people file
   has no Status, Since submitting, Answered, Items seen or Minutes to submit. The PDF summary
   names nobody; its sign-off record shows "Anonymous [N]" under Anonymous and lists no one
   under Names hidden. The project JSON and Export everything do not let a reader tie a
   response to a person or a moment: responses carry no invite id, no fields and no
   perspectives, and every time of a response (start, last save, submits), of its answers and
   of its missing items is the export's time (null stays null); under either level no personal
   invite is written, so the imported project has the public link only and no reminder can go
   to someone who already answered. The Export tab says so. The import refuses a personal
   invite on such a validation, and a response field that is not a dropdown's value.
6. Write actions under Names hidden and Anonymous send no respondent fields to the model
   (answers, reasons, comments and missing items only, as today otherwise) and no answer on an
   item fewer than MIN_GROUP counted respondents could see; citations read "Anonymous [N]".
7. Share under Anonymous shows "Anonymous validations use the public link only." in place of
   the personal invites form; the server refuses an invite, a reminder (one or all) and a new
   link on an anonymous validation.
8. The privacy policy says what each level hides and what it does not: under Names hidden the
   database still links an answer to its invite, for reminders; the same Anonymous number
   follows one person across items, so a reason that names its author shows that person's
   other answers; free text goes as written. Marked for the lawyer (L43).
9. Unit tests: the rules per level (fields allowed, labels, the MIN_GROUP filter), the
   queries and the CSVs per level with a workspace A and B test for any new query, the lists
   that follow no field or perspective filter, the MIN_GROUP floor, the folded and left-out
   groups, the items seen by few, the export round trip with its shared time, and every
   server refusal under Anonymous. Playwright: set Anonymous on Build, publish, answer through
   the public link and see the About you line, then see "Anonymous 1" and no field column on
   Results, and a field filter that leaves the Responses tab whole with the line.

## Out of scope
- Hiding the device cookie or the in-memory IP counts, which hold no name.
- Anonymity from the workspace's own database under Names hidden (the invite link stays).

## Open questions
- None; the calls taken are rows of docs/review-list.md dated 2026-10-06.

## Technical notes
Follow reasonRule (design note 98, drizzle/0035) for the column, the lock and the copy across
Build on version N, the preview, the export and the sample (the sample stays Named).
MIN_GROUP is src/lib/results-agreement.ts. Change INTERFACES.md first.

Built 2026-10-06 (design note 100):
- Acceptance 1: instrument.anonymity (drizzle/0036_anonymity.sql, CHECK
  instrument_anonymity_check, every existing row named); the card "Who sees whose answers" on
  Build above the Respondent fields card (build/anonymity-form.tsx, ANONYMITY_META in
  src/lib/anonymity.ts); saveAnonymity in src/lib/instruments.ts under instruments.updateLocked
  (refused once published); buildOnLatest copies it; the project file carries it
  (src/lib/export/project.ts). Tests: src/db/schema.test.ts (the migration on a row from
  before it, the check), src/lib/instruments.test.ts (save, refuse, copy, lock, another
  workspace), src/lib/export/project.test.ts (round trip, an older file reads named).
- Acceptance 2: fieldsBlocking in src/lib/anonymity.ts; saveFields and saveAnonymity refuse a
  text or email field by name, under the instrument row's lock. Tests: instruments.test.ts.
- Acceptance 3: AboutYou's line above the fields (src/components/respondent/about-you.tsx,
  ABOUT_YOU_COPY.anonymous and namesHidden); carriedFields carries nothing under Names hidden
  and Anonymous; the invite email's namesHidden (src/lib/mail/templates/invite.ts). Tests:
  src/lib/respondent.test.ts (carriedFields, a hidden personal Start stores no name),
  src/lib/mail/templates/templates.test.ts, src/lib/invitees.test.ts.
- Acceptance 4: the SQL in src/db/queries/results.ts head (who null, anon over all links, no
  invite rows, pub_fields and pub_submitted_at for every row returned, reminders null);
  responses-tab.tsx and registers-tab.tsx drop the columns; resultsContext
  (src/lib/results-context.ts) with results.fieldValueCounts offers a value only with
  MIN_GROUP counted respondents; a name never matches the text filter. Tests: src/db/queries/results.test.ts ("Names hidden and Anonymous on Results",
  with the workspace A and B test for fieldValueCounts), results-filter.test.ts,
  results-agreement.test.ts.
- Acceptance 5: src/lib/export/files.ts (no field, time, source, reminder or perspective
  column), src/lib/export/summary.ts (sign-off with no time), toFile (no invite id, no
  fields) and importProject (the response on its public invite). Tests: results.test.ts (the
  three headers, the strip reconciled), src/lib/export/summary.test.ts, project.test.ts.
- Acceptance 6: writeActions sends no field (src/lib/insights.ts); the citations' SQL names
  nobody (src/db/queries/insights.ts). Tests: src/lib/insights.test.ts on the fake transport.
- Acceptance 7: InvitesCard's line (share/invites-card.tsx); sendInvites and renewInvitee
  refuse (INVITEES_ERRORS.anonymous). Test: invitees.test.ts.
- Acceptance 8: docs/legal/privacy.md, respondents' section, AI and exports paragraphs, with
  [LAWYER: check L43]; docs/legal/lawyer-review.md L43.
- Acceptance 9: the unit tests above; e2e/anonymous.spec.ts written, run by the main session.

Amended 2026-10-06 after the audit (design note 100, the model above), built:
- Lists of people: ReadMode in src/db/queries/results.ts; person mode (rows, people, missing,
  signOffs, tracker.people, registers, the detail's rows) ignores the field and perspective
  conditions under the two levels and the status condition under Names hidden;
  identityFiltered and personFilter (src/lib/results-filter.ts); RESULTS_COPY.personLevel on
  the Responses tab, the registers and the item detail (results/page.tsx, detail-panel.tsx)
  and in the CSV and PDF first lines (src/lib/export/files.ts, summary.ts). Tests:
  results.test.ts "keeps every list of people whole...", summary.test.ts.
- The MIN_GROUP floor: guard in results.ts head (aggregate mode keeps nobody, numbers.tooFew);
  RESULTS_COPY.tooFew in place of the strip and the Agreement view (page.tsx,
  agreement-tab.tsx), the items file and the PDF. Tests: the same two.
- Groups: agreement.byItem and gaps.byField fold or leave out the values under MIN_GROUP
  people (folded flag, keys v:/small/none in src/lib/results-agreement.ts), the items' bars
  from the counts with no split. Tests: results.test.ts "draws no split group under 3
  people...", results-agreement.test.ts "a split under Names hidden and Anonymous".
- Items seen by few: few in results.ts head; ItemCounts.few, the detail's few and countsFew;
  "Fewer than 3 answers" in the table, the detail, the items file and the PDF; writeActions
  sends none of their answers. Tests: results.test.ts "counts nothing on an item fewer than
  3...", insights.test.ts.
- Names hidden: no Status or Progress column (responses-tab.tsx), no status filter
  (filter-bar.tsx, parseResultsFilter), no status or progress sort (personOrder), no marks
  (registers-tab.tsx, detail-panel.tsx, summary.ts), the record lists no one; no FadeOnChange
  on person rows under either level. Tests: results.test.ts (headers, sorts), summary.test.ts.
- Project file: toFile writes the export's time, no perspectives and no personal invite;
  missingReference refuses a personal invite or a non-dropdown field. Test: project.test.ts.
- Refusals: remindInvitee and remindAll (src/lib/reminders.ts). Test: reminders.test.ts
  "refuses a reminder, a new link and an invite on an Anonymous validation".
- Copy: About you, the Build hints, the Export tab line; docs/legal/privacy.md and
  lawyer-review.md L43; SECURITY.md, Data.
- e2e/anonymous.spec.ts: four phones, a Sales filter that leaves the Responses tab whole with
  the line; written, run by the main session.
