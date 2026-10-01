# Rules for every session

Read stories/ before building anything. A story without acceptance criteria is not ready; say so.

Every claim about an API, a library or a browser feature cites the documentation page it comes
from. If you cannot find it, write "unverified" and stop.

Never invent a function, a parameter or a package. If a compile or test fails on one, log it in
MISTAKES.md with what caught it.

Tests are basic (decision 0004): unit tests for logic, one Playwright test for the main path of
each user-facing flow. Run `npm test` and `npx playwright test` before any handoff. Report the
numbers and the command. "Tests pass" is not a report. Mihai tests real devices and mail clients.

Secrets are never printed, committed or included in a prompt. If an environment variable is
missing, name it and stop. You never create accounts or enter payment details. Account setup
steps for Mihai are in docs/accounts.md.

Write plain English. Follow WRITING.md and run `npm run scan:copy` on any user-facing text.
No em dashes anywhere, code comments included.

Each of Mihai's messages that asks for changes ends in its own pull request, pushed when the work
is checked. Requests from different messages do not stack in one pull request (decision 0019).

A change is not done until everything it touches says the same thing: every canvas board, every
file in docs/, stories/, the schema and INTERFACES.md. Grep for the old wording before reporting
(decision 0017).

Decisions are Mihai's. Ask, recommend one option, wait for approval. When you think Mihai is
making a mistake, say so before doing it, with the reason and what you would do instead; then do
what he decides (decision 0007). If two requirements
conflict, list the questions and wait. Record every decision in this folder on the day it is
made: docs/decisions/ for decisions, docs/design-notes/ for design work, and update README.md
and docs/context.md when the way sessions run changes.

Nothing from any client engagement is read, referenced or reconstructed. Design the respondent
instrument and the dashboard from stories/, docs/design-notes/ and public tools only. Every design
session writes a dated note in docs/design-notes/ saying what was decided and why.

Nothing hand-drawn or illustrated. Product screens are the imagery.

Definition of done for a story: acceptance criteria met and demonstrated with a screenshot or test
output; unit tests for logic and a Playwright test for the main path of any user-facing flow; no
new lint or type errors; no secrets in the diff; copy scanned; docs updated if behaviour changed.

When you report: numbers, file paths, commands. No adjectives. When something failed, say what
failed and what caught it. Do not thank, do not summarise the request back, do not describe the
code as anything other than what it is.

Stack: Next.js 15, TypeScript, Tailwind, shadcn/ui, Drizzle on Postgres, better-auth, server-sent
events for live updates, S3-compatible storage, Resend, Anthropic API from server routes only,
Vitest, Playwright. Nothing on the critical path may depend on a single vendor's feature; the app
must run from `docker compose up` with plain Postgres.

# How the work is split

One main session does the code, tests, docs, copy, research and stories. After a story is built,
the reviewer agent audits it with fresh context. The tester agent runs only when Mihai asks.
Never review your own story in the context that built it.

# Build rules

Data and security
- Every table has a workspace_id or is reachable only through a table that does.
- Every query helper takes the workspace id from the session, never from the request body.
- Tokens come from crypto.randomBytes(16) or stronger.
- Every schema change has a migration. A test proves a user in workspace A cannot read workspace B.
- Change a shared shape in INTERFACES.md first, then in the code.

Every side
- Every screen is designed for desktop (1440) and phone (390), desktop first, in the same
  pass (decision 0015). The respondent side is the exception: phone first, desktop second. The PM side is desktop
  only in R1 (decision 0020).

PM side
- Every screen has empty, loading and error states. Every form validates on the server.
- A component that is not in the design system gets a line in docs/design-notes/ when it is added.

Respondent side
- Phone first. No account. Store only the respondent fields the PM configured.
- Every answer autosaves within one second and survives a closed tab.
- Every state has a screen: mandatory fields not filled, item unanswered, reason required,
  unclear, submitted, closed, revoked.

Dashboard
- Every number on screen reconciles with the CSV export to the row; a test proves it.
- Aggregates over 500 rows are computed in SQL, not in the browser.
- Live updates arrive by server-sent events within five seconds.
- Sample data always carries the watermark.

Copy and docs
- Error messages say what happened and what to do next.
- Do not describe a feature the product does not have.
- Legal pages mark every place a lawyer must confirm.

Research
- Before recommending a library, check its licence, last release date and open issue count.
- Quote at most one short line per source. If two sources disagree, say so.
