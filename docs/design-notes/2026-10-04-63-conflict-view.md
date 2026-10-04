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
- Answers are agree, different priority, disagree and unclear. Only items with a proposal
  shown are in the view, and the view is not drawn when no item has one (as on a rate-blind
  list): agreement means nothing where no proposal was shown, as the Agreement tab's figures
  say (E8-3).
- The people who left the field empty are a group of their own, Not given, last, as in the
  Agreement tab's split, so the groups add up to the item; it is compared like any group
  with 3 answers or more. Groups are in name order.
- The gap is in percentage points ("[N] points apart", "1 point apart"), the largest
  difference in share between two compared groups. The top four are items with a gap above
  0; ties and items without a gap follow as the Agreement table above lists the items
  (src/lib/results-gaps.ts).
- The bar per group is the share that agrees, in the agree solid on the tint track, the
  label in muted ink at 112 px and "[A] of [N]" in mono, as on Brand 06. The bars are hidden
  from screen readers, which read the line under them with the same numbers.
- With no item compared, the line says so ("yet" with no filter on; under a filter it says
  to clear it or compare by another field); when groups are compared and agree on every
  item, the line says that instead. An item nobody answered reads "No answers to
  compare."
- A small group's numbers can still be worked out by subtraction from the item's counts in
  the Agreement table when it is the only small group; decision 0031 as worded is met
  (no number is shown for it), and the review list carries the point.
- "Show all" is a native details element, so it works without script and keeps its state
  per page view.
- The section sits under the views of the Agreement tab and is not drawn on a rate-blind
  list.

## Components added

- The comparison bars and the gap row (conflict-view.tsx). Not in the design system before.

## Checks

- src/db/queries/results.test.ts (where groups disagree, fixed rows with a Not given group,
  the 600-response timing), src/lib/results-gaps.test.ts (the items kept, the order, the
  top four), src/lib/results-filter.test.ts (the field in the URL).
- e2e/results-conflict.spec.ts: the sample by role (no group compared), and the sample with
  generated respondents (a compared item, its gap and its line).
