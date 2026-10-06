# Design note 100: who sees whose answers, 2026-10-06

Made in the Claude Code cloud session of 2026-10-06, under decision 0044, for stories/E5-7.
Mihai: "Do we have the option of making responses annonymous? i mean the PM setting up should
have this option". Asked whether personal invites stay, he picked "Both, PM picks".

## What was decided

- Build gets a card "Who sees whose answers" with three radio cards drawn like the method's:
  Named (the default, the product before this note), Names hidden and Anonymous. It sits
  directly above the Respondent fields card, not with the scoring: its rule is a rule on the
  fields (dropdowns only under the two levels that hide names), so the refusal it can give and
  the card that fixes it are next to each other. No new component: the radio cards are the
  Scoring card's (docs/design-system.md, the method cards).
- Stored as instrument.anonymity (migration 0036, default `named`, a check constraint),
  checked on the server, locked once published like the method: a level changed mid-run would
  show names a respondent was told were hidden. Build on version N copies it; the project file
  carries it; the visitors' sample and the preview of a project with no validation are Named.
- Under Names hidden and Anonymous the respondent fields can only be dropdowns. The check runs
  on both saves (the level and the fields), each under the instrument row's lock, so two tabs
  cannot end with a text field under a hidden level. The message names the fields to change.
  At least one field is still required (E5-1); a dropdown Role is the usual one.
- About you says, in bold above the fields, "Your answers are anonymous. No name or email is
  asked, and the team sees your answers without a name." (amended after the audit: the first
  wording, "Nothing here asks who you are", was absolute) or "The team sees your answers
  without your name. They can see that you have finished." The Names hidden invite email
  drops "recorded under your name" and says the same. A personal invite carries no name or
  role into the response under either level: the PM typed them about one person, so the role
  hint would put that person's own words back on Results.
- The rule lives in the SQL. results.ts head reads the level: under the two levels who is
  null, every response is numbered across all the validation's links (anon; by start at
  first, by a fixed order since decision 0058, below), the
  invitees who have not started are not people, and every row the queries return carries
  pub_fields ({}) and pub_submitted_at (null) and no reminders. The filters, the split and
  the gaps still read the stored dropdown values. insights.ts's citations follow the same
  rule. A page, a CSV or the PDF cannot show what the query does not return.
- The Responses tab shows Respondent, Status, Progress and With a reason or comment. Submitted,
  Source and Reminders go too, not only the fields: Share lists the invitees with their
  reminders and their last save, so any of the three could match a row to a name. (Under Names hidden Status and Progress go too, after the audit.)
- A dropdown value picked by fewer than 3 counted respondents (MIN_GROUP, decision 0031) is
  not offered as a filter: resultsContext counts the values (results.fieldValueCounts, under
  the page's switch) and reads the URL again against the values offered, for the page and the
  export route alike. A field with none offered is not shown; a line under the bar says why.
  In a split those values were summed into one group, "Groups under 3 people"; amended after
  the audit, see below.
- The CSV files drop the field columns, Submitted at, Source, Reminders and Perspectives. The
  People file keeps Minutes to submit: a duration, not a time, and the median tile reconciles
  with it. The PDF's sign-off record reads Submitted with no time, in the order of the numbers.
  The project file writes no invite id and no fields on those responses; the import puts each
  on its validation's public invite. The Export tab says what the files leave out.
- Write actions sends no respondent field at all under the two levels: each respondent is a
  bare R ref. The prompt's text and its input shape are unchanged, so no eval is owed
  (decision 0039).
- Share under Anonymous shows one line in the personal invites card, "Anonymous validations
  use the public link only.", and the server refuses a send or a New link. Under Names hidden
  the card's line says Results show the answers without names.
- The privacy policy says what each level hides and what it does not (the invite link in the
  database under Names hidden, the device cookie, the save times, free text, small groups),
  marked L43 for the lawyer.

## Amended after the audit

An audit the same day showed the two levels could be defeated: filters that narrow a list to
one or two people, then the same Anonymous number across lists; a split group of one; an
item only two people see; Share's states beside the Responses tab's; and the project file's
times and personal invites. The stricter model, under Names hidden and Anonymous:

- Two read modes in src/db/queries/results.ts. Aggregate (the strip, the Agreement view, the
  gaps, the detail's counts) takes the whole filter. Person (the Responses tab, the
  registers, the detail's list, the answers, people and missing files, the PDF's registers
  and record) drops the field and perspective conditions, and under Names hidden the status
  condition, in the SQL itself. A list therefore always shows the whole validation, with the
  line "Filters by a field or perspective change the charts only, and lists of people stay
  whole. Comparing a group's figures with the lists can still point to someone in a small
  group." (reworded by decision 0058). The kind, comment and switch still narrow a list: they hold no identity.
  The Actions citations never followed a filter.
- A floor on aggregates: when the filter keeps fewer than MIN_GROUP counted people, the
  aggregate query keeps nobody (guard), numbers says tooFew, and the strip, the Agreement
  view, the items file and the PDF's numbers say "Fewer than 3 people match these filters.
  Widen them to see the results." Only with a filter on: with none, the lists show the same
  people anyway. The floor counts the whole filter, the kinds included, as asked.
- Groups in a split and in the gaps: a value with fewer than MIN_GROUP counted people within
  the filter is no group; those people are one folded group when they reach MIN_GROUP
  together, else left out; Not given alike. The folded group is a flag (folded, group null),
  keyed "small", so an option called "Groups under 3 people" stays its own group. The items'
  bars read a second query with no split, so a left-out group is still in the item's bar.
- Items seen by few: an item fewer than MIN_GROUP counted people can see (perspectives) is
  few in every query: its answers count in no tile and no row, the Agreement table reads
  "Fewer than 3 answers", the detail lists nobody, no register or file row carries it, and
  Write actions sends none of its answers. The strip's item tiles leave it out too, so the
  tiles still add up from the rows and no subtraction recovers its counts.
- Names hidden: Share names each invitee with their state, so nothing on Results says who
  has submitted. The Responses tab is Respondent and With a reason or comment, in the order
  of the numbers; no status filter, no status or progress sort (also refused in the SQL); no
  "Not submitted" or "Changes not submitted again" mark in the registers, the detail or the
  PDF; the People file drops Status, Since submitting, Answered, Items seen and Minutes to
  submit; the PDF's record lists no one. Under both levels no person row fades on a live
  update.
- The project file (and Export everything, which writes it per project): every time of a
  response, of its answers and of its missing items is the export's (null kept), perspectives
  are none (kept as they are since the fourth audit, below), and no personal invite of such a
  validation is written. The import refuses a
  personal invite there and a response field that is not a dropdown's value. An imported
  project numbers its responses by the fixed order of decision 0058 (below), on its new ids.
- Reminders refuse an Anonymous validation on the server, as invites and New link do.
- About you under Anonymous: "No name or email is asked" in place of "Nothing here asks who
  you are". The Build hints of both levels add "Do not ask for a name in a dropdown or in
  the closing question." The privacy policy says what neither level hides (the number follows
  one person across items; free text goes as written).

Checked: results.test.ts (the lists under a field, perspective and status filter, the floor,
the folded and left-out groups, an item two people see, the headers per level, the sorts,
another workspace in both modes), results-agreement.test.ts, summary.test.ts,
project.test.ts, reminders.test.ts, insights.test.ts on the fake transport. The four Results
queries were timed on 600 responses before and after (the byItem split first joined a
per-person table, four times slower; it now joins the small table of values).

## Decision 0058: breakdowns kept, risk disclosed

A third audit the same day asked whether the field and perspective breakdowns should stay
under the two levels at all, since comparing views still points to people in small groups.
Mihai picked "Breakdowns, risk disclosed" over "No breakdowns" (docs/decisions/0058). What
changed with it:

- The numbers. Share shows who started when, so a number by start was a name. Under the two
  levels anon follows md5(response id || instrument id), compared byte by byte (the "C"
  collation), in results.ts head and insights.ts; the project file writes the responses in the
  same order (fixedKey, node's createHash). The number is now a window over the instrument's
  responses in people, not a join to a separate CTE: the join ran once per person on fresh
  tables, and the window roughly halved the main queries under Names hidden on 600 responses.
- "Not answered" under Names hidden. A list of people with an item not answered says who has
  not finished, which Share matches to a name. The kind is not offered under Names hidden (no
  chip, the URL drops it, personFilter drops it), a person-mode read ignores it, and the item
  detail lists no one without an answer while its Not yet answered count stays. Keeping the
  chip for the charts only was weighed and left: it would need a line of its own for little.
- The project file: under Names hidden the submitted responses only, so the file does not say
  who has not finished; under both levels no answer on an item fewer than 3 of the responses
  written could see, and an action keeps the citations left (one left with none goes, since
  its words could quote what went; since the fourth audit, below, an action that lost any
  citation that way goes).
- No progress sort under Anonymous either: there is no Progress column there.
- The words. The line under the filter bar, the line above the lists, the Build hints, the
  privacy policy (L43) and SECURITY.md say that values under 3 are not offered and lists do
  not follow field filters, and that comparing views, and under Names hidden the times on
  Share and the citations of people who submitted, can still point to someone.
- The reconciliation. With a field or perspective filter the tiles count the filter's people
  and the person files everyone; the Items with totals file adds up to the tiles under any
  filter (results.test.ts reconcileItemsFile), the Export tab's first line says so under the
  two levels (EXPORT_COPY.tab.lineHidden), and the exception is a review-list row (the answer
  and item tiles only, and waiting on Mihai since the fourth audit, below).
- The item detail reads its list and its counts in one query: the person-mode people, each
  marked when the whole filter keeps them (person mode keeps everyone aggregate mode keeps,
  since every person-mode condition is the aggregate one or more), with the floor and the
  items seen by few worked out again on the marked people. Under Names hidden on 600
  responses it took 615 to 638 ms in two reads before and 140 to 317 ms in one read after on
  tables never analyzed. (An ANALYZE after the test's bulk insert was tried and taken out
  after the fourth audit, since it changed the Named timing loop too.)
- Under the floor the sentence takes the place of "Showing [N] of [M]" and the box above the
  bar goes; the PDF draws no confidence chart under the floor. (The Agreement tab still drew
  a box of its own with the same sentence until the fourth audit, below.)

## Rejected

- A free-text search over answers and reasons for the "contains" filter (acceptance 4's last
  line): no such filter exists today, and under the two levels there is no text field, so the
  contains box does not show and a name can match nothing. Recorded in docs/review-list.md.
- (Done after the build, 2026-10-06.) The perspective filter follows the dropdown rule: under
  the two levels a perspective picked by fewer than 3 counted respondents is not offered
  (results.perspectiveCounts); the per-answer Perspectives column of the CSV goes.
- Dropping Minutes to submit from the People file under Anonymous: it would break the
  reconciliation of the median tile, and a duration does not match Share's finishing times.
  Under Names hidden it goes (amended after the audit): a minutes cell says the person
  submitted, which Share matches to a name.

## Where

drizzle/0036_anonymity.sql; Anonymity in INTERFACES.md and src/db/types.ts; ANONYMITY_LEVELS in
src/db/schema.ts; src/lib/anonymity.ts; src/lib/instruments.ts saveAnonymity and saveFields;
build/anonymity-form.tsx and build/page.tsx; src/lib/respondent-rules.ts carriedFields;
src/components/respondent/about-you.tsx; src/lib/mail/templates/invite.ts; src/lib/invitees.ts;
share/invites-card.tsx; src/db/queries/results.ts; src/db/queries/insights.ts;
src/lib/results-context.ts; src/lib/results-filter.ts optionsFor; src/lib/results-agreement.ts
buildAgreement (folded, few, key), src/lib/results-gaps.ts; ReadMode and few in results.ts;
src/lib/reminders.ts; results/filter-bar.tsx, responses-tab.tsx, registers-tab.tsx, detail-panel.tsx, page.tsx,
agreement-tab.tsx, export-tab.tsx; src/lib/export/files.ts, summary.ts, project.ts;
src/lib/insights.ts. Board: PmApp draws the card on Build.

## Checked

Unit tests on the test database: the migration on a row from before it; save, refuse, copy and
lock on Build; every Results query under Names hidden on the sample (names, fields, times,
reminders, invitee rows, numbering, sorts, the name filter); the three CSV headers and the strip
reconciled; fieldValueCounts and resultsContext, with another workspace reading nothing; the
PDF; the project file's round trip; Write actions on the fake transport; a refused invite and
the Names hidden email; a hidden personal Start storing no name. e2e/anonymous.spec.ts is
written and not run in this session; the main session runs e2e.

Closed after the second build (2026-10-06): the two leaks the rework left. Under Names hidden
the include-unsubmitted switch was kept on and not shown (replaced after the fourth audit,
below: it is off). Under Anonymous the Responses tab and the people file show no Progress, Answered or Items seen,
since "of N" counts the items a person could see, which differ by perspective.

## Fourth audit

A fourth audit the same day found that, with the switch kept on under Names hidden, a list
still said who had not finished: a response not submitted had fewer rows in the Answers file
and no row in an item's detail, and when one invitee had not finished, Share named them. The
fixes, decision 0058 unchanged:

- Under Names hidden only submitted responses are in any view. parseResultsFilter fixes the
  switch off and the page shows "This validation hides names, so Results count submitted
  answers only." in its place; the SQL leaves out a response not submitted in results.ts
  head, insights.ts and the value counts whatever a query is given, so the files, the PDF,
  the citations, the MIN_GROUP rules and the project file count the same set. Keeping the
  switch on and hiding the unfinished rows only was weighed and left: the counts would then
  differ from the lists by exactly the unfinished people. The numbers run over the submitted
  responses, so a number can shift when someone submits, as it can when someone starts under
  Anonymous.
- The project file under the two levels writes each response's perspectives as they are: the
  perspective breakdowns stay under decision 0058, and with none an imported project showed
  every item to everyone. It writes the missing items in the order of their responses'
  numbers, then by id, since the order they were written in follows the times Share shows;
  and it leaves out an action that cites any answer or missing item the file leaves out.
- The line under the filter bar shows while a split is on, and on the Agreement tab while the
  gaps view compares groups, not only when a value is left out (riskLineShown).
- The floor's sentence shows once: the Agreement tab keeps its controls and draws no box.
- The Export tab's line names the tiles the Items with totals file adds up to (the answer and
  item tiles) and says the others add up from the person files only with no field or
  perspective filter. The reconciliation exception stays a review-list row, now waiting on
  Mihai: decision 0058 and the CLAUDE.md rule that every number reconciles with the export
  are two requirements in conflict.
- The privacy policy no longer says that nothing under 3 people is drawn: the floor applies to
  a filter, a group and an item, and with no filter on the count of people, their confidence
  and their missing items show however few answered.
- The timing test runs no ANALYZE: on tables never analyzed, the slowest Names hidden query of
  three filters took 217 ms (the split), the item detail 180 ms.
