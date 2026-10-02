# E13-2 Admin page for Mihai: funnel and usage per workspace

User: Mihai, deciding when paid plans switch on (decision 0008)
Status: ready
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
the admin check and never imported by the app's own pages (lint rule as in E1-3).
