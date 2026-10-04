# E7-4 Navigation by chapter with per-chapter progress; an item never rated is distinguishable from one skipped

User: an expert who wants to see where they are and come back later
Status: built
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
   finding 9; the landing is built in E7-3, resumeAt); "Welcome back" shows the count
   answered.
5. Playwright: rate one of two items in a chapter, go to Wrap up through the row, see "1 still
   to finish" naming the item.

6. The chapter row and the progress bar take `effectiveAccent()` from the workspace (E2-5,
   acceptance 3); Playwright: with a workspace accent set, the active chapter and the bar show
   that colour (the check E2-5 deferred here).

## Out of scope
- A "skip this item" button: not in R1. Recorded as a candidate in stories/backlog.md.

## Open questions
- None.

## Technical notes
Progress is computed on the server from answers and the visible set (E5-4) and sent with every
autosave response, so the row never disagrees with the database. (As built: the row shows
what the server holds complete as this page last heard it; an answer saved on another device
shows on the next load, see the built notes.)

Built 2026-10-04 (design note 54, decision 0044):
- Acceptance 1: the row (src/components/respondent/chapter-row.tsx) sits under the header of
  every chapter screen and the Wrap up (About you, reached again after Start, has no row and
  returns through Start; docs/review-list.md): About you, each area with "[done]/[count]", Wrap up, each a
  link (?at=about, ?at=[N], ?at=wrap) that moves in the page; the active pill in the
  workspace's accent, the others white with a hairline; each pill 32 px high with a 48 px
  hit area; a 4 px bar in the accent under it, a progressbar with its numbers. The single
  long page shows the bar only (E5-3).
- Acceptance 2: the footer has Back and "Continue to [NEXT AREA]" or "Continue to Wrap up",
  never disabled, and the note "[N] of [M] still to rate here. You can come back later." or
  "All [M] rated in this chapter."
- Acceptance 3: the Wrap up lists every item without a complete answer on the server under
  "Still to finish", with Not rated yet, Say why. or Write your question. (gapsOf); each row
  opens its own item (its chapter, on that item in the one-item layout). Until E7-5 the live
  Wrap up shows only this, "All [M] items are answered." when nothing is left, and Back:
  the tally, the form and Submit come with E7-5, so the page takes nothing it does not keep.
- Acceptance 4: a returning visit lands on the first unfinished chapter (E7-3, resumeAt), or
  on the Wrap up when everything is complete, with "Welcome back, [FIRST NAME]. You answered
  [N] of [M] last time." on that landing until the respondent moves, whenever the response
  holds an answer, complete or not (landingOf, src/lib/respondent-rules.ts, unit-tested).
- Acceptance 5 and 6: e2e/respondent-navigate.spec.ts sets the accent #1F4F7A in Settings,
  rates one of two items, sees 1/2 and the footer count, goes to the Wrap up through the row,
  sees "1 still to finish." naming the other item, and reads the accent on the active pill
  and the bar.
- The counts are the server's as this page knows them: the answers route returns whether
  the answer is complete and the saver keeps it per item, from the reply with the highest
  version. An answer saved on another device or in another window reaches the counts on
  the next load, or on this page's next save of that item (docs/review-list.md).
- Audit 2026-10-04: 2 blocking (a Submit with no action and a form that kept nothing on the
  live Wrap up), 9 should-fix, 9 nits; fixed as above or recorded in docs/review-list.md.
- Re-audit 2026-10-04: no blocking, 9 should-fix, 12 nits. Fixed: the Wrap up counts the
  items the respondent sees, not the whole set; the row shows on About you after Start
  (acceptance 1, "every screen"); a screen change moves focus to the new screen's heading;
  a row of "Still to finish" opens its own card in every layout; the rule for the counts is
  doneFrom with unit tests; Go to wraps on a phone; INTERFACES.md; the review list's table;
  a pill's count in words for a screen reader, the singular lines, a first visit back with
  nothing complete, a modifier click on a pill, Welcome back going on Next item, the motion
  timings. Recorded: the board's pill and count (docs/review-list.md).
