# E8-3 Agreement per item and per area: three views, split by group, sorted and filtered

User: a PM reading where the list stands
Status: built
Outcome: the agreement per item and per area in the view the PM reads best, split by any
respondent field on request, matching the CSV export to the row.

Amended 2026-10-03 (design note 40; Mihai: change from the bars view to a pie chart and
other types; the pushed back split; sort and filter).

Amended 2026-10-04 (decision 0044, after the audit; docs/review-list.md): acceptance 3 reads
"rate-blind" only, since a 1 to 5 fit list may show its proposal (E5-2); acceptance 2's five
slices are the kinds' view, and a rate-blind donut has a slice per value; the stacked bar's
direct labels are its counts in words under it, since no number in a status colour passes
contrast; the percentage is summed into areas and groups in the model with the SQL's rule,
tested to agree.

## Acceptance criteria
1. Agreement tab (PM app board): areas in order, each with its items: reference, text,
   proposed value, the answers, the counts, and the agreement percentage; an area row with
   the totals. The four kinds are named Agree, Different priority, Disagree, Unclear
   everywhere on the tab (decision 0014), plus Not answered.
2. A view switch, kept per PM per instrument (E8-1's results_prefs): Table (default): a
   stacked bar per item in the status solids with 2 px gaps and direct labels
   (docs/design-system.md, Data); Columns: per area, one aligned bar per kind on a common
   baseline, the readable view (Cleveland and McGill, design note 40); Share: one donut per
   area and one for the whole list, at most five slices (the four kinds and Not answered),
   the numbers printed beside every slice, never a donut per item. The legend names the
   view's kinds and colours whenever two or more series are drawn.
3. Under a list where no proposal was shown (rate-blind), every view shows the distribution
   of values picked instead, with the same colours per bucket; the legend says which.
4. "Split by [field]": a select of the dropdown respondent fields (none by default) that
   turns each item's row into one bar per group in the Table and Columns views, and the
   donuts into one per group in the Share view; groups with fewer than 3 answers on an item
   are drawn but not compared, with E8-6's banner. The split is in the URL.
5. The page's filter bar (E8-1) narrows every view and every count; the area totals and the
   percentages are recomputed on the filtered answers. Sort the items within an area by
   reference (default), by agreement percentage, by different priority, by disagree or by
   unclear, ascending or descending, the sort in the URL.
6. Coverage per perspective (E5-4): a column "answered of could see" when perspectives exist.
7. Every count equals the row in the items CSV (E10-1) exported with the same filter, and
   every per-item sum equals the answers CSV filtered to that item: a test exports both on
   the seed and on 600 generated responses and compares every cell, with no filter, with a
   role filter, and with the include-unsubmitted switch (E8-1) on and off.
8. Aggregates run in SQL (group by item, kind and, when split, group); the 600-response case
   stays under 500 ms in every view.
9. Clicking an item opens the item detail (E8-5).
10. Playwright: on the seeded project switch to Columns and see one bar per kind for
    Submitting; switch to Share and see the list donut with "19 of 30 agree"; split by Role
    and see Sales and Finance bars on CL-04; sort by disagree and see CL-06 first.

## Out of scope
- A chart per respondent, or a timeline of answers: not in R1.
- The histogram of confidence: in the PDF (E10-3). The gaps view: E8-6.

## Open questions
- None. The donut and the kind's name are decided (decision 0044, items 5 and 6); the
  design system's Data section follows when E8 is built; the landing page's legend already
  names the four kinds (design note 53, 2026-10-04).

## Technical notes
src/db/queries/results.ts `agreementByItem(workspaceId, instrumentId, filter, split?)`; the
percentage is agree divided by answered on the item, rounded half up, computed in SQL for the
CSV and with the same rule in the model for the sums (as built: agreement.byItem and
src/lib/results-agreement.ts percentOf, tested to agree on every item). The three views draw from the same rows; the donut is an
SVG arc per slice with the dataviz rules (2 px surface gaps, text in ink tokens) in
src/components/app/charts.tsx, a new design-system component (a line in the design note
when built).

Built 2026-10-04 (design note 61, decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/agreement-tab.tsx: the areas
  in the list's order (src/lib/results-agreement.ts buildAgreement), each with its total bar,
  its counts in words and its figure, then its items under visible column headers:
  reference, text, proposed value, the bar with its counts in words under it (no number
  inside a segment, for contrast), the figure: the percentage, "[N] rated" where no proposal
  was shown (even "0 rated" beside questions alone), or "No answers". The area's totals are
  the first row of its table, so the bars line up; group rows have their counts too.
- Acceptance 2: Table, Columns and Share (src/components/app/charts.tsx, note 61), the
  choice kept per PM per instrument (results_prefs.view, saveView); the legend names the
  series.
- Acceptance 3: a rate-blind instrument draws the values picked in one blue ramp (apart in
  hue from Unclear's violet), the same colour per value in every view, and its figures read
  "[N] rated"; an item with no proposal in an instrument that shows them counts as Rated
  beside the kinds (review list).
- Acceptance 4: "Split by" over the dropdown fields, in the URL (split); a group with fewer
  than 3 answers on an item is drawn faded with no percentage, and the banner says why, once.
  The people who left the field empty are the last group, "Not given", so the groups add up
  to the item. Columns draws the groups of an area on one scale; Share draws a donut per group
  for the whole list. A group summed over items (Columns, Share) is compared only with 3
  answers and 3 people who answered one item, so one person is never singled out (decision
  0031); its label says "Fewer than 3 answers" or, short of people, "This group is not compared, so
  one person cannot be singled out" (the people are a lower bound, so no number). Each aligned
  bar is named under it.
- Acceptance 5: the filter bar narrows every count; the sort within an area by reference,
  agreement, different priority, disagree or unclear, both ways, in the URL; ties keep the
  list's order in the same direction.
- Acceptance 6: "Answered of could see" per item, under a visible column header, when the
  instrument has perspectives; tested on an item seen by one perspective.
- Acceptance 7 and 8: src/db/queries/results.ts agreement.byItem, one SQL query grouped by
  item, kind, value and group; src/db/queries/results.test.ts checks each cell's kinds, values
  per code, people who could see the item and percentage against the answer rows and the
  people the same filter keeps, on the sample, on a rate-blind copy with perspectives and an
  empty split field, and on 600 generated responses, with no filter and with a role filter,
  the switch on and off, split and not, each query under 500 ms. The items CSV is E10-1's
  (acceptance 3), from these rows.
- Acceptance 9: an item's title in the Table view opens its detail (E8-5), the item in the
  URL.
- Acceptance 10: e2e/results-agreement.spec.ts.
