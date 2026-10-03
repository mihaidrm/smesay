# E8-3 Agreement per item and per area: three views, split by group, sorted and filtered

User: a PM reading where the list stands
Status: ready
Outcome: the agreement per item and per area in the view the PM reads best, split by any
respondent field on request, matching the CSV export to the row.

Amended 2026-10-03 (design note 40; Mihai: change from the bars view to a pie chart and
other types; the pushed back split; sort and filter).

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
3. Under a method without a proposal (rate-blind, or 1 to 5 fit), every view shows the
   distribution of values picked instead, with the same colours per bucket; the legend says
   which.
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
  design system's Data section and the landing page legend follow when E8 is built.

## Technical notes
src/db/queries/results.ts `agreementByItem(workspaceId, instrumentId, filter, split?)`; the
percentage is agree divided by answered on the item, rounded half up, computed in SQL so the
CSV and the screen cannot differ. The three views draw from the same rows; the donut is an
SVG arc per slice with the dataviz rules (2 px surface gaps, text in ink tokens) in
src/components/app/charts.tsx, a new design-system component (a line in the design note
when built).
