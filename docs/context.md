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
- Schema v1 (stories/E1-2): 12 application tables plus 4 better-auth tables, two migrations in
  drizzle/, docs/schema.md generated from them by scripts/schema-doc.mjs (the pre-commit hook
  fails when it is stale). The database tests run against `smesay_test`, never the dev database.

Machine check on 2026-10-01 (Mihai's Windows PC, decision 0005): Node v26.10.0, Docker 29.8.1
running; docker compose up, lint, test and build pass there (step 2.5). The Claude Code cloud
container has Node v22.22.0 and no Docker daemon.

Read in this order: CLAUDE.md, docs/plan-steps.md, docs/decisions/*, docs/design-notes/*, docs/schema.md,
stories/backlog.md, docs/business-plan.pdf (pages 9 to 15 hold the acceptance criteria).

Waiting on Mihai:
1. Partial responses: do unsubmitted answers reach the PM, and how are they marked? And may a
   closed public link show any per-device state? (reviewer findings 26 and 33, note 12.)
2. Colour: whether the PM app and marketing move primary actions and selection to teal, or stay
   ink (raised 2026-10-01; recommendation in the session log).
3. Click-through of the respondent boards (chapters, note 12) and the PM app (projects,
   settings, sample, item detail, export, preview panel) on phone and laptop, and of
   /styleguide in the running app (note 14).
4. Preview panel: keep the desktop preview at 42 percent, or reflow it to one readable column
   (decision 0021, open item).
The trademark search waits for the launch gate (decisions 0012, 0014).

Next tasks for Claude, in order (decision 0013, design first), then Phase 2: scaffold,
styleguide page, E1 stories, open questions before E1.

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
- 2.4 E1 stories: done.
- 2.5 PC setup: done.
Phase 3, R1 build, twelve epics in order (about 39 sessions, 19 weeks, to about early March 2027): Done 0 of 12 steps. Left: 12 steps
- E1 Foundation: building.
- E2 Accounts: open.
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
<!-- /sync:phases -->

Do not: read or reference any client engagement material; create accounts; commit secrets;
decide scope.
