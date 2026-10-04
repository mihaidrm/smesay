# E8-1 Results page: configurable headline tiles, one filter bar, tabs, empty state

User: a PM opening Results while the link is open
Status: built
Outcome: the headline numbers the PM chose, a filter bar that every tab, number and export
honours, the tabs the prototype shows, and an empty state before the first answer.

Amended 2026-10-03 (design note 40; Mihai: the tallies at the top configurable, filter by
department, by those who pushed back, by those who left comments; the pushed back split).

## Acceptance criteria
1. Results (PM app board): the headline strip holds up to six tiles chosen by the PM from
   the catalogue below, six on by default; then the tabs Agreement, Different priority and
   Disagree (n), Questions and gaps (n), Responses, Actions (n), Export. "Pushed back" is not
   a label anywhere on Results (decision 0014 names the kinds: Agree, Different priority,
   Disagree, Unclear).
2. The tile catalogue, each one SQL number: submitted of invited ("5 of 7"); agreement
   ("63%, 19 of 30", agree over answered); different priority (answers of kind change);
   disagree; unclear; missing items suggested; answers with a reason or comment; items with
   no answer yet; items fully agreed (every answer agree); items most pushed back (count of
   items with at least one change or disagree); median minutes to submit; responses in
   progress. "Choose tiles" opens a checklist of the twelve with the six limit; the choice is
   kept per PM per instrument (design note 40, question 3) in user.results_prefs.
3. One filter bar under the strip, applied to every tile, tab, chart, register, detail and
   export: any respondent field (dropdown fields as a multi-select, text fields as contains),
   answer kind (Agree, Different priority, Disagree, Unclear, Not answered), "With a reason
   or comment", perspective (E5-4), status (Submitted, In progress). Filters are in the URL
   so a view can be shared within the workspace; "Clear filters" resets. A line under the
   strip reads "Showing [N] of [M] responses: [filters]" while any filter is on.
4. Empty state before any answer: "No answers yet. The link is [open until DATE / not
   published]. Share it, or open the sample project to see what results look like." with the
   two buttons (docs/copy/errors.md). A filter that matches nothing: "No answers match these
   filters. Clear filters" (docs/copy/errors.md).
5. Loading and error states exist for the strip and every tab (CLAUDE.md, PM side): a
   skeleton for the first load, and a banner naming the tab that failed with Try again.
6. Every number on the strip comes from one SQL query per instrument (src/db/queries/
   results.ts) that takes the filter as a parameter, computed in the database, not in the
   browser (CLAUDE.md, dashboard rules), and reconciles with E10-1's CSV exported with the
   same filter to the row; the reconciliation test is written here against the seed with no
   filter and with a role filter, and extended in E10.
7. Unsubmitted answers (decision 0030): the answers of a respondent who has not submitted
   appear in every number, register and detail, marked as not submitted (a submitted
   respondent's answers changed after the Submit and not submitted again are stored in
   place, so they count as that respondent's answers, with E8-2's "changes not submitted
   again" mark; docs/review-list.md) (the respondent's
   status pill and a "not submitted" mark on the row). A switch at the top of Results,
   "Include unsubmitted answers", defaults on; off removes them from the headline strip, the
   charts, the tally, the registers and the item detail, and the setting is kept per PM. A
   test checks the strip with the switch on and off against the seed (the in-progress
   respondent has 4 answers).
8. The sample project shows the same page with the watermark (E8-8).
9. Playwright: open the seeded project's Results, see "5 of 7" and 63% with the switch off,
   the counts including the 4 unsubmitted answers with it on; filter by role Sales and see
   the strip and the tab counts change; swap a tile and reload to find it kept.

## Out of scope
- Each tab's content: E8-2 to E8-6. Live updates: E8-7.
- A filter per tile (a tile filtered differently from the page): R2 (design note 40).

## Open questions
- None. The donut, the kind's name and the per-PM tile choice are decided (decision 0044,
  items 5 to 8; docs/review-list.md for the full review).

## Technical notes
The filter and the include-unsubmitted switch are one ResultsFilter parameter
(INTERFACES.md) on every results query (src/db/queries/results.ts), so the CSV export
(E10-1) takes the same parameter and the reconciliation holds for any filter. The
respondent-field filters unpack response.fields (jsonb) by key, as E8-2's tracker does.
user.results_prefs jsonb { [instrumentId]: { tiles: string[], includeUnsubmitted: boolean,
view: "table" | "columns" | "share" } } (INTERFACES.md), one migration (0019).

Built 2026-10-04 (design note 60, decision 0044; docs/review-list.md for the points taken):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/page.tsx: the strip, then
  the tabs with their counts as links (the tab in the URL); each tab says which story brings
  its content (E8-2 to E8-4, E9-1, E10-1). "Pushed back" is on no label of Results; the
  E15 guide line that named a "Pushed back tab" now names the Different priority and
  Disagree tab. The stepper's Results step is a page from here, the project's current step
  once its link is published (Share done).
- Acceptance 2: src/lib/results-tiles.ts, the catalogue of twelve and the six by default;
  Choose tiles (tile-chooser.tsx) a checklist in a modal dialog, at most six, saved per PM
  per instrument (user.results_prefs, migration 0019), checked again on the server.
- Acceptance 3: src/lib/results-filter.ts and filter-bar.tsx: the bar selects people, as
  the Responses tab will list them (E8-2, acceptance 2); in the URL; Clear filters; the
  "Showing" line. A value rated with no proposal shown (Rated) is a kind of the bar where the
  instrument hides the proposal, and never counts in agreement.
- Acceptance 4: the empty state names the link's state (open until, open, not open until,
  closed, revoked, not published) with Share it and Open the sample project; the no-match
  state with Clear filters.
- Acceptance 5: loading.tsx and skeletons.tsx (the Skeleton component, note 60); the
  numbers and the tab each in their own error boundary (catchError) with a banner naming
  the part and Try again.
- Acceptance 6: src/db/queries/results.ts numbers(), one query per instrument with the
  filter; rows() the answers the same filter keeps (what E10-1's CSV writes);
  src/db/queries/results.test.ts adds the rows up against the numbers with no filter, the
  role filter, a kind and the comment filter, the switch off and on, and reads nothing of
  another workspace.
- Acceptance 7: the switch, on by default, kept per PM per instrument; off it removes the
  unsubmitted answers from every answer count; the people tiles (submitted of invited, in
  progress) count people whatever the switch. The rows' "not submitted" mark is the rows'
  stories' (E8-2, E8-4).
- Acceptance 8: the sample's Results carries the watermark band; the band on every other
  screen of the sample is E8-8's.
- Acceptance 9: e2e/results.spec.ts.
- Audit 2026-10-04: 0 blocking, 9 should-fix, 6 nits. Fixed: a text field's box resets with
  the URL; the no-match state only when the filter keeps nobody (people with no counted
  answer still show, for the Responses tab); every tile reconciles in the test with rows of
  people and missing items too (results.people, results.missing; an empty start and a bounced
  invite in the test), and E10-1 adds the two files (review list); the filter bar and the
  "Showing" line under the strip; the URL always carries the switch, so a shared view reads
  the same; each tab and each filter gets its own error boundary; the action errors are
  named in the copy and the switch shows its own; the sample's watermark band; E10-1's
  "Rated", E6-1's stepper line and the guide's tips on Results; nits: one pass over the
  answers per item, invites counted once sent, the "Showing" line a status region, the
  switch fetches once, unused copy gone, the empty state without a sample button says
  only "Share it".
- Check of those fixes 2026-10-04: 0 blocking, 6 should-fix, 2 nits. Fixed: the page's
  boundary is no longer keyed, so a filter change keeps the focus and the status line (each
  tab keeps a boundary of its own); a first open goes to the URL with the switch, and the
  switch writes its value there; INTERFACES.md lists results.people and results.missing;
  E10-1 names its four files; the cross-workspace test covers people and missing items; the
  PM app board's band opens with the watermark line; the tile chooser and the switch render
  once (revalidatePath); the actions' workspace guard is recorded as checked by reading.
