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
| 0.9 | Order of the next sessions: Phase 1 design first, or scaffold first. Deferred by Mihai 2026-10-01 | docs/decisions/0009 |

Machine check 2026-10-01: Node v26.10.0 and Docker 29.8.1 running. Nothing to install. The
repository is on Mihai's personal GitHub (mihaidrm/smesay), so step 2.1 is done.

Decision 0006 (2026-10-01): everything stays local and on personal accounts until the product
is validated. Deploy, domain, email sending and company accounts move to the launch gate.

## Phase 1. Design (now to about 17 October)

| # | Step | Who | Done when |
|---|---|---|---|
| 1.1 | Build the story landing page from note 07, with the five states of one list, desktop and phone | Claude | Mihai clicks through on laptop and phone and accepts |
| 1.2 | Finish the respondent prototype: closed page, revoked page, personal link resume, rate-blind mode, all three layouts | Claude | Accepted on a phone |
| 1.3 | Finish the PM prototype: workspace settings, members, project list, sample project watermark, item detail, export screen | Claude | Accepted on a laptop |
| 1.4 | Write docs/design-system.md: type, colour, spacing, components, states, motion, voice, from notes 01 to 07 | Claude | Mihai approves |
| 1.5 | Draft all copy: landing, quickstart, transactional emails, error messages | Claude | Passes the WRITING.md scan; Mihai approves |
| 1.6 | Golden set for the AI: ten messy requirement lists from invented domains, with expected areas, item counts and must-not-invent lists | Claude | Ten files in evals/, Mihai reads two |
| 1.7 | Mihai runs a trademark check on the chosen name when ready; the domain waits for the launch gate (0006) | Mihai | Name in docs/context.md |

Gate: the prototype and the design system are accepted, the name and domain exist.

## Phase 2. Setup for building (about 1 week)

| # | Step | Who |
|---|---|---|
| 2.1 | git init, first commit, push to the GitHub repository. Done 2026-10-01 | Claude |
| 2.2 | Scaffold: Next.js 15, TypeScript, Tailwind, shadcn/ui, Drizzle, better-auth, Vitest, Playwright, the copy scan script, Docker Compose with Postgres and MinIO | Claude |
| 2.3 | Styleguide page in the app from docs/design-system.md | Claude |
| 2.4 | Stories for E1 written from the plan; open questions listed | Claude |
| 2.5 | Answer the E1 questions; Node 22 and Docker running; optional personal GitHub repo | Mihai |

Gate: `npm run lint` and `npm test` pass on the empty app, CI runs on every push.

## Phase 3. R1 build, twelve epics in order (about 39 sessions, 19 weeks, to about early March 2027)

Each epic: stories written, Mihai answers questions, Claude builds story by story, the reviewer
audits, Mihai accepts each story with a note. Estimates are sessions at two per week.

| Epic | What ships | Mihai sets up first | Sessions |
|---|---|---|---|
| E1 Foundation | Repo, CI, schema v1, migrations, local Docker with Postgres and MinIO, seed; deploy moved to the launch gate | none | 2 |
| E2 Accounts | Magic link (local mailbox), Google, Microsoft sign-in; workspaces, members, roles, settings | Free personal Google and Microsoft developer accounts, optional | 4 |
| E3 Import | xlsx and csv upload, header detection, mapping, versioning, validation report | none (MinIO in Docker) | 3 |
| E4 AI shaping | Server route with budget, areas and order, reader versions, flags, golden set runner in CI | Anthropic Console on Gmail, a few euros (step 9) | 4 |
| E5 Instrument builder | Intro, fields, scoring methods, layouts, perspectives, closing questions, preview | none | 4 |
| E6 Sharing | Public link, dates, passcode, personal invites, reminders, kill switch | none | 3 |
| E7 Respondent | Landing, fields, items, reasons, autosave, resume, missing items, summary, sign-off, accessibility | none | 5 |
| E8 Dashboard | Tracker, agreement, registers, item detail, conflict view, live updates, sample project | none | 5 |
| E9 Insights | Actions with citations, done or dismissed, cost per run | none | 2 |
| E10 Exports | CSV, JSON, PDF summary | none | 2 |
| E11 Trust | Rate limits, export and deletion, legal page drafts, backup and restore script; Sentry, Plausible and the lawyer at the launch gate | none until launch | 2 |
| E12 Landing and onboarding | The story page as real code, quickstart, transactional emails tested in Gmail, Outlook and Apple Mail by Mihai | none | 3 |

Launch gate: Mihai decides the product is worth a domain. Then: name, domain, personal Vercel
and Neon, Resend, Sentry, Plausible, legal pages confirmed, deploy. After that, one organisation
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

## What Claude does in every session, without being asked

Record decisions in docs/decisions/ the same day. Write a dated design note for design work.
Keep docs/context.md current so the next session starts in the right place. Report numbers,
file paths and commands.
