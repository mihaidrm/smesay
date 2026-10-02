# R1 backlog: fourteen epics, in build order

E1  Foundation: repo, CI, schema v1, migrations, workspace scoping, local Docker Postgres and RustFS, seed; deploy deferred to the launch gate (decision 0006). Stories E1-1 to E1-5 written 2026-10-01.
E2  Accounts and workspaces: magic link, Google (Microsoft and Apple after launch, decision 0034); workspace on first sign-in and switcher; members, owner and member roles; settings (name, logo, accent, AI budget); plan table and usage counters (decision 0008). Stories E2-1 to E2-6.
E3  Import: project list and the project context box (decision 0020); xlsx and csv, header detection, ten-row preview; column mapping remembered per workspace; type or paste a list (decision 0010); check report and commit; set versioning and the import log. Stories E3-1 to E3-6.
E4  AI shaping: server route with budget; group into areas and order; reader version per item with original kept; duplicate and ambiguity flags; project context in the prompts (decision 0011); golden set runner in CI. Stories E4-1 to E4-6.
E5  Instrument builder: intro and respondent fields; scoring method templates with the proposed value shown or hidden; layout templates (chapters by default, one item per screen, single long page; decision 0016); perspective filter; closing (free-text question, confidence, missing-item form, sign-off text); live preview on every builder step (desktop default, phone toggle, rings what the step changes; decision 0021). Stories E5-1 to E5-6.
E6  Sharing: public link with token, open and close dates, passcode; personal invites; reminders; kill switch. Stories E6-1 to E6-4.
E7  Respondent experience: link landing and states, rating with mandatory reasons (decisions 0014, 0018), autosave and resume, navigation by chapter (decision 0016), wrap up and submit, edits after submitting, accessibility and theming. Stories E7-1 to E7-7.
E8  Dashboard: results shell, tracker, agreement per item and area, registers, item detail, conflict view, live updates, sample project. Stories E8-1 to E8-8.
E9  Insights: actions with citations, done or dismissed, cost per run. Stories E9-1 to E9-3.
E10 Exports: CSV, JSON export and import, PDF summary. Stories E10-1 to E10-3.
E11 Trust and compliance: rate limiting, export and deletion, legal pages, backups, Sentry and security headers, error pages. Stories E11-1 to E11-6.
E12 Landing and onboarding: landing page, quickstart, transactional emails, the sample instrument for visitors. Stories E12-1 to E12-4.
E13 Analytics for us: product event catalogue and log, an admin page with the funnel and usage per workspace, visitor analytics on the landing page and the PM app (decision 0030). Stories E13-1 to E13-3.
E14 Admin and support: the admin shell and its audit log, every workspace with its settings and the support actions, every person with their sign-in and sessions, a read-only view of a workspace as its owner sees it (decision 0035). Stories E14-1 to E14-4.

64 stories were written on 2026-10-01 (decision 0029), E13's three on 2026-10-02 (decision 0030) and E14's four the same day (decision 0035), from docs/business-plan.pdf pages 9 to
15, the decisions, the design notes, the prototype boards and docs/copy/. A story is rewritten
when an earlier epic changes what it depends on; Mihai sends the direction. Open questions from
the stories are listed in docs/context.md.

Candidates recorded in the stories for after R1: hand editing of a reader version (E4-3, may
move into R1), merging two items (E4-4), a skip button per item (E7-4), routing perspectives by
respondent field (E5-4), xlsx export (E10-1), a read-only results view on a phone (decision
0020).
