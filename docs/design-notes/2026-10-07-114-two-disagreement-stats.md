# Design note 114: a different priority and not needed, two stats everywhere, 2026-10-07

Made in the Claude Code cloud session of 2026-10-07 under decisions 0044, 0056 and 0062.

## What Mihai asked

"In the results, there are 2 types of agreements we should show: There is a difference if the
user thinks the priority is different, compared to the user thinking this is not a valid
requirement. So we need to show and track both of these stats independently."

## Where the two kinds were already apart

The answer kinds `change` (Different priority) and `disagree` (Disagree, the respondent's Not
needed; decision 0014) were already separate in the schema, the strip's Different priority
and Disagree tiles, the SQL counts per item, the CSV and PDF count columns, the two
registers, the item detail, the AI prompt and the receipt email. Nothing there changed.

## Where they were merged, and what each place shows now

Decision 0056: every place found, all fixed in one pull request.

1. The tile "Items with a different priority or disagree" (items with at least one change or
   disagree) is two tiles: "Items with a different priority" and "Items marked not needed".
   src/lib/results-tiles.ts (ResultsNumbers.differentPriorityItems and notNeededItems, the
   catalogue of thirteen), src/db/queries/results.ts (per_item counts `changed` and
   `not_needed`). storedTiles drops the old id, so a PM who had the merged tile sees neither
   until they choose again; docs/copy/app.md says so.
2. The tab "Different priority and Disagree (9)" summed the two registers. It reads
   "Different priority 7 · Disagree 3" (RESULTS_COPY.pushedCounted; tabCounts gives change
   and disagree, not their sum). The plain name stays for the detail's Back link, a failed
   load's banner, the guide tip and the Actions tab's too-long line.
3. The Agreement figure stood alone. Beside it: Different priority = change over answered and
   Not needed = disagree over answered, answered being the four kinds (a value rated with no
   proposal is not counted, as for the agreement), rounded half up in SQL
   (agreement.byItem changePercent, disagreePercent) and in the model with the same rule
   (src/lib/results-agreement.ts shareOf, sharesOf, figureOf, figureLine). The Table view
   shows two columns after Agreement (empty where the figure reads "[N] rated" or "No
   answers", since the figure column already says so); the Columns heading and the Share
   donut line read "60% agree · 23% different priority · 10% not needed" (the donut keeps its
   count: "18 of 30 agree · ..."); the gap line under Where groups disagree names each
   group's counts: "Sales: 2 of 4 agree, 2 different priority, 0 not needed." (GapGroup
   gains change and disagree).
4. The items CSV gains "Different priority %" and "Not needed %" after "Agreement %"; the PDF
   gains the same two columns per item and the area line reads as the Columns heading.
5. Copy: the quickstart's "who pushed back and why" reads "who chose a different priority,
   who said not needed and why"; the landing demo gets a Disagree tile (five tiles, three per
   row under 1280 px) and the group card's "Did not agree with Should have" is two labelled
   pairs of bars, "A different priority than Should have" (Sales 2 of 2, everyone else 0 of
   3, in the pushed-back solid) and "Not needed" (Sales 0 of 2, everyone else 1 of 3, in the
   disagree solid); the styleguide's demo tab reads "Different priority 7 · Disagree 3".

## The sample

Lukas Berg (engineering manager) marks CL-05 "Approved expenses are paid with the next salary
run" not needed, with the reason that a claim approved on the 21st waits five weeks and a bank
transfer within five working days would do. This puts a disagree on an item nobody gave a
different priority, so the two item counts differ (5 with a different priority: CL-01, 02,
03, 04, 06; 3 marked not needed: CL-04, 05, 06), and a disagree outside HR, so a split by role
never puts every disagree in one group. The totals are 18 agree, 7 different priority, 3
disagree, 2 unclear of 30 submitted answers (60 percent agree; 22 of 34 with the in-progress
answers); no item is fully agreed, so that tile reads 0 on the sample (review list). The
landing demo is hard-coded and mirrors the new seed (the chip 60%, the tiles, CL-05 at 80%).

## Not changed

The `pushedBack` pill status, the `--pushed` colour token and the design system's "Pushed
back" status row are code and design names, not text a PM reads on Results. The boards
PmApp.dc.html and PmAppV2.dc.html keep the merged tile as a record of the 2026-10-04 design.
Decision 0033's numbers are the sample's history.

## Tests

src/lib/results-filter.test.ts (the two tiles, the dropped id, the tab counts),
src/lib/results-agreement.test.ts (sharesOf, figureOf with shares, figureLine, the shares
per row, area and group), src/lib/export/files.test.ts (each share recomputed from the row's
own cells, the two item tiles as two counts of the rows), src/db/queries/results.test.ts
(reconcileStrip covers the two item counts; the SQL shares against the rows and the model;
the gap groups' counts), src/lib/export/summary.test.ts (the view's shape),
results-boundary.test.tsx (the tab's name); e2e results.spec, results-agreement.spec,
results-registers.spec, results-conflict.spec and landing.spec with the new numbers.
