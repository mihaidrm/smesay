# E12-2 Quickstart in the app

User: a new PM in the first five minutes
Status: ready
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
workspace_member.quickstart_seen_at in migration 0002 (per person per workspace).
