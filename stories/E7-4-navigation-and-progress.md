# E7-4 Navigation by chapter with per-chapter progress; an item never rated is distinguishable from one skipped

User: an expert who wants to see where they are and come back later
Status: ready
Outcome: the chapter row and the progress bar show what is done, movement is free, and the
Wrap up tells unrated from skipped.

## Acceptance criteria
1. The chapter row (About you, each area with "[done]/[count]", Wrap up) sits at the top of
   every screen and every pill is a link; a 4 px progress bar in the PM's accent under it
   (decision 0016). The active chapter uses the accent, others white with a hairline.
2. Continue is never blocked: the footer shows Back, "Continue to [NEXT AREA]" or "Continue to
   Wrap up", and the note "[N] of [M] still to rate here. You can come back later." or "All
   [M] rated in this chapter."
3. An item never touched shows "Not rated yet" and is listed in the Wrap up under "Still to
   finish" with "Not rated yet"; an item where the respondent started an answer and did not
   finish is listed with what is missing ("Say why."). A skipped-on-purpose state does not
   exist in R1: the Wrap up lists both as still to finish, with different notes, which is the
   distinction the business plan asks for.
4. A returning respondent lands on the first chapter with an unfinished item (note 12,
   finding 9); "Welcome back" shows the count answered.
5. Playwright: rate one of two items in a chapter, go to Wrap up through the row, see "1 still
   to finish" naming the item.

## Out of scope
- A "skip this item" button: not in R1. Recorded as a candidate in stories/backlog.md.

## Open questions
- None.

## Technical notes
Progress is computed on the server from answers and the visible set (E5-4) and sent with every
autosave response, so the row never disagrees with the database.
