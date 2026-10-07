# 109 The chapter row wraps on a desktop and shows its scrollbar on a phone, 2026-10-07

Mihai, 2026-10-07, with a screenshot of a desktop respondent page whose pills (About you,
Forms & flows 0/9, Forms & approvals 0/1, International support 0/1, Assisted sales 0/1, Data
quality 0/1, Experiment...) ran off the right edge of the card: "maybe show the areas on 2
rows at the top if they are going off screen, and also add a scroll bar so that user can
easily navigate through them".

What was wrong: the row (src/components/respondent/chapter-row.tsx, E7-4 acceptance 1) was
one flex line that scrolled sideways at every width, with its scrollbar hidden. On a phone the
active pill was scrolled into view, so the respondent saw part of the next pill and could
swipe. On a desktop a list with six or more areas was cut at the card's edge with nothing to
say there was more: a mouse has no swipe and the bar was hidden.

Decided:
- From the 576 px column (the @xl container query, src/components/respondent/frame.ts) the
  pills wrap onto as many rows as they need (flex-wrap), 6 px apart in both directions, and
  the row no longer scrolls (overflow visible). A list with eight areas takes two rows in the
  1000 px chapter card; nothing is cut off. Each pill's hit area reaches 3 px above and below
  it on the wrapped rows (8 px on a phone, for the 48 px tap target), so the hit areas of two
  rows meet in the 6 px gap and do not overlap; with 8 px they would have overlapped by 2 px
  and the bottom edge of a pill would have opened the pill under it.
- Under 576 px the row stays one scrolling line, with the active pill brought into view as
  before, and the scrollbar now shows, thin, in the hairline-strong token on a transparent
  track, with 12 px of padding under the pills so the bar does not sit on them.
  scrollbar-width and scrollbar-color are standard CSS (developer.mozilla.org/docs/Web/CSS/
  scrollbar-width, developer.mozilla.org/docs/Web/CSS/scrollbar-color). Safari on iOS ignores
  both and shows its own overlay bar while the row scrolls, so a respondent on an iPhone sees
  the bar only while moving it; the pill cut at the edge is the other cue there.
- Mihai asked for two rows and a scroll bar. The two rows answer the desktop screenshot; a
  bar there would scroll nothing once the rows wrap, so the bar is the phone's. Recorded in
  docs/review-list.md.
- The builder's preview ring around the row (stories/E5-6) has a 24 px radius instead of a
  full pill, so it keeps its shape around two rows; around one row it looks the same as before
  (the row is 48 px high, so the pill radius was 24 px).
- Checked per decision 0056: the Build preview (the 1032 px column in the iframe, the same
  container query) and /sample render the same component. The sample has three areas, so it
  stays on one row at every width.

Test: e2e/respondent-navigate.spec.ts, "chapter row wraps onto two rows on a desktop": a
list of eight one-item areas, opened at 1440 by 900, the last pill lower than the first, both
inside the card, and the row with nothing to scroll. The first test keeps its checks of the
row at 390 px.
