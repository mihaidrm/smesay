# Design note 83: the admin Overview, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E13-2, under decision 0044.

## What was decided

- /admin sits outside the PM app's shell: no workspace, no sidebar, the same tokens and
  cards. E14-1 adds the admin shell around it.
- The access check runs before the page sends anything, so a non-admin gets a real 404
  status, not a loading state followed by the not-found page. The counts stream in behind a
  one-line loading state once the check has passed. A failed query shows the app's 500 page.
- Every number leaves the sample projects out (as usage() does since E2-6) and every
  deleted workspace, so the page counts customers' work only. Last activity is the newest
  event of the workspace (E13-1), else its creation.
- Each admin read takes an AdminProof that only requireAdmin() gives out, so a route under
  src/app/admin/ that forgot the check does not compile. The page has no title of its own:
  Next keeps the main render's metadata in the 404 it sends to anyone else (the audit found
  "Admin · SMEsay" there), so the page uses the app's title.
- The workspace table's usage comes from usageByWorkspace(), three grouped queries on the same
  conditions as usage(); a test checks the two agree for every workspace. One query per
  workspace would queue thousands of queries on the pool the respondents' saves use.
- The paid-plan metric (decision 0008) is "workspaces with a response submitted this month":
  a workspace that ran a validation to the end is the value the paid plans sell. The
  threshold stays null, and the page says paid plans stay off, until Mihai sets it in
  src/lib/plans.ts. The metric is a key of PLAN_METRICS, each computed from the workspace
  rows, so changing it changes the number with the label; reaching the threshold says so.
- The funnel leaves out the events of deleted workspaces, like the other numbers.
- src/db/queries/admin.ts is the one cross-workspace module; the lint rule allows it only
  under src/app/admin/ and in the database tests.
- Funnel shares are each step over the step before in the same week; a step whose previous
  count is 0 shows no share.

## Why

The page answers one question for Mihai: is anyone getting from sign-up to a submitted
response, and how many workspaces would a paid plan apply to.
