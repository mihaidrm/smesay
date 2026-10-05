# Design note 91: measuring the guide, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E15-5, under decision 0044.

## What was decided

- guide_shown is written when a card is drawn for the person (the path on Projects, a step or
  rescue tip, a sample walkthrough card), at most once a day (UTC) per tip and person, by one
  conditional insert; two loads at the same moment can still add two. It carries whether the
  card was drawn with an action. guide_dismissed is written with the dismissal, guide_acted
  when the card's action (or the start's "Try it on the sample first") is pressed, the link
  going on at once; both are also once a day per tip and person, so three presses on three
  visits count once and a loop of calls writes one row a day. Nothing is written during an
  admin's view: no card is drawn there (e2e/admin-view-as.spec.ts checks the table).
- The Overview gains two tables under the funnel. "First project, per sign-up week": of the
  people who signed up that week, how many have a project of their own with a list, shaped,
  built and shared, and the median hours from sign-up to the first invite_sent for one of
  their projects (sent by anyone in its workspace, as E15-2 ticks Share); every count
  carries its share of the week's sign-ups. The steps are E15-2's rule, counted over any of the
  person's projects rather than only the newest, since a person can start over. Under it, the
  Userpilot 2025 figures with the source named. "Guide, last 30 days": per tip, shown,
  dismissed, acted on and acted on of shown, and "to review".
- "To review": a tip drawn with an action when dismissed more often than acted on (E15-4
  acceptance 3); a tip never drawn with an action (most step tips: the page's own button is
  the action; the Shape rescue after a refusal) when more than half of its shows were
  dismissed, since it can never be "acted on". A tip drawn both ways in the 30 days is judged
  as one with an action. Deleted workspaces are left out, as in the funnel.
- Every count is SQL. Each query read 10,000 events in about 20 ms in the test.
- The R1 baseline is not a number yet: the first ten real sign-ups set it, recorded in
  docs/plan-steps.md when Mihai accepts the story.

## Why

Design note 39: every tip is a candidate for Clippy's fate; the numbers decide which stay.
