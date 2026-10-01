# E8-6 Conflict view: where respondent groups disagree, by any respondent field

User: a PM who needs to know that Sales and Finance want different things
Status: ready
Outcome: pick a field, see the items where the groups differ most, four by default, with the
small-group rule.

## Acceptance criteria
1. Under the agreement table (PM app board): "Where groups disagree, by [field]" with a select
   of the dropdown respondent fields (Role by default when it exists); the four items with the
   largest gap in agreement share between groups, each with the two-group comparison bars
   from Brand 06 and the line "Sales: 0 of 2 agree. Everyone else: 3 of 3 agree."; "Show all"
   expands to every item.
2. With more than two groups, the gap is the largest difference between any two groups and the
   bars show every group.
3. Groups with fewer than 3 answers on an item are shown but not compared, with the banner
   "Groups with fewer than 3 answers are shown but not compared, so one person cannot be
   singled out." (docs/copy/errors.md; 3 is the recommendation there).
4. The gap is computed in SQL; a unit test on fixed rows checks the ordering and the
   small-group exclusion.
5. Each item links to the detail (E8-5).

## Out of scope
- Comparing by a text field: not in R1 (free text does not group).

## Open questions
- The threshold N for small groups: 3 recommended (docs/copy/errors.md). Mihai decides.

## Technical notes
src/db/queries/results.ts `gapsByField(workspaceId, instrumentId, fieldKey)`; the landing page
output "Where groups disagree, by role" is this view.
