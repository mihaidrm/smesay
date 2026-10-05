# E14-3 People: who can sign in, how, and where

User: Mihai, helping someone who cannot get in
Status: built
Outcome: one page per person with their sign-in methods, workspaces and sessions, and the
actions that get them unstuck.

## Acceptance criteria
1. /admin/people lists every user: email, name, email verified, sign-in methods (magic link,
   Google), workspaces with role, created, last sign-in, open sessions; searchable by email or
   name.
2. /admin/people/[id] shows the same plus the last 20 of the person's product events
   (E13-1, no respondent data) and the invitations waiting for their email.
3. Actions, each audited (E14-1): send a magic link to the person's email (the product's own
   sender, so the link works once and expires in 15 minutes), sign them out everywhere (every
   session row removed), remove them from a workspace (through src/lib/members.ts, which keeps
   the last owner), and delete the account at the person's request (their memberships go,
   their rows in workspaces stay anonymised: created_by set null, the name on sign-off records
   kept as the respondent gave it, since respondents are not users).
4. The page shows no password or token, ever; sessions show created and expiry and the
   user agent's family (browser and OS), not the raw string.
5. Tests: the list, the detail, each action and its audit row, the last-owner rule holding
   for an admin; a non-admin gets 404. Playwright: find a person, send them a magic link, see
   it in Mailpit.

## Out of scope
- Changing a person's email: they sign in with the new one and are invited again.
- Merging two accounts: not in R1.

## Open questions
- None.

## Technical notes
Reads better-auth's user, session and account tables through src/db/queries/admin.ts; the
delete goes through better-auth's own user deletion so its tables stay consistent (checked
against node_modules when the story starts). Written 2026-10-02 (decision 0035).
