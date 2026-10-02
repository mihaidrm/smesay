# E8-3 Agreement per item and per area with the distribution of answers

User: a PM reading where the list stands
Status: ready
Outcome: a table per area with a stacked bar per item that matches the CSV export to the row.

## Acceptance criteria
1. Agreement tab (PM app board): areas in order, each with its items: reference, text,
   proposed value, the stacked bar (agree, pushed back, disagree, unclear in the status
   solids with 2 px gaps and direct labels; docs/design-system.md, Brand 06), the counts, and
   the agreement percentage; an area row with the totals.
2. Under a method without a proposal (rate-blind, or 1 to 5 fit), the bar shows the
   distribution of values picked instead, with the same colours per bucket; the legend says
   which.
3. Coverage per perspective (E5-4): a column "answered of could see" when perspectives exist.
4. Every count equals the row in the items CSV (E10-1) and every per-item sum equals the
   answers CSV filtered to that item: a test exports both on the seed and on 600 generated
   responses and compares every cell, with the include-unsubmitted switch (E8-1) on and off.
5. Aggregates run in SQL (group by item and kind); the 600-response case stays under 500 ms.
6. Clicking an item opens the item detail (E8-5).

## Out of scope
- Charts beyond the stacked bar: the design system's histogram is E8-6's and the confidence
  one is in the PDF (E10-3).

## Open questions
- None.

## Technical notes
src/db/queries/results.ts `agreementByItem(workspaceId, instrumentId)`; the percentage is
agree divided by submitted answers on the item, rounded half up, computed in SQL so the CSV
and the screen cannot differ.
