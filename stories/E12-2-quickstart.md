# E12-2 Quickstart in the app

User: a new PM in the first five minutes
Status: built
Outcome: a four-step page shown once after the first sign-in and always under Help, from
which a new user reaches a published instrument in under five minutes without help.

## Acceptance criteria
1. After E2-3's workspace naming, the quickstart page (docs/copy/quickstart.md: title, intro,
   the four steps, "Then: read the results", Start a project, Open the sample project) is shown
   once; a `quickstart_seen_at` on the membership stops it showing again; Help in the sidebar
   footer opens it any time.
2. "Start a project" opens New project (E3-1); "Open the sample project" opens the sample on
   Results (E8-8).
3. Under five minutes: Mihai or a person he asks does it from a fresh sign-in with the Marlow
   fixture on his PC, timed, and the time is recorded in the story on acceptance (the "about
   ten minutes" line in the copy is then replaced with the measured number or removed, as the
   copy file says).
4. Playwright: first sign-in shows the quickstart; the second does not; Help shows it.

## Out of scope
- In-product tours: not in R1. Tips in the product are E15 (the guide card, 2026-10-03); the
  quickstart stays the reference page the guide links to.

## Open questions
- None.

## Technical notes
workspace_member.quickstart_seen_at (per person per workspace), added by migration 0027
(drizzle/0027_quickstart.sql).

Built 2026-10-05 (design note 78, decision 0044):
- Acceptance 1: the page is /app/quickstart (src/app/app/(shell)/quickstart/page.tsx), copy in
  src/lib/quickstart-copy.ts from docs/copy/quickstart.md. Projects (/app) sends a member whose
  quickstart_seen_at is null to it; opening it stamps the column once
  (members.markQuickstartSeen, src/db/queries/members.ts). Naming the workspace redirects to
  /app, so the quickstart is the first page after it; an invited member sees it on first
  reaching Projects in that workspace. Help in the sidebar footer opens it any time.
- Acceptance 2: "Start a project" links to /app/projects/new; "Open the sample project" links
  to the sample's Results, shown while the workspace has its sample (deleted or archived: the
  link is left out).
- Acceptance 3: Mihai's timed run. "About ten minutes" stays in the intro until then.
- Acceptance 4: e2e/quickstart.spec.ts; the unit test for the stamp is in
  src/db/queries/onboarding.test.ts. The 34 other specs and the board capture that name a
  workspace now pass through the quickstart first; e2e/members.spec.ts expects it for the
  invitee. Migration 0027 marks every membership that existed before it as seen, so people
  already using the app are not sent to it.

Changed 2026-10-07 (design note 102): Mihai called the page "a wall of text". The intro is one
sentence, each step card is two lines (what you do, what you get, at most 14 words each), and
"Then: read the results" is three bullets. Titles, the four steps, the two links, the test id
and the heading levels are as before; e2e/quickstart.spec.ts counts the step cards inside the
list of steps and the three bullets. Acceptance 3 is unchanged: "about ten minutes" stays in
the intro until the timed run.
