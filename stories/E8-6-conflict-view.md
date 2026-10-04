# E8-6 Conflict view: where respondent groups disagree, by any respondent field

User: a PM who needs to know that Sales and Finance want different things
Status: built
Outcome: pick a field, see the items where the groups differ most, four by default, with the
small-group rule.

Amended 2026-10-04 (decision 0044): the example line had a group of 2 compared, which
decision 0031 does not allow; the groups are the field's values (acceptance 2), so the line
names each group rather than "Everyone else".

## Acceptance criteria
1. Under the agreement table (PM app board): "Where groups disagree, by [field]" with a select
   of the dropdown respondent fields (Role by default when it exists); the four items with the
   largest gap in agreement share between groups, each with the two-group comparison bars
   from Brand 06 and the line "Sales: 1 of 3 agree. Finance: 3 of 3 agree."; "Show all"
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
- None. The threshold is 3 (decision 0031).

## Technical notes
src/db/queries/results.ts `gapsByField(workspaceId, instrumentId, fieldKey)`; the landing page
output "Where groups disagree, by role" is this view.

Built 2026-10-04 (design note 63, decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/conflict-view.tsx under the
  views of the Agreement tab: "Where groups disagree, by [field]" with a Compare by select of
  the dropdown fields (Role by default, else the first; the choice is gaps=[key] in the URL),
  the four items with the largest gap, each with a bar per group and the line per group,
  then "Show all [N] items" (a native details element). Not shown on a rate-blind list
  (there is no agreement to compare) or with no dropdown field.
- Acceptance 2: the gap is the largest difference in agreement share between any two
  compared groups, in percentage points; every group has its bar.
- Acceptance 3: a group with fewer than 3 answers on an item is listed with no bar and no
  numbers ("[group]: fewer than 3 answers.") and is not in the gap; the banner shows once on
  the page (not again when the split above shows it).
- Acceptance 4: src/db/queries/results.ts gaps.byField computes the shares, the gap and the
  order in SQL under the page's filter and switch; src/db/queries/results.test.ts checks the
  ordering and the exclusion on fixed rows (teams of 3, 3 and 2), the sample by role against
  the Agreement tab's split, and another workspace.
- Acceptance 5: each item's text links to its detail (E8-5).
- Playwright: e2e/results-conflict.spec.ts on the sample by role: no group reaches 3
  answers (Sales has 2 submitted), so no item is compared and the banner says why.
