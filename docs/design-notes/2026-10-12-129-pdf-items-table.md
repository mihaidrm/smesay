# 129 The PDF's items table, 2026-10-12

Mihai, 2026-10-12, with a page of his own summary: "need a smart fix for this -- looks very
bad like that". The items table had twelve columns. Nine of them held a number and a header
of one or two long words (Different priority, Not answered, Agreement, Different priority %),
and a browser's automatic table layout gives every column at least its longest word; nine
such columns took the page, and the Item column was left with its own longest word, so an
item of 190 characters ran to 18 lines of one or two words each.

Decided:
- The items table has fixed column widths (table-layout: fixed, from a colgroup:
  developer.mozilla.org/docs/Web/CSS/table-layout): Reference 9 percent, Item 36, Proposed
  8, Answers 20, Agreement 9, Different priority % 9, Not needed % 9. The item text keeps its
  width whatever the headers need; a 190-character item takes five lines.
- The six counts (Agree, Different priority, Disagree, Unclear, Rated, Not answered) are one
  cell, Answers: the area's stacked bar at cell size (130 by 8 px) over the counts in words
  ("2 agree · 1 different priority · 1 disagree · 1 unclear · 2 not answered"), the same
  words the bar's label carries, so nothing is colour alone. The legend sits under the Items
  heading too, since the items start a new page.
- Agreement and the two shares stay as columns (decision 0062), at 9 percent each, their
  headers at 7.5 pt so "Different priority %" wraps by word.
- A register's reference column stays on one line (FRM-03 broke at its hyphen).

Rejected:
- Shorter or abbreviated headers for twelve columns: not plain English, and twelve columns
  still do not fit A4 portrait at a readable size.
- A text row and a numbers row per item: the numbers lose their headers after the first page
  of each table, and every item costs two rows.
- Landscape pages for the items: a deck with pages in two orientations.

Checked: a scratch render of four long items (Mihai's) through Chromium at A4; the unit test
reads the widths, the headers, the bar cell and the second legend; e2e/export-summary.spec.ts
(200 generated items, 50 responses) passed here at the 30-page limit, where the old table
ran to 31 pages in this container.
