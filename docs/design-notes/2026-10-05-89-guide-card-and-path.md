# Design note 89: the guide card, the Show tips switch and the first-project path, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E15-1 and E15-2, under
decision 0044. Builds on design note 39.

## What was decided

- The guide card (new to the design system): the Banner's soft violet gradient, the robot at
  88 px on the left in the tip's pose, the line at 15 px, then one primary action (small
  button), an optional secondary one and Dismiss as a tertiary text button. Section with the
  name "Tip". Nothing moves. The server renders it only when the tip is visible for the person,
  so a dismissed tip never flashes; Dismiss hides it at once and stores the dismissal.
- The lines live in src/lib/guide-lines.ts, typed by id; a unit test reads docs/copy/guide.md
  and fails when an id, a pose, a line or an action differs, or a line passes 140 characters.
  The analytics catalogue's GUIDE_TIPS is the same list.
- The state is the person's (user.guide_state), for every workspace. A dismissal is added once
  in one statement, so two tabs cannot lose one.
- Show tips sits above the mode toggle with the toggle's look and accessible name pattern; it
  flips at once and the server keeps it. It is disabled during an admin's view.
- The first-project path is one guide card on Projects above the table: the title, four step
  pills (a violet tick when done, the next one outlined), the line of the next step and its
  "Go to" button; "Then: read the results" under the steps. With no project yet: "Start a
  project" and, while the sample is there, "Try it on the sample first". The steps link to the
  newest project of the workspace's own (not the sample, not archived).
- Ticks from the data: Import when the project has a set; Shape when the newest set was shaped
  (shape_runs or shaped_at), or it came with areas and the person has gone on to Build (an
  instrument exists: the story's "has opened Shape" is not recorded anywhere, and Build comes
  after it); Build when the instrument has an intro and fields other than the two defaults;
  Share when an invite_sent event names the project (the publish and every personal invite
  write one; it now carries the project). An imported project file keeps its instruments'
  publish dates but writes no event, so it does not count.
- The card goes for good once a link is published or an invite sent in the workspace: "Your
  link is live" shows to the person who published for 24 hours after the first one, then never
  again; a member who joins a workspace with a link out never sees the path. Dismissing any of
  the path's lines hides the whole card, since its line changes from step to step. During an
  admin's view (E14-4) the path is not shown.
- Dismiss moves the focus to the page's title; a Dismiss or a switch that fails to store
  comes back with "That was not saved. Check the connection and try again." under it.
- The rescue tips' "help" pose was not placed when this note was written; the "idea" robot
  stood in. Since 2026-10-05 it is the pack's "Medical Bot" (docs/assets.md, design note 37).

## Why

Design note 39: one hint at a time, at the moment it is needed, true to the data, with an off
switch.

## Rejected

- Reading docs/copy/guide.md at run time: the deployed app need not carry docs/, and a typed
  list lets the compiler check every id the code uses.
