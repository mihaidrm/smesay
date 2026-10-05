# E14-4 View a workspace as its owner sees it, read-only

User: Mihai, looking at the exact screen a PM describes
Status: built
Outcome: an admin can open any workspace's pages as the owner sees them, change nothing,
and leave a trace.

## Acceptance criteria
1. "View as" on a workspace's admin page (E14-2) opens the PM app for that workspace in the
   admin's own session: the project list, each project's steps, settings and results, exactly
   as an owner sees them.
2. Every write is refused while viewing: every server action checks the view-as flag and
   answers with "You are viewing as [WORKSPACE]. Changes are off." (docs/copy/errors.md); the
   buttons are shown but disabled at 40 percent, so the admin sees what exists.
3. A banner across the top of every page names the workspace and has "Stop viewing"; the
   view ends after 60 minutes on its own.
4. Starting and stopping a view writes an audit row (E14-1). Respondent names and answers are
   visible in this mode because the owner sees them; this is why the audit row exists and why
   the admin area has no other way to them.
5. Tests: a write during a view is refused and nothing changes; the view expires; the audit
   rows exist. Playwright: start a view, see the banner and a disabled Save, stop the view.

## Out of scope
- Acting on the PM's behalf: never. If a PM needs a change made, E14-2's actions are the list
  of what an admin can do.

## Open questions
- None.

## Technical notes
The view-as state lives on the admin's session row (a target workspace id and an expiry),
set only by the admin action and read by requireCurrentWorkspace, which then serves the
target workspace and marks the request read-only; the server actions read the mark through
one helper. Written 2026-10-02 (decision 0035).
