# 125 Rating rows aligned across a row, 2026-10-12

Mihai, 2026-10-12, with a screenshot of the sample's first chapter at desktop width: "priority
buttons must always be alligned on cards". CL-01's summary took two lines and CL-02's one, so
CL-02's rating row sat 23 px higher than its neighbour's. The same shift happens when one item
of a row has details (the View more row, 32 px and the 8 px gap) and the other has none, and
when one has a reference line (16 px and the 2 px gap) and the other has none.

Decided:
- On the two-column grid (md and up, 768 px, tailwindcss.com/docs/responsive-design;
  chapter-screen.tsx) every card of a chapter reserves the same space above its rating row:
  two summary lines (46 px, the clamp's maximum), the reference line when any item of the
  chapter has one, and an empty View more row when the card has no details but another item of
  the chapter has. The rating row then starts at one offset in every card of the chapter, so
  the two cards of a row align.
- The chapter screen works out which parts any item of the chapter has (rowOf) and hands it to
  the card as the row prop; the Build preview's single card and the one-item layout pass
  nothing and keep their natural height.
- A phone's single column reserves nothing: no card sits beside another, and a blank line under
  a short summary would only lengthen the page.
- An open card (View less) shows its whole summary and its details, so it grows; the grid
  stretches its neighbour as before and the neighbour's rating row stays where it was.

Rejected:
- Pinning the rating row to the bottom of the card: the reason or comment box opens under the
  row, so a box opening in one card would push the neighbour's rating row down while the
  respondent is typing.
- Measuring the neighbour's summary in the browser and matching it: more code and a layout
  pass after render, for the same result as the reservation.

Cost: a one-line summary leaves one blank line (23 px) under it on desktop, and a card without
details in a chapter with details keeps a 32 px blank row. Recorded in docs/review-list.md.

Checked: e2e/sample-instrument.spec.ts, "the sample's cards", reads the two summaries' line
counts (CL-01 two, CL-02 one at 1440) and the two rating rows' tops.
