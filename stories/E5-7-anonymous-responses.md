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
Amended 2026-10-06, decision 0058: asked whether to keep filters and splits under the two
levels, Mihai picked "Breakdowns, risk disclosed" over "No breakdowns". The breakdowns stay
(groups of 3 or more); the risk that comparing views can single out someone in a small group
is said on Build, on Results and in the privacy policy rather than engineered away; and the
third audit's fixes are in the criteria below (the numbering, "Not answered" under Names
hidden, the project file, the progress sort, the copy, the reconciliation exception, the
detail's timing, the floor's line and the PDF's confidence chart).
Amended 2026-10-06 after the fourth audit (decision 0058 kept): under Names hidden only
submitted responses are in any view, the include-unsubmitted switch off and not shown; the
project file keeps the perspectives, writes the missing items in the order of the numbers and
leaves out an action that cites what it leaves out; the risk line also shows with a split;
the floor's sentence shows once; the Export tab names the tiles each file adds up to.

1. Build has a card "Who sees whose answers" with three choices, stored on the validation
   (instrument.anonymity: named, hidden, anonymous; a migration gives every existing row
   named):
   - Named (the default, today's behaviour): Results show each person's name and fields.
   - Names hidden: personal invites and reminders still work, and Share still shows who has
     finished; Results, exports and the AI show answers without names or fields. The card says
     "With few people, comparing filtered views or the times on Share can still point to
     someone." (decision 0058).
   - Anonymous: the public link only; no personal invites, no name or email fields. The card
     says "With few people, comparing filtered views can still point to someone."
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
4. Results under Names hidden and Anonymous: every response is "Anonymous [N]", numbered
   across all its links in a fixed order that is not when it started (md5 of the response id
   and the instrument id; decision 0058, since Share shows who started when), the same number
   on Results, the files, the PDF and the Actions citations; the Responses tab has no field columns, no submitted
   time and no sort by field, and no row for an invitee who has not started; the item detail
   and the registers show "Anonymous [N]" and no field column. A dropdown value or a
   perspective picked by fewer than 3 counted respondents (MIN_GROUP) is not offered as a
   filter, and the line under the bar says "A value fewer than 3 people gave is not offered as
   a filter. Comparing a filtered view with an unfiltered one can still point to someone in a
   small group." No text field exists under these levels, so the text "contains" filter does
   not show (a search over answers and reasons was not built). The filters and splits by
   dropdown fields and perspectives stay (decision 0058). Then:
   - Lists of people never follow a field or perspective filter. The lists are the Responses
     tab's rows, the registers' rows, the item detail's who-said-what list, the Actions
     citations, the answers, people and missing CSV rows, and the PDF's registers and sign-off
     record. A field or perspective filter applies to the tiles, the Agreement view and the
     gaps only; the lists show the whole validation with the line "Filters by a field or
     perspective change the charts only, and lists of people stay whole. Comparing a group's
     figures with the lists can still point to someone in a small group." The answer kind,
     comment and include-unsubmitted filters still apply to the lists, except "Not answered"
     and the switch under Names hidden (below).
   - A filter (all its parts together) that keeps fewer than MIN_GROUP counted respondents
     draws no tile and no Agreement view: "Fewer than 3 people match these filters. Widen them
     to see the results.", which takes the place of the line "Showing [N] of [M] responses".
     The query keeps nobody, so the CSV items file and the PDF draw nothing either (the PDF no
     confidence chart) and say the same.
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
     has submitted. Amended 2026-10-06 after the fourth audit: under Names hidden every
     Results view, list, file, the PDF and Write actions count submitted responses only; the
     include-unsubmitted switch is off and not shown, the line "This validation hides names,
     so Results count submitted answers only." takes its place, and the SQL leaves out a
     response not submitted whatever the switch (with it on, a response with fewer answer
     rows, a person missing from an item's detail or Share's only unfinished person said who
     has not finished); the MIN_GROUP rules and the project file count the same set. Under
     Names hidden no list says who has not finished either: the "Not answered" kind is not
     offered and no list of people follows it, and the item detail lists no one without an
     answer (its Not yet answered count stays). Under Anonymous the Responses tab and the
     people file show no Progress, Answered or Items seen, since the items a person could see
     differ by perspective, and under both levels there is no sort by progress. Under both
     levels no row fades on a live update.
   - With a field or perspective filter the tiles count the people the filter keeps while the
     lists and the person files list everyone: an exception to the rule that every number
     reconciles with the CSV export to the row, by decision 0058. The Items with totals file
     follows the whole filter and adds up to the answer tiles (Agreement, Different priority,
     Disagree, Unclear) and the three item tiles under any filter; the people, minutes,
     missing items and with-a-reason tiles add up from the person files only with no field or
     perspective filter (amended 2026-10-06; waiting on Mihai in docs/review-list.md, two
     requirements in conflict).
   - The line under the filter bar also shows while a split is on, and on the Agreement tab
     while the gaps view compares groups (amended 2026-10-06). The floor's sentence shows
     once: the Agreement tab keeps its controls and draws no box of its own.
5. Exports under Names hidden and Anonymous: the answers, people and missing-item CSVs use
   "Anonymous [N]" and carry no field columns and no times; under Names hidden the people file
   has no Status, Since submitting, Answered, Items seen or Minutes to submit. The PDF summary
   names nobody; its sign-off record shows "Anonymous [N]" under Anonymous and lists no one
   under Names hidden. The project JSON and Export everything do not let a reader tie a
   response to a person or a moment: responses carry no invite id and no fields (their
   perspectives stay, amended 2026-10-06, so an imported project shows each item to the same
   people; perspective breakdowns stay under decision 0058), and every time of a response
   (start, last save, submits), of its answers and of its missing items is the export's time
   (null stays null); under either level no personal invite is written, so the imported
   project has the public link only and no reminder can go to someone who already answered.
   Amended, decision 0058: the responses go in the order of their numbers, under Names hidden
   only the submitted ones (firstSubmittedAt the export's time, signedOff kept), and no
   answer on an item fewer than 3 of them could see is written.
   Amended 2026-10-06: the missing items follow their responses' numbers, then their ids, and
   an action that cites an answer or a missing item the file leaves out is not written. The
   Export tab says so; under the two levels its first line says which tiles the Items with
   totals file adds up to under any filter, and that the others add up from the Answers,
   People and Missing items files only with no field or perspective filter, since those list
   everyone. The import refuses a personal invite on such a validation, and a response
   field that is not a dropdown's value.
6. Write actions under Names hidden and Anonymous send no respondent fields to the model
   (answers, reasons, comments and missing items only, as today otherwise) and no answer on an
   item fewer than MIN_GROUP counted respondents could see; citations read "Anonymous [N]".
7. Share under Anonymous shows "Anonymous validations use the public link only." in place of
   the personal invites form; the server refuses an invite, a reminder (one or all) and a new
   link on an anonymous validation.
8. The privacy policy says what each level hides and what it does not: under Names hidden the
   database still links an answer to its invite, for reminders; the same Anonymous number
   follows one person across items, so a reason that names its author shows that person's
   other answers; free text goes as written; with few respondents, comparing views (a filtered
   against an unfiltered view, two breakdowns, a group's figures against the list) can still
   point to someone, as can, under Names hidden, the finishing and last-save times on Share and
   the AI's actions citing only people who submitted (decision 0058). Amended 2026-10-06: it
   says the floor of 3 applies to a filter, a group of a breakdown and an item, and that with
   no filter on the count of people, their confidence and their missing items show however
   few answered; and that under Names hidden answers show only once submitted. SECURITY.md
   says the same. Marked for the lawyer (L43).
9. Unit tests: the rules per level (fields allowed, labels, the MIN_GROUP filter), the
   queries and the CSVs per level with a workspace A and B test for any new query, the lists
   that follow no field or perspective filter, the MIN_GROUP floor, the folded and left-out
   groups, the items seen by few, the export round trip with its shared time, and every
   server refusal under Anonymous. From decision 0058: the numbers not in start order and the
   same in every list, file and citation; "Not answered" under Names hidden; the project
   file's order, submitted only and items seen by few, with its round trip; the progress sort
   under Anonymous; the items file reconciled with the tiles under a field filter; no
   confidence chart under the floor; and the main Results queries under Names hidden on 600
   responses within 500 ms each. Amended 2026-10-06: under Names hidden a response not
   submitted in no list, file, detail, count, citation or the PDF, with the switch on or off;
   the switch fixed off; the project file's missing items in the order of the numbers, an
   action that cites a left-out answer not written, the perspectives kept on a round trip;
   the risk line with a split. Playwright: set Anonymous on Build, publish, answer through
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
- Project file: toFile writes the export's time, no perspectives (kept since the fourth audit) and no personal invite;
  missingReference refuses a personal invite or a non-dropdown field. Test: project.test.ts.
- Refusals: remindInvitee and remindAll (src/lib/reminders.ts). Test: reminders.test.ts
  "refuses a reminder, a new link and an invite on an Anonymous validation".
- Copy: About you, the Build hints, the Export tab line; docs/legal/privacy.md and
  lawyer-review.md L43; SECURITY.md, Data.
- e2e/anonymous.spec.ts: four phones, a Sales filter that leaves the Responses tab whole with
  the line; written, run by the main session.
- Playwright: the main session ran the suite on 3707f3a: 17 passed, including
  e2e/anonymous.spec.ts.

Amended 2026-10-06, decision 0058 ("Breakdowns, risk disclosed"), built:
- Numbering: anon in results.ts head is a window over the instrument's responses ordered by
  md5(response id || instrument id) under the "C" collation under the two levels; the
  citations' people in src/db/queries/insights.ts follow the same order. Test: results.test.ts
  "numbers the responses in an order that does not follow their start, the same in every
  list, file and citation" (starts set in the reverse of the fixed order).
- "Not answered" under Names hidden: parseResultsFilter and personFilter drop the kind, the
  filter bar does not offer it (results/page.tsx), personConditions ignores it in person mode,
  detail.item lists no row without an answer. Tests: results.test.ts "lets Not answered narrow
  no list under Names hidden...", results-filter.test.ts "drops Not answered under Names
  hidden...".
- Project file: hiddenSelection and fixedKey in src/lib/export/project.ts; the Export tab's
  lines (EXPORT_COPY.tab.namesHidden, namesHiddenStatus). Tests: project.test.ts "writes a
  validation that hides names in the order of its numbers..." (round trip under both levels)
  and the amended "keeps who sees whose answers on a round trip...".
- Progress sort refused under Anonymous (personOrder). Test: results.test.ts "keeps every list
  of people whole...".
- Copy: RESULTS_COPY.smallValues and personLevel, ANONYMITY_META hints, docs/copy, the PM app
  board, privacy.md (L43), lawyer-review.md L43, SECURITY.md.
- Reconciliation: EXPORT_COPY.tab.lineHidden on the Export tab under the two levels; the
  exception row in docs/review-list.md. Test: results.test.ts reconcileItemsFile, under a
  field filter on 600 responses and with an item seen by few.
- Timing: detail.item in one query (in_agg, aguard, afew); every main Results query under
  Names hidden timed on 600 responses in results.test.ts "reconciles 600 generated responses
  in every view's query under 500 ms".
- The floor's sentence in place of "Showing [N] of [M]" (results/page.tsx; e2e/anonymous.spec.ts
  checks it, written, not run in this session); no confidence chart in the PDF under the floor
  (summary.ts, summary-html.ts; test: summary.test.ts).

Amended 2026-10-06 after the fourth audit, built:
- Names hidden counts submitted responses only: parseResultsFilter gives includeUnsubmitted
  false (src/lib/results-filter.ts); results.ts head's people, insights.ts's people and
  results.fieldValueCounts and perspectiveCounts leave out a response not submitted under
  Names hidden; the files and the PDF write no "Includes answers not submitted yet" line
  there (files.ts, summary.ts); RESULTS_COPY.submittedOnly in place of the switch
  (results/page.tsx). Tests: results-filter.test.ts "keeps the include-unsubmitted switch off
  under Names hidden..."; results.test.ts "leaves the invitee who has not submitted out of
  every list, file, detail and count under Names hidden" (the Responses tab, the answers,
  people, missing and items files, the registers, every item's detail, the sign-offs, the
  counts in both modes, the PDF, the citations, Write actions' input and the value counts,
  with the switch off, on, and on with a kind; under Anonymous the same response stays).
- Project file: hiddenSelection writes the missing items of a validation that hides names in
  the order of their responses' numbers, then by id (B2), leaves out an action citing an
  answer or missing item the file leaves out (S1), and toFile keeps the perspectives (S2).
  Tests: project.test.ts "writes a validation that hides names in the order of its
  numbers..." (five missing items on four responses, their times set in the reverse order;
  the action citing CL-02 not written) and "keeps who sees whose answers on a round trip..."
  (CL-03 for three Approvers, its visibility and counts the same after the round trip).
- The timing test runs no ANALYZE; the Names hidden loop runs three filters on 455 submitted
  responses (results.test.ts).
- The risk line with a split or the gaps view: riskLineShown (results-filter.ts,
  filter-bar.tsx). Test: results-filter.test.ts "the risk line under the filter bar".
- The floor's sentence once: agreement-tab.tsx draws no box of its own under the floor
  (e2e/anonymous.spec.ts checks it, written, not run in this session).
- Copy: EXPORT_COPY.tab.lineHidden names the tiles, namesHidden and namesHiddenStatus;
  docs/copy/app.md and errors.md; privacy.md and lawyer-review.md L43; SECURITY.md;
  INTERFACES.md (Anonymity, ResultsPrefs, Results, ProjectExport).
