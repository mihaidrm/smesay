# Design note 85: the admin shell and the audit log, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E14-1, under decision 0044.

## What was decided

- The admin area gets the PM app's sidebar: the lockup, an "Admin" line, the nav items
  (NavLink, design note 34), "Back to the app" and the signed-in email at the bottom. No
  workspace chip and no project list: the admin area belongs to no workspace. Each nav item
  arrives with its page (Overview and Audit log now, Workspaces with E14-2, People with E14-3),
  so the nav never links to a page that does not exist.
- The admin check runs in the layout and again in every page and action. A unit test reads
  every page, layout, route and server action file under src/app/admin/ and fails when one
  does not call requireAdmin(); the e2e walks the list of admin addresses (e2e/admin-routes.ts)
  signed out and as another email and expects 404 on each.
- One transaction for an action and its row. The product's helpers know nothing of the admin
  area, so the database client keeps the open transaction in AsyncLocalStorage
  (nodejs.org/api/async_context.html) and every use of db inside goes to it; a helper's own
  db.transaction() becomes a savepoint. The row is written after the action, so a refused row
  (the action check, the target check) rolls the action back, and a failed action writes no
  row.
- admin_audit has no foreign keys: the target workspace or person and the admin are plain
  columns, so a row outlives what it names and the log shows "deleted" instead of losing the
  line. A check keeps the action inside the catalogue of twelve and requires a target.
- The audit page reads its filters and page from the address (?workspace=, ?admin=, ?page=), a
  GET form with two native selects and a Show button, so it works before any script loads and
  a filtered view can be linked. New to the design system: the native select in the PM app,
  with the respondent fields' radius and border. 50 rows a page, Newer and Older.
- "What changed" prints the row's changes as key: value pairs, in a mono line.

## Why

Story E14-1 asks for one admin area, one rule for who sees it, and a record of every admin
action that cannot be skipped. A record written outside the action's transaction could be lost
on a crash after the action, or written for an action that failed.

## Rejected

- Passing a transaction handle through every product helper: it would change dozens of
  signatures for the admin area's sake, and E14-2 asks that admins use the helpers unchanged.
- Writing the row first and the action second, on separate connections: a failed action would
  leave a row for something that did not happen.
