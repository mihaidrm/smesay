# Design note 90: the step tips, the sample walkthrough and the rescue tips, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E15-3 and E15-4, under
decision 0044. Builds on design notes 39 and 89.

## What was decided

- One guide card at most per step page, under the step's title where the page's banners
  are, chosen from the page's data by a pure function per page (src/lib/guide.ts importTip,
  shapeTip, buildTip, shareTip); a rescue tip comes first, since it is the one that unsticks.
  A page whose data matches nothing shows none. No card on the sample's steps but Results,
  none on a locked Build, none during an admin's view.
- The tips are keyed by the data, so the action a tip suggests ends it: importing ends the
  Import tips, a run ends "not run", accepting the readers ends "pending", an intro ends the
  intro tip, publishing ends the draft tip. Dismiss ends a tip for good (E15-1).
- Import: no list yet (import.empty); a list uploaded or pasted and not imported
  (import.mapping); the same after ten minutes (rescue.mapping, "Map the columns" goes to the
  mapping card). The story's "no mapping saved" is read as "not imported": a mapping is guessed
  as soon as the preview has columns, so "saved" cannot be told apart. An upload with no
  columns read has no mapping and shows its own error, so no tip.
- Shape: a refusal or a failure after the last run that applied (rescue.shapeFailed, "Try
  again" goes to the run button); not run yet; reader versions waiting. A refused run leaves
  no ai_run row (the budget, the plan and the pause stop before the call), so shaping now
  writes a shape_failed product event with the reason and the project (E13-1's catalogue,
  docs/analytics.md); the tip compares the newest event's time with the later of the set's
  imported_at and shaped_at, so a failure on a list before a re-import is not shown. "Try
  again" shows only for failed, invalid and rate limited; a budget, plan or pause refusal
  keeps its banner and the card says move on to Build.
- Build: the intro empty; the fields still Name and Role as text.
- Share: the link in draft; open for three days or more (from the publish, or the open date
  when later) with no response at all; a withdrawn, closed or not yet open link shows none
  (rescue.noResponse, "Send invites" goes to the personal invites card).
- The sample walkthrough on the sample's Results: the strip and agreement table (the
  Agreement tab), the Different priority and Disagree register (its tab), an item's detail.
  Each card's Next opens the next screen; the third says Start a project. Dismissing any of the
  three ends the walkthrough. The cards are keyed to the screen, so one opened by the tabs
  shows the same line.
- Times are the rows' and the events', compared on the server with the request's time.

## Why

Design note 39: one hint at a time, at the moment it is needed, true to the data.
