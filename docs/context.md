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
  D's story and a gallery of outputs: landing page E (decision 0008), cut shorter and restyled
  as landing page F with design v2 (decision 0041, design note 33). F is built at /landing-page
  (stories/E12-1, design note 36), desktop and phone; the home page keeps its placeholder until
  Mihai moves F to /. Headline confirmed on 2026-10-01: "Send the list as a link. Get back who
  agrees, and why." (decision 0009).
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
- Perspectives (stories/E5-4, built 2026-10-03): the names on Build, the chips on Shape, the
  question on About you and visibleItems() in src/lib/perspectives.ts, which E7 and E8 read.
- Scoring and layout (stories/E5-2 and E5-3, built 2026-10-03): the method, the proposal
  switch, the labels and the layout on Build, the first three locked once published; src/lib/scoring.ts is the one mapping to the answer kinds,
  shared with E7-2 and E8; the respondent card and rating row components in
  src/components/respondent/ are the respondent app, which the builder's preview shows
  in an iframe (stories/E5-6).
- Build (stories/E5-1, built 2026-10-03): the instrument draft on the latest set
  (src/lib/instruments.ts), the intro and the respondent fields with the server rule
  (src/lib/respondent-fields.ts), "Build on version N" after a new import, and the About you
  page (src/components/respondent/about-you.tsx) in the preview panel; E7-1 mounts the same
  component at /r/[token]. The two questions of design note 38 (the hint under Start, Role
  as text by default) are decision 0043.
- Projects (stories/E3-1, built 2026-10-02): the list with counts and the derived status
  (src/lib/project-status.ts), New project, the project frame with the stepper
  (src/components/app/stepper.tsx), the About this project card on Import, archive, and Delete
  sample (E8-8 acceptance 3).
- Plans and usage (stories/E2-6, built 2026-10-02): src/lib/plans.ts is the one place with
  limits (free has none, decision 0008); usage() in src/db/queries/usage.ts counts by SQL;
  withinPlan() is the check E3-1, E7-5 and E4-1 call.
- Settings (stories/E2-5, built 2026-10-02): name, logo (object store through
  src/lib/storage.ts, served at /brand/[workspaceId]/logo) and accent with the contrast rule
  (src/lib/brand-rules.ts); the respondent side applies them with E7-1.
- Members (stories/E2-4, built 2026-10-02): Settings, Members with invite (a workspace_invite
  row plus E2-1's link, accepted on the invitee's first request), roles and removal; the
  permission check is can() in src/lib/permissions.ts, enforced in src/lib/members.ts.
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

Waiting on Mihai: the full review when every epic is built (decision 0044, 2026-10-03), from
docs/review-list.md, where every decision Claude took on its own is listed; the click-through
of the boards and /styleguide (notes 12 and 14) folds into it. Until then Claude builds story
by story and asks only when a step needs an account, a payment, a secret, a legal page, a
spend or a ruling between two of Mihai's decisions. Still owed by Mihai when he gets to it:
the receipt of the robot pack beside public/assets/mascot/.
Every design and story question raised up to 2026-10-02 is answered (decisions 0030, 0031).
The evals key is in the repository secrets since 2026-10-03. The trademark search waits for the launch gate
(decisions 0012, 0014).

Next tasks for Claude: E7 is complete (E7-1 to E7-7 merged 2026-10-04, PRs 84, 88 and 90
to 94, each audited with fresh context); docs/review-list.md holds every decision taken
under decision 0044 since E5-4, and the respondent screens as built are on the canvas board
"Respondent as built" (note 59) at the bottom left of the canvas, with the Roadmap and Stories boards republished the same
day. Mihai, while E7 was being built: "after you finish E7 and test it, if there are no
errors you can proceed and do E8 then pause and wait for my instructions before starting
E9". E5-6 (the preview panel on every step) is unblocked since E7-5 (decision 0045) and is
the first story after that pause, before E9-1, unless Mihai says otherwise
(docs/review-list.md). E4 is complete (E4-1 to E4-5 merged, PRs 40 to 44; E4-6 built 2026-10-03 on decisions
0037 and 0038, PR 49). Design v2 (decision 0041, note 33, boards Brand07, LandingF, PmAppV2,
RespondentV2) is in the code since 2026-10-03 (notes 34 to 37, PRs 56 to 63; Mihai: "Yeah
looks good"), and E5-1 was built on it the same day (note 38); the asset list he buys from
is docs/assets.md. The golden set's eighth run met
the bar (7 of 10, no content failure) and is recorded in story E4-6. Since decision 0039
nothing Claude runs spends money: the Evals job starts by hand only, and the smoke test and
`npm run evals` are Mihai's to run.
E4-1 is accepted: Mihai's `npm run ai:smoke` on 2026-10-03 answered in 2,744 ms for 1 euro
cent. E2-2 is accepted: the real Google sign-in worked on his PC the same day (decision 0037). The AI budget questions of design note 26 are decided (0036, 2026-10-03,
PR 46): one product cap in ANTHROPIC_MONTHLY_BUDGET_EUR, the workspace budget hidden at
EUR 10. E2 is complete; E3 is complete (E3-1 to E3-6 built and audited, PRs 29 to 33); its
seven open points were decided on 2026-10-03 (decision 0040, the defaults as built). Every story exists (76 in 15 epics; E15 Onboarding written 2026-10-03, design note 39, four questions for Mihai there; E8-1 to E8-4 and E10-1 amended the same day for views, filters, tiles and the kind names, design note 40, four questions there); a story is rewritten when Mihai
sends a direction. The Anthropic key is in Mihai's .env.local since 2026-10-02 (Console limit
EUR 10, and ANTHROPIC_MONTHLY_BUDGET_EUR must say 10 too, docs/accounts.md step 9).

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
Phase 3, R1 build, fifteen epics in order (planned as about 47 sessions over 24 weeks, to about mid April 2027; built 2 to 5 October 2026): Done 14 of 15 steps. Left: Landing and onboarding
- E1 Foundation: done.
- E2 Accounts: done.
- E3 Import: done.
- E4 AI shaping: done.
- E5 Instrument builder: done.
- E6 Sharing: done.
- E7 Respondent: done.
- E8 Dashboard: done.
- E9 Insights: done.
- E10 Exports: done.
- E11 Trust: done.
- E12 Landing and onboarding: open.
- E13 Analytics for us: done.
- E14 Admin and support: done.
- E15 Onboarding and tutorial: done.
<!-- /sync:phases -->

Do not: read or reference any client engagement material; create accounts; commit secrets;
decide scope.
