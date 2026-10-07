# 108 The compact preview, 2026-10-07

Decision 0061 (Mihai: "in preview we show 1 card, and maybe the top navigation etc.").

What the panel shows (?compact=1 on the preview route): the dashed band above the frame card,
the respondent header (logo or initials, name, the closing note, the dark mode switch), the
chapter row, the chapter's title and its first card in a single column of at most 488 px, and
a muted line "1 of [N] cards. The full view shows them all." The card is the real ItemCard,
so the rating row, the proposed mark, the reason box and the View more button are what the
respondent gets. The frame card sits 16 px from the top (48 in the full app) so the panel does
not open on empty ground.

The Wrap up in compact (the Closing card focused): the heading, the tally tiles, the
still-to-finish line and the closing fieldset (the missing-item box, the question, the
confidence, the sign-off). The still-to-finish list and the higher, lower, not needed and
unclear sections stay out: with 119 items they were 119 rows at 40 percent (Mihai's second
screenshot). The Wrap up's own preview strip is gone with the chapter screen's: the band above
the app says it once.

Sizes: desktop renders a 720 px column scaled to 58.3 percent in a 420 by 440 box (720 is
under the md breakpoint, so the cards' grid is one column and the card fills the column); a
phone renders 390 px at true size in a 390 by 600 box. The full view keeps the 1032 px column
at 40.7 percent in its own tab (design note 65).

Rings: none in the panel. The caption under the device toggle still names what the step
changes; the full view draws the rings as before.

Checked everywhere (decision 0056): the panel is one component on Import, Shape, Build and
Share (with-preview.tsx); the sample project has no panel (decision 0021); /sample is the full
app and is unchanged.
