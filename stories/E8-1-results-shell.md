# E8-1 Results page: configurable headline tiles, one filter bar, tabs, empty state

User: a PM opening Results while the link is open
Status: ready
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
user.results_prefs jsonb { [instrumentId]: { tiles: string[], view: "table" | "columns" |
"share" } } (INTERFACES.md), one migration.
