# Design note 59: the respondent as built, on the canvas, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 after E7 (stories E7-1 to E7-7 merged,
PRs 84, 88 and 90 to 94), under decision 0044.

## What was decided

- The canvas gets a board, "Respondent as built" (RespondentBuilt.dc.html), of screenshots
  of the app itself: product screens are the imagery (decision 0041), and nothing on it is
  drawn by hand. The click-through boards Respondent and RespondentDesktop stay as the
  earlier prototype; RespondentV2 stays as the design v2 proposal, with a dated line on the
  accent rule as built (note 57).
- The screens come from one personal invite on a five-item list in three areas (the expense
  tool example, decision 0008), taken with Playwright against the dev server with its badge
  hidden: on a phone at 390 px light, About you, a chapter, the Wrap up with items to finish
  and ready to submit, Done, welcome back and the changed-after-submitting notice; on a
  phone at 390 px dark, About you, a chapter and the Wrap up; on a desktop at 1440 px light,
  About you, a chapter, the Wrap up and welcome back, shown at half size.
- The PNGs are kept in docs/design-notes/prototype-01/respondent-built/; the board on the
  canvas points at the same files uploaded to the canvas (the canvas serves only its own
  uploads), so the board file here shows them only on the canvas.
- The canvas index in this folder (canvas.json) is the published one, with the v2 boards
  of 3 October and this board added; the Roadmap and Stories boards are republished from
  scripts/sync-status.mjs.

## Checks

- The capture is a Playwright script kept out of e2e/ (it is a picture, not a test); it
  ran on PR 94's last commit (6f698aa, the same tree as the merge b085000) and passed.
