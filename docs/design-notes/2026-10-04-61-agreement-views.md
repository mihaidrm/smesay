# Design note 61: the Agreement tab's three views, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-3, under decision 0044.
Design note 40 decided the three views; this note records how they are drawn.

## What was decided

- One chart component, src/components/app/charts.tsx, drawn on the server with no script:
  StackedBar (segments as flex shares with 2 px gaps, the count inside a segment only when it
  holds 12 percent or more), AlignedBars (one bar per series on a common baseline, the value
  above it), Donut (an SVG circle per slice with a dash pattern, 1.2 units cut between slices
  for the surface gap, never per item, the line and the numbers beside it as its legend) and
  Legend. Each chart is an image to assistive technology with every count in its name.
- Colours: the four kinds take their status solids (Agree, Different priority in the pushed
  back solid, Disagree, Unclear); Not answered is an absence, a dashed outline; a value rated
  with no proposal (Rated) and the values of a rate-blind list take one violet ramp.
- Rate-blind lists draw the values picked in every view. In a list that shows its proposals,
  an item with none is answered by a value rated, counted as Rated beside the kinds.
- Split by a field: the Table draws a bar per group under each item; Columns a set of bars
  per group per area; Share one donut per group for the whole list (a donut per group per
  area would be too many). A group with fewer than 3 answers is drawn faded with no
  percentage, and E8-6's banner says why.
- Sort within an area: ties fall back to the list's order in the same direction, so sorting
  by disagree, most first, puts the later of two tied items first.
- The view is kept per PM per instrument (results_prefs.view); the split and the sort are in
  the URL with the filter.
- Performance: the per-item query carries each response's fields with its answers, so the
  split needs no second join (a first version took 680 ms at 600 responses split by role; it
  takes under 100 ms now).

## Changed after the audit (same day)

- No number sits inside a segment of the stacked bar: white on the status solids measured
  1.89 to 4.02 against the 4.5 needed, so each bar's counts are printed in words under it
  ("3 agree · 1 different priority"), in muted ink, every count with a name.
- The values picked take a blue ramp from the missing-item solid; the violet ramp's first
  step read as Unclear (1.09:1 light).
- A rate-blind figure reads "[N] rated", never "No answers" or 0%.
- The donut's gap is 2 px at its drawn size and shows the card, not a track.
- A split keeps the people who left the field empty as "Not given", last; a group summed over
  items is compared only with 3 answers and 3 people or more; Columns draws an area's groups
  on one scale; the banner shows once, for the view on screen.
- The view switch is the design system's segmented control.

## Checks

- src/lib/results-agreement.test.ts, src/db/queries/results.test.ts (every cell against the
  answer rows, 600 generated responses under 500 ms), e2e/results-agreement.spec.ts.
