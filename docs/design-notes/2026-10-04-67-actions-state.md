# Design note 67: Mark done, Dismiss and Reopen, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E9-2, under decision 0044.
The PM app board's Actions tab (Mark done, Dismiss, the closed state) is the starting point.

## What was decided

- Open actions first ("No open actions. Write again to look for new ones, or reopen one
  below." when none), then a Done section and a Dismissed section, each with its count. Closed
  actions sit on the ground colour with the title muted (not faded, so the text keeps 4.5:1)
  and carry "Done [DATE AND TIME] UTC" or "Dismissed [DATE AND TIME] UTC" in a pill and
  Reopen. The board's "Undo" is "Reopen" (the story's word; it can be pressed days later).
- Every control is secondary: Write actions is the screen's one primary
  (docs/design-system.md); the board's dark Mark done follows. The pressed button shows the
  spinner while it posts.
- A change names the state the page showed; an action no longer in it (another tab or
  member, a new run) is refused with a line to reload. The change takes the project row's
  lock, as a run does.
- closed_at and closed_by (the user, set null if the user is deleted); a check keeps closed_at
  null exactly while the action is open. Rows closed before the column get their creation date.
- A new run never writes an action that matches a done or dismissed one: same kind, same cited
  answers and same cited missing items, in any order. The story's acceptance names dismissed
  ones, the answers and the kind; its Outcome says both stay across runs, so done ones are
  kept out too. The missing items are added so that two coverage actions on two different
  missing items, which cite no answer, are not taken for the same.
- Each button is its own form with the state in a hidden field.

## Checks

- src/lib/insights.test.ts (setActionState, the match, the dismissed one kept out).
- e2e/actions.spec.ts.
