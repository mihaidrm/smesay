# Plan: every step from here to launch

Written 2026-10-01 from docs/business-plan.pdf (roadmap, pages 8 and 9) and the state of the
folder. Each step names who does it. Claude updates this file when a step is done or changes.

Cadence: two sessions a week, two to three hours each. A session runs as README.md describes:
Mihai names the scope, Claude lists questions, builds, the reviewer audits, Mihai clicks through
and accepts or rejects. Dates are estimates at that cadence and will slip; a missed gate means the
next phase waits.

## Phase 0. Decisions waiting on Mihai (this week)

| # | Decision | Where it is written up |
|---|---|---|
| 0.1 | Name: SMEsay chosen 2026-10-01, trademark search pending | docs/decisions/0005 |
| 0.2 | Logo: wordmark D with mark B, chosen 2026-10-01 | docs/decisions/0005 |
| 0.3 | Landing page: E chosen (B layout, D story, outputs gallery), 2026-10-01 | docs/decisions/0008 |
| 0.4 | Headline: "Send the list as a link. Get back who agrees, and why." Confirmed 2026-10-01 | docs/decisions/0009 |
| 0.5 | Example: the expense tool, confirmed 2026-10-01 | docs/decisions/0005, 0009 |
| 0.6 | Respondent answer model and the other prototype choices in note 03, accepted 2026-10-01 | docs/decisions/0009 |
| 0.7 | Vercel: moot until the launch gate (decision 0006) | docs/accounts.md |
| 0.8 | Retired agent files deleted 2026-10-01 | docs/decisions/0009 |
| 0.9 | Order of the next sessions: design first, decided 2026-10-01 | docs/decisions/0013 |

Machine check 2026-10-01: Node v26.10.0 and Docker 29.8.1 running. Nothing to install. The
repository is on Mihai's personal GitHub (mihaidrm/smesay), so step 2.1 is done.

Decision 0006 (2026-10-01): everything stays local and on personal accounts until the product
is validated. Deploy, domain, email sending and company accounts move to the launch gate.

## Phase 1. Design (now to about 17 October)

Status column: done, drafted (Claude's part is finished, Mihai has not approved), open, mihai.
`node scripts/sync-status.mjs --write` copies this table's status to the Roadmap board and
docs/context.md; the pre-commit hook fails when they differ (decision 0022).

| # | Step | Who | Done when | Status |
|---|---|---|---|---|
| 1.1 | Landing page E: use-cases section, four answers, phone board. Built 2026-10-01 | Claude | Mihai clicks through on laptop and phone and accepts | done |
| 1.2 | Respondent prototype: four answers, closed, revoked, personal link, rate-blind, three layouts, phone and desktop boards. Built 2026-10-01 (note 11), rebuilt around chapters and the rating row the same day (decisions 0016, 0018, note 12) | Claude | Accepted on a phone | done |
| 1.3 | PM prototype: settings, members, project list, sample watermark, item detail, export tab, project context box, preview panel on every builder step. Built 2026-10-01, desktop only (decisions 0020, 0021, note 13) | Claude | Accepted on a laptop | done |
| 1.4 | Design system: docs/design-system.md and six brand boards on the canvas, written 2026-10-01 (notes 09, 10) | Claude | Mihai approves | done |
| 1.5 | Copy: landing, quickstart, transactional emails, error messages. Drafted 2026-10-01 in docs/copy/, scan passes (scripts/scan-copy.mjs) | Claude | Passes the WRITING.md scan; Mihai approves | drafted |
| 1.6 | Golden set: ten messy requirement lists from invented domains, with expected areas, item counts and must-not-invent lists. Written 2026-10-01 in evals/ (specs, expected JSON, generator); rows as imported and the runner added 2026-10-03 (decision 0037, E4-6) | Claude | Ten files in evals/, Mihai reads two | drafted |
| 1.7 | Trademark check: Mihai runs it on the chosen name when ready; the domain waits for the launch gate (0006) | Mihai | Name in docs/context.md | mihai |

Gate: the prototype and the design system are accepted, the name and domain exist.

## Phase 2. Setup for building (about 1 week)

| # | Step | Who | Done when | Status |
|---|---|---|---|---|
| 2.1 | Repository: git init, first commit, push to GitHub. Done 2026-10-01 | Claude | Repository on GitHub | done |
| 2.2 | Scaffold: Next.js 16 (decision 0024), TypeScript, Tailwind, shadcn/ui, Drizzle, better-auth, Vitest, Playwright, the copy scan script, Docker Compose with Postgres and an S3-compatible store (RustFS, decision 0025), CI. Built 2026-10-01 (docs/setup.md), CI green; docker compose up, lint, test and build passed on Mihai's PC the same day | Claude | lint, typecheck, tests and build pass; CI green | done |
| 2.3 | Styleguide page: /styleguide in the app, from docs/design-system.md. Built 2026-10-01 (note 14), Mihai: works | Claude | Mihai approves | done |
| 2.4 | Stories: E1 written 2026-10-01 (stories/E1-1 to E1-5), questions answered (decision 0027); every other R1 story written the same day, 64 in all (decision 0029) | Claude | Stories have acceptance criteria | done |
| 2.5 | PC setup: Node 26 and Docker running, docker compose up, lint, test, build. Done 2026-10-01; the E1 questions move to 2.4 | Mihai | docs/setup.md checks pass on the PC | done |

Gate: `npm run lint` and `npm test` pass on the empty app, CI runs on every push.

## Phase 3. R1 build, fifteen epics in order (planned as about 47 sessions over 24 weeks, to about mid April 2027; built 2 to 5 October 2026)

Each epic: stories written, Mihai answers questions, Claude builds story by story, the reviewer
audits, Mihai accepts each story with a note. Estimates are sessions at two per week.

| Epic | What ships | Mihai sets up first | Sessions | Status |
|---|---|---|---|---|
| E1 Foundation | Repo, CI, schema v1, migrations, local Docker with Postgres and RustFS, seed; deploy moved to the launch gate. E1-1 to E1-4 built 2026-10-01 and 2026-10-02, E1-5 deferred (decision 0006); Mihai's acceptance notes per story still owed | none | 2 | done |
| E2 Accounts | Magic link (local mailbox), Google sign-in (Microsoft and Apple after launch, decision 0034); workspaces, members, roles, settings. E2-1 to E2-6 built 2026-10-02; Mihai checks the real Google flow on his PC and accepts each story | Free personal Google developer account (step 6, done 2026-10-02) | 4 | done |
| E3 Import | xlsx and csv upload, header detection, mapping, versioning, validation report. E3-1 to E3-6 built and audited 2026-10-02 (PRs 29 to 33); seven decisions open for Mihai (docs/context.md); E3-7 (the Sheets step for a workbook with several tabs, Mihai's message of 2026-10-07, design note 111) built 2026-10-07; Mihai's acceptance note for E3-7 still owed | none (RustFS in Docker) | 3 | done |
| E4 AI shaping | Server route with budget, areas and order, reader versions, flags, golden set runner in CI. E4-1 to E4-6 built 2026-10-02 and 2026-10-03 (PRs 40 to 44 and 49); Mihai's acceptance notes per story still owed | Anthropic Console on Gmail, a few euros (step 9) | 4 | done |
| E5 Instrument builder | Intro, fields, scoring methods, layouts, perspectives, closing questions, live preview panel on every step (decision 0021). E5-1 to E5-5 built 2026-10-03; E5-6 built 2026-10-04 after E8, before E9-1 (decision 0045, docs/review-list.md); E5-9 (the unsaved changes guard on Import, Build and Share, Mihai 2026-10-07) built 2026-10-07 (design note 112) | none | 4 | done |
| E6 Sharing | Public link, dates, passcode, personal invites, reminders, kill switch. E6-1 to E6-3 built 2026-10-03, E6-4 built 2026-10-04 (PRs 78, 81, 82 and the E6-4 PR); Mihai's acceptance notes per story still owed | none | 3 | done |
| E7 Respondent | Landing, fields, items, reasons, autosave, resume, missing items, summary, sign-off, accessibility. E7-1 to E7-7 built 2026-10-04 (PRs 84, 88, 90 to 94), the screens as built on the canvas (note 59); Mihai's acceptance notes per story still owed | none | 5 | done |
| E8 Dashboard | Tracker, agreement, registers, item detail, conflict view, live updates, sample project. E8-1 to E8-8 built 2026-10-04; Mihai's acceptance notes per story still owed | none | 5 | done |
| E9 Insights | Actions with citations, done or dismissed, cost per run. E9-1 to E9-3 built 2026-10-04; open until a real run: E9-3 acceptance 3 (the estimate against the actual); Mihai's acceptance notes per story still owed | none | 2 | done |
| E10 Exports | CSV, JSON, PDF summary. E10-1 to E10-3 built 2026-10-04; launch gate: Chromium on the host for the PDF, the export memory at the plan caps; the PDF's registers stop at 20 rows (decision 0048, 2026-10-05); Mihai's acceptance notes per story still owed | none | 2 | done |
| E11 Trust | Rate limits, export and deletion, legal page drafts, backup and restore script, Sentry wired off and the security headers, error pages; Sentry's DSN and the lawyer at the launch gate. E11-1 to E11-6 built 2026-10-04 and 2026-10-05 (PRs 111 to 115 and the E11-6 PR), E11-7 (the 404 page, decision 0050) built 2026-10-05; the restore on Mihai's PC done 2026-10-05 (E11-4 acceptance 3); the lawyer approved version 2 and version 3 carries no check markers (2026-10-07, decision 0059); open: the company details on the legal pages (three markers), the launch gate's cron lines, backup bucket and Sentry test event; Mihai's acceptance notes per story still owed | none until launch | 2 | done |
| E12 Landing and onboarding | The story page as real code, quickstart, transactional emails tested in Gmail, Outlook and Apple Mail by Mihai, a question bubble on the landing page that emails Mihai (E12-5, decision 0046). E12-1 built (PR 60), E12-2 to E12-4 built 2026-10-05 (PRs 118, 119 and 120); E12-5 built 2026-10-05 (decision 0049); open: E12-2's timed run and E12-3's checks in three mail clients are Mihai's | none | 3 | open |
| E13 Analytics for us | Event catalogue and log, admin page with funnel and usage per workspace, Plausible on the landing page and the PM app (decision 0030). E13-1 to E13-3 built 2026-10-05 (PR 121 and the E13-2 and E13-3 PRs); open: Plausible's variables and goals at the launch gate (step 11), the paid-plan threshold; Mihai's acceptance notes per story still owed | Plausible at the launch gate (step 11); ADMIN_EMAILS in .env.local | 2 | done |
| E14 Admin and support | Admin shell and audit log, workspaces with their settings and the support actions, people and their sign-in, read-only view of a workspace (decision 0035). E14-1 to E14-4 built 2026-10-05 (PRs 124 to 127); open: your ADMIN_EMAILS in .env.local; Mihai's acceptance notes per story still owed | ADMIN_EMAILS in .env.local | 3 | done |
| E15 Onboarding and tutorial | The robot as the guide: the guide card and its off switch, the first-project path ticked from the data, one tip per step page and the sample walkthrough, rescue tips, the measurement on the admin page (design note 39; after E8 and E13, before the launch gate) E15-1 to E15-5 built 2026-10-05 (PRs 128 to 130); open: the "help" pose to place (docs/assets.md), the baseline from the first ten real sign-ups; Mihai's acceptance notes per story still owed. | none | 3 | done |

Launch gate: Mihai decides the product is worth a domain. Then: name, domain, personal Vercel
and Neon, Resend, Sentry, Plausible, the company details on the legal pages (with COMPANY_ADDRESS set for the
emails' footer, E12-3), deploy. After that, one organisation
Mihai does not work for runs a real validation.

## Phase 4. First users (about 6 weeks)

| # | Step | Who |
|---|---|---|
| 4.1 | No new features. Fix what hurt, in the order users said it | Claude, Mihai decides the order |
| 4.2 | Rewrite the landing page from what respondents and PMs said | Claude |
| 4.3 | Offline export as a lead magnet; first content pieces; LinkedIn and PM communities | Claude drafts, Mihai posts |
| 4.4 | Buy a designed logo mark if the name sticks (docs/brand-assets.md) | Mihai |
| 4.5 | Move Vercel to Pro before the first paying customer | Mihai |

Gate: one real user by week 12 of the build, as the plan requires; the first paying customer
within six months of launch is the business target.

## Phase 5. R2 loop

Jira and Notion import and write-back, set versioning with diffs between rounds, respondent
questions answered from the source, live workshop mode, team roles. Mihai creates the Atlassian
and Notion developer apps (accounts.md step 13). Product Hunt launch.

## Phase 6. R3 revenue

Stripe with Stripe Tax and the plans, single-tenant hosting, the Docker self-host package with
bring-your-own AI key, SSO, audit log, DPA flow. Partner programme for consultancies.

Auto translation (decision 0055): respondents answer the instrument in their own language. The
AI translates the items, the help lines and the closing question, either on the fly or once per
language when the PM publishes. Their free text (reasons, questions, comments, missing items)
reaches the dashboard translated into the PM's language, with the original kept beside it. It
calls the model on every respondent's text, so its cost is a spend decision for Mihai (decision
0039) and it belongs with the paid plans.

## What Claude does in every session, without being asked

Record decisions in docs/decisions/ the same day. Write a dated design note for design work.
Keep docs/context.md current so the next session starts in the right place. Report numbers,
file paths and commands.
