# 115 The chapter row takes two rows, then scrolls, 2026-10-07

Mihai, 2026-10-07, with a screenshot of a desktop chapter card whose pills (About you, Forms &
flows 0/9, Forms & approvals 0/1 ... Housing 0/4, Wrap up) covered eleven rows above the first
item: "i thinnk i said we should only show the areas on 2 rows and add horizontal scroll bar if
they are too many but instead you made it show all of them which looks bad". His words of the
morning were "show the areas on 2 rows at the top if they are going off screen, and also add a
scroll bar so that user can easily navigate through them" (design note 109).

What was wrong: note 109 read "2 rows" as "wrap", so from 576 px the pills wrapped onto as many
rows as the list needed (flex-wrap) and the scrollbar stayed on the phone only. A validation
with forty areas pushed the first item below the fold.

Decided, at every width (the same component serves the respondent, /sample and the builder's
preview, decision 0056):
- One row while the pills and their 6 px gaps fit the card. The server sends one row.
- Two rows, never more, once one row would run off: the list (the `ol`, still one list for a
  screen reader) takes the width of the wider half of the pills plus a pixel, so flex-wrap puts
  the first half on the first row and the rest on the second (a pill moves down once the row is
  full, and the second half fits a row that wide). The rule is twoRowWidth() in
  src/components/respondent/chapter-row.tsx, unit tested; the widths are read before paint
  (useLayoutEffect, react.dev/reference/react/useLayoutEffect; a no-op on the server) and again
  whenever the card's width changes (ResizeObserver,
  developer.mozilla.org/docs/Web/API/ResizeObserver).
- When two rows are wider than the card, the row scrolls sideways under a thin scrollbar in
  the hairline-strong token on a transparent track (scrollbar-width and scrollbar-color,
  developer.mozilla.org/docs/Web/CSS/scrollbar-width and /scrollbar-color; Safari on iOS
  ignores both and shows its own overlay bar while the row moves), with 12 px of padding
  under the pills so the bar does not sit on them, and the active pill brought into view as
  before.
- Hit areas: on one row a pill's hit area reaches 8 px above and below it (the 48 px tap
  target); on two rows 3 px, so the hit areas of the two rows meet in the 6 px gap and do not
  overlap (note 109 kept 8 px under 576 px because the phone had one row; two rows on a phone
  take 3 px too).
- A phone with many areas now scrolls two rows instead of one long line: the second row is
  what Mihai asked for, and the bar still says there is more.

Test: e2e/respondent-navigate.spec.ts, "chapter row takes two rows, then scrolls": eight
one-item areas (ten pills) at 1440 by 900 sit on exactly two rows inside the card with nothing
to scroll (data-rows 2, two distinct pill tops); the same page at 390 by 844 keeps two rows,
overflows its box and reads scrollbar-width thin. The unit test covers the width rule.
