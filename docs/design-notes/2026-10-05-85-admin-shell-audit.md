# Design note 85: the admin shell and the audit log, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E14-1, under decision 0044.

## What was decided

- The admin area gets the PM app's sidebar: the lockup, an "Admin" line, the nav items
  (NavLink, design note 34), "Back to the app" and the signed-in email at the bottom. No
  workspace chip and no project list: the admin area belongs to no workspace. Each nav item
  arrives with its page (Overview and Audit log now, Workspaces with E14-2, People with E14-3),
  so the nav never links to a page that does not exist; the story's acceptance 2 says so.
- The admin check runs in the layout, so the sidebar never reaches anyone else, and again in
  every page and action: a layout does not run again on client navigation (Next's
  authentication guide, node_modules/next/dist/docs/01-app/02-guides/authentication.md), so it
  guards nothing alone. A unit test reads every page, layout, route and server action file under
  src/app/admin/ (comments left out) and fails when one does not call requireAdmin(); the e2e
  walks the list of admin addresses (e2e/admin-routes.ts) signed out and as another email and
  expects 404 on each. requireAdmin() is cached per request, so the layout and the page read the
  session once.
- The audit row is written before the action, by the admin the session names (the proof
  carries the user id), and the action runs only when the row is in; afterwards the row gets
  its outcome: done, refused (the product's helper returned { error }) or failed (it threw). A
  row without an outcome is an action whose end was not recorded. This replaces the story's
  first wording, one transaction around the action and its row: see Rejected.
- A row's changes take ids and fixed values: at most 12 keys and strings of at most 80
  characters, so free text (a note, a respondent's words) cannot be put in one by mistake.
- admin_audit has no foreign keys: the target workspace or person and the admin are plain
  columns, so a row outlives what it names and the log shows "deleted" instead of losing the
  line; a workspace marked deleted and waiting for removal shows its name with "(deleted,
  removal pending)". The privacy policy now says the ids stay, with a lawyer marker.
- The audit page reads its filters and page from the address (?workspace=, ?admin=, ?page=), a
  GET form with two native selects and a Show button, so it works before any script loads and
  a filtered view can be linked. New to the design system: the native select in the PM app,
  with the respondent fields' radius and border. 50 rows a page, Newer and Older; a page past
  the end shows the last one. A workspace or admin removed since stays in the filter as
  "deleted (" and the start of its id ")".
- "What changed" prints the row's changes as key: value pairs by key in alphabetical order
  (jsonb does not keep the order written), in a mono line; "Outcome" says
  Done, Refused, Failed or Not recorded.

## Why

Story E14-1 asks for one admin area, one rule for who sees it, and a record of every admin
action that cannot be skipped.

## Rejected

- One transaction around the action and its row, with the product's helpers routed into it
  through the database client (the first build of this story). The fresh-context review found
  three faults: an email the action sent cannot be taken back when the row then fails, so the
  action happened without its row anyway; a helper that catches a database error and goes on
  (track(), the slug retry) leaves the transaction aborted and fails the whole action; and the
  routing changed the client every query in the product goes through.
- Passing a transaction handle through every product helper: it would change dozens of
  signatures for the admin area's sake, and E14-2 asks that admins use the helpers unchanged.
