# E13-2 Admin page for Mihai: funnel and usage per workspace

User: Mihai, deciding when paid plans switch on (decision 0008)
Status: built
Outcome: one page, visible only to Mihai, with the sign-up to submission funnel per week and
the usage of every workspace.

## Acceptance criteria
1. /admin is served only to the emails in ADMIN_EMAILS (comma separated); anyone else gets
   404, not 403, so the page's existence is not leaked. Missing variable: the page does not
   exist.
2. Funnel per ISO week for the last 12 weeks, from the event table (E13-1): sign-ups,
   workspaces created, projects created, imports committed, instruments published, invites
   sent, links opened, responses started, responses submitted, exports downloaded; each as a
   count and as a share of the step before. Computed in SQL (CLAUDE.md, dashboard rules).
3. Workspaces table: name, created, members, projects, instruments published, responses this
   month, AI cost this month in euro cents, last activity; sorted by last activity; the usage
   numbers are E2-6's functions so the plan metric and this page cannot disagree.
4. Totals at the top: workspaces, projects, published instruments, submitted responses, all
   time; and the usage metric Mihai picks for the paid-plan threshold (decision 0008) with
   its current value, read from one place in src/lib/plans.ts.
5. No personal data beyond workspace names and member counts; no respondent names anywhere
   on the page.
6. Playwright: an admin email sees the page; another email gets 404.

## Out of scope
- Charts beyond the funnel table: a bar per week is enough in R1.
- Alerts or a weekly email: not in R1.

## Open questions
- None.

## Technical notes
Queries in src/db/queries/admin.ts, the one place that reads across workspaces, guarded by
the admin check and never imported by the app's own pages (lint rule as in E1-3). This page
is the Overview of the admin shell E14-1 builds (decision 0035); the access rule and the
module are shared.

Built 2026-10-05 (design note 83, decision 0044):
- Acceptance 1: src/lib/admin.ts requireAdmin() before anything is sent, so anyone not in
  ADMIN_EMAILS (and everyone when it is empty) gets the 404 status and page; the counts then
  stream in behind a loading line (src/app/admin/page.tsx).
- Acceptance 2: src/db/queries/admin.ts funnel(): 12 ISO weeks (Monday, UTC) of the ten
  steps, counted per week and step in SQL; the page shows each count and its share of the
  step before.
- Acceptance 3: workspaceUsage(): name, created, members, projects, published instruments,
  responses this month, AI cost this month, last activity (the newest event, else created),
  by last activity; projects, responses and AI cost are usage() (src/db/queries/usage.ts,
  E2-6). Deleted workspaces are left out.
- Acceptance 4: totals() (all time, the sample projects left out) and the paid-plan metric
  PAID_PLAN_SWITCH in src/lib/plans.ts: workspaces with a response submitted this month,
  Claude's recommendation; the threshold is null until Mihai sets it (docs/review-list.md).
- Acceptance 5: workspace names and counts only.
- Acceptance 6: e2e/admin.spec.ts (signed out and another email: 404; the admin email: the
  page); unit tests in src/db/queries/admin.test.ts. The lint rule refuses
  src/db/queries/admin.ts outside src/app/admin/ (src/db/queries/lint-rule.test.ts).
