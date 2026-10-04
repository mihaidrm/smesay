# Design note 67: Mark done, Dismiss and Reopen, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E9-2, under decision 0044.
The PM app board's Actions tab (Mark done, Dismiss, the closed state) is the starting point.

## What was decided

- Open actions first, then a Done section and a Dismissed section, each with its count;
  closed actions are greyed and carry "Done [DATE] UTC" or "Dismissed [DATE] UTC" in a pill
  and Reopen. The board's "Undo" is "Reopen" (the story's word; it can be pressed days later).
- Mark done is the primary button, as on the board; Dismiss and Reopen are secondary.
- closed_at and closed_by (the user, set null if the user is deleted); a check keeps closed_at
  null exactly while the action is open. Rows closed before the column get their creation date.
- A new run never writes an action that matches a dismissed one: same kind, same cited answers
  and same cited missing items, in any order. The story names the answers and the kind; the
  missing items are added so that two coverage actions on two different missing items, which
  cite no answer, are not taken for the same. A done action can come back as a new open one:
  the story protects only dismissed ones.
- Each button is its own form with the state in a hidden field.

## Checks

- src/lib/insights.test.ts (setActionState, the match, the dismissed one kept out).
- e2e/actions.spec.ts.
