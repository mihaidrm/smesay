# Context for the next Claude Code session

What: a hosted tool where a PM imports a requirement list (xlsx, csv; Jira and Notion later),
gets a readable validation instrument, sends one link, and gets back agreement, disagreement
with reasons and gaps, plus AI-written actions. Respondents need no account. Provisional name SMEsay
(decision 0005); no domain until the product is validated (decision 0006).

Who: consultancies running discovery and platform selection; in-house product and IT teams.
Owner: Alerty S.R.L. (Mihai). Built by Mihai and Claude Code.

Where we are (updated 2026-10-01): Phase 2, setup for building. The app is scaffolded and empty
(docs/setup.md); `npm run lint`, `npm test`, `npm run build` and the Playwright smoke test pass.
Done so far:
- Working setup decided (docs/decisions/0004-working-setup.md). The eight retired agent files
  were deleted on 2026-10-01 (decision 0009); reviewer.md and tester.md remain.
- Account list with steps written (docs/accounts.md). No account is created yet.
- Placeholder logo in assets/brand/. Asset shopping list in docs/brand-assets.md.
- User journey and a clickable prototype with mocked data (docs/design-notes/2026-09-30-03-prototype.md).
  Mihai accepted all eight prototype choices on 2026-10-01 (decision 0009).
- Landing pages A to D on the same canvas (design notes 04 to 08). Mihai chose B's layout with
  D's story and a gallery of outputs: landing page E (decision 0008). E is the current landing
  page. Headline confirmed on 2026-10-01: "Send the list as a link. Get back who agrees, and
  why." (decision 0009). No phone layout yet.
- Provisional name SMEsay (decision 0005), trademark search pending. Logo: wordmark D with
  mark B. Example: Marlow Group replacing its expense tool, confirmed 2026-10-01.
- Git repository on GitHub: mihaidrm/smesay, personal account (decision 0006). First commit
  2026-10-01.
- Schema v1 (stories/E1-2, accepted 2026-10-02): 12 application tables plus 4 better-auth tables, two migrations in
  drizzle/, docs/schema.md generated from them by scripts/schema-doc.mjs (the pre-commit hook
  fails when it is stale). Every test runs against `smesay_test`, never the dev database.
- Seed (stories/E1-4, built 2026-10-02): `npm run db:seed` inserts the Marlow Group sample
  workspace through the helpers; src/db/seed/sample.ts holds the facts and the expected counts.
- Sign-in (stories/E2-1, built 2026-10-02): magic link through better-auth, mail over SMTP to
  the compose Mailpit (Resend's SMTP endpoint at the gate), the signed-in shell under /app.
  src/proxy.ts sends a signed-out request under /app to the sign-in page; every page under
  /app calls requireSession() (src/lib/session.ts). Copy for the signed-in side lives in
  docs/copy/app.md.
- Workspace (stories/E2-3, built 2026-10-02): the first sign-in names a workspace and gets its
  own copy of the sample project; the current workspace is on the session row and checked
  against the memberships on every request (src/lib/current-workspace.ts); the shell under
  src/app/app/(shell) shows the switcher, the member count and the project list.
- Workspace scoping (stories/E1-3, built 2026-10-02): src/db/queries/ holds every query, each
  taking a WorkspaceId that only requireWorkspace() in src/lib/workspace.ts produces from the
  session; lint (eslint-rules/db-access.mjs) refuses the database by any import path outside
  src/db/; the cross-workspace test runs in CI.

Machine check on 2026-10-01 (Mihai's Windows PC, decision 0005): Node v26.10.0, Docker 29.8.1
running; docker compose up, lint, test and build pass there (step 2.5). The Claude Code cloud
container has Node v22.22.0 and no Docker daemon.

Read in this order: CLAUDE.md, docs/plan-steps.md, docs/decisions/*, docs/design-notes/*, docs/schema.md,
stories/backlog.md, docs/business-plan.pdf (pages 9 to 15 hold the acceptance criteria).

Waiting on Mihai:
1. Click-through of the respondent boards (chapters, note 12) and the PM app (projects,
   settings, sample, item detail, export, preview panel) on phone and laptop, and of
   /styleguide in the running app (note 14).
Every design and story question raised up to 2026-10-02 is answered (decisions 0030, 0031).
The evals key comes when E4-6 is built. The trademark search waits for the launch gate
(decisions 0012, 0014).

Next tasks for Claude: E2-4 (members and roles), then E2-5 (settings); E2-2 when the
developer accounts exist (decision 0031). Every story exists (67 in 13 epics); a story is rewritten when Mihai
sends a direction. Remind Mihai for the Anthropic key when E4-6 is built.

<!-- sync:phases -->
Status, derived from the Phase tables in docs/plan-steps.md (run `node scripts/sync-status.mjs --write` after changing a Status cell):
Phase 1, Design (now to about 17 October): Done 6 of 6 steps. 2 drafted, waits for Mihai
- 1.1 Landing page E: done.
- 1.2 Respondent prototype: done.
- 1.3 PM prototype: done.
- 1.4 Design system: done.
- 1.5 Copy: drafted, waits for Mihai's approval.
- 1.6 Golden set: drafted, waits for Mihai's approval.
- 1.7 Trademark check: Mihai, when ready.
Phase 2, Setup for building (about 1 week): Done 5 of 5 steps. Phase complete
- 2.1 Repository: done.
- 2.2 Scaffold: done.
- 2.3 Styleguide page: done.
- 2.4 Stories: done.
- 2.5 PC setup: done.
Phase 3, R1 build, thirteen epics in order (about 41 sessions, 20 weeks, to about mid March 2027): Done 0 of 13 steps. Left: 13 steps
- E1 Foundation: building.
- E2 Accounts: building.
- E3 Import: open.
- E4 AI shaping: open.
- E5 Instrument builder: open.
- E6 Sharing: open.
- E7 Respondent: open.
- E8 Dashboard: open.
- E9 Insights: open.
- E10 Exports: open.
- E11 Trust: open.
- E12 Landing and onboarding: open.
- E13 Analytics for us: open.
<!-- /sync:phases -->

Do not: read or reference any client engagement material; create accounts; commit secrets;
decide scope.
