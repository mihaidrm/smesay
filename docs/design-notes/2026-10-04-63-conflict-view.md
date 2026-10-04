# Design note 63: where groups disagree, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-6, under decision 0044.
The PM app board's comparison under the agreement table and Brand 06's two-group bars are the
starting point; this note records what was decided while building it.

## What was decided

- The groups are the values of one dropdown respondent field (Role by default). The board
  and the landing page compare one group with everyone else; the story's acceptance 2 asks
  for every group, which also shows which two groups are furthest apart.
- Decision 0031 holds everywhere: a group with fewer than 3 answers on an item is listed
  under the item with a dashed empty track, no bar and no numbers, and is not in the gap.
  The Agreement tab's split (E8-3) draws such a group faded with its counts; here the
  numbers are the comparison, so they are left out.
- Answers are agree, different priority, disagree and unclear; a value rated with no
  proposal is not an agreement and does not count towards the 3.
- The gap is in percentage points ("[N] points apart"), the largest difference in share
  between two compared groups. Items without two compared groups follow in the list's order.
- The bar per group is the share that agrees, in the agree solid on the tint track, the
  label in muted ink at 112 px and "[A] of [N]" in mono, as on Brand 06; each bar is an
  image with its numbers in its name.
- "Show all" is a native details element, so it works without script and keeps its state
  per page view.
- The section sits under the views of the Agreement tab and is not drawn on a rate-blind
  list.

## Components added

- The comparison bars and the gap row (conflict-view.tsx). Not in the design system before.

## Checks

- src/db/queries/results.test.ts (where groups disagree), src/lib/results-filter.test.ts
  (the field in the URL).
- e2e/results-conflict.spec.ts.
