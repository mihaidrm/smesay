# Design note 61: the Agreement tab's three views, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-3, under decision 0044.
Design note 40 decided the three views; this note records how they are drawn.

## What was decided

- One chart component, src/components/app/charts.tsx, drawn on the server with no script:
  StackedBar (segments as flex shares with 2 px gaps, no number inside a segment; the caller
  prints the counts in words under it), AlignedBars (one bar per series on a common baseline,
  the value above it and the series named under it), Donut (an SVG circle per slice with a
  dash pattern, a 2 px gap at its drawn size between slices over the card, never per item,
  the line and the numbers beside it as its legend) and Legend. Each chart is an image to
  assistive technology with every count in its name.
- Colours: the four kinds take their status solids (Agree, Different priority in the pushed
  back solid, Disagree, Unclear); Not answered is an absence, a dashed outline; a value rated
  with no proposal (Rated) and the values of a rate-blind list take one blue ramp from the
  missing-item solid. Every value is also named (the counts in words, the bar labels, the
  legend), so colour is never the only cue.
- Rate-blind lists draw the values picked in every view. In a list that shows its proposals,
  an item with none is answered by a value rated, counted as Rated beside the kinds.
- Split by a field: the Table draws a bar per group under each item; Columns a set of bars
  per group per area; Share one donut per group for the whole list (a donut per group per
  area would be too many). A group with fewer than 3 answers on an item is drawn faded with
  no figure, and the banner says why; a group summed over items needs 3 answers and 3 people
  who answered one item ("This group is not compared, so one person cannot be singled out" otherwise; the count of people is a
  lower bound, so the line does not state a number).
- Sort within an area: ties fall back to the list's order in the same direction, so sorting
  by disagree, most first, puts the later of two tied items first.
- The view is kept per PM per instrument (results_prefs.view); the split and the sort are in
  the URL with the filter.
- Performance: the per-item query carries each response's fields with its answers, so the
  split needs no second join (a first version took 680 ms at 600 responses split by role; it
  takes under 100 ms now).

## Changed after the audit (same day)

- No number sits inside a segment of the stacked bar: white on the status solids measured
  1.89 to 4.02 against the 4.5 needed. Each bar, the area's and every group's included, has
  its counts in words under it ("3 agree · 1 different priority"), in muted ink.
- The values picked moved from a violet to a blue ramp for hue; the first step and Unclear
  are close in lightness either way (1.05:1 light), so each value is named in the counts, the
  bar labels and the legend.
- A figure where no proposal was shown (a rate-blind list, or an item with none) reads "[N]
  rated", never a percentage or "No answers", and such an item sorts with the unanswered.
- The area's totals are the first row of its table, so its bar lines up with the items'.
- A split keeps the people who left the field empty as "Not given", last.
- The view switch is the design system's segmented control.

## Checks

- src/lib/results-agreement.test.ts, src/db/queries/results.test.ts (every cell against the
  answer rows, 600 generated responses under 500 ms), e2e/results-agreement.spec.ts.
