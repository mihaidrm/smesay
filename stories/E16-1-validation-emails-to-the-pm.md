# E16-1 Emails to the PM about a validation, and the switches that stop them

User: a PM who sent a validation out and does not want to keep the dashboard open to know
where it stands; a person invited to a workspace who should know who invited them
Status: built
Outcome: the PM gets one email when a validation closes and one when everyone they invited has
submitted, a daily digest if they ask for it, and a person invited to a workspace gets an
invitation that says who invited them; every one of these emails can be stopped with one
click and from Settings.

## Acceptance criteria
1. Closing summary (email 7 in docs/copy/emails.md): when a validation's link closes (the
   public link's close date passes without a revoke, or, with no public link, the last
   personal invite's close date passes), every member of the workspace with "Emails about
   your validations" on gets one email within the hour: how many submitted of how many
   invited, the public link's count, the three items with the most disagreement, a button
   to Results. One per validation, never for a close older than 48 hours when the job first
   sees it (instrument.closed_email_at).
2. Everyone has submitted (email 8): on the first Submit that completes the set of personal
   invites of a validation (every invite not revoked has a submitted response, at least one
   invite), the same members get one email saying so, with the close date and a button to
   Results. One per validation (instrument.complete_email_at); sent after the Submit's reply,
   a failed send never undoes the Submit.
3. Daily digest (email 9), off by default: a member who turns it on gets at most one email a
   day, only on a day with at least one new submission across the open validations of their
   workspaces: one line per validation (new, submitted of invited, closes on), a button to the
   first one's Results.
4. Workspace invitation (email 10): inviting a person from Settings, Members sends "[NAME]
   invited you to [WORKSPACE] on SMEsay" with the sign-in link, in place of the plain sign-in
   email; the person's own sign-in requests keep the sign-in email. Transactional: no switch.
5. Settings gains a card, "Emails to you", per person: three switches (validations: on,
   digest: off, getting started: on, E16-2) saved at once, with the stored state shown on
   reload. Emails 7, 8, 9 and E16-2's carry "Stop these emails" with a link that needs no
   sign-in: a page that asks once and stops that kind for that person; the email also carries
   List-Unsubscribe and List-Unsubscribe-Post headers (RFC 8058), so a mail client's own
   unsubscribe button works. A link with a token that is not on file answers 404.
6. `npm run jobs:emails` sends what is due (the closing summaries, the digests, E16-2's
   series) and prints the counts; hourly by cron on the host, beside jobs:purge. Nothing
   Claude runs sends a real email: tests use the memory transport.
7. Tests: unit tests for the templates (no placeholder left, the frame), the due-email logic
   (a close sends once, a member of another workspace gets nothing, a digest day with nothing
   new sends nothing, the switch off sends nothing), the stop page (token on file stops the
   kind, an unknown token is 404), the invitation context; Playwright: the Emails to you card
   saves and shows the state after a reload, and the invitation email reaches Mailpit with the
   inviter's name in its subject (e2e/members.spec.ts).

## Out of scope
- An email per response: the dashboard is live (E8-7).
- A choice of send time or time zone for the digest: the job's hour is the host's.
- Emails to respondents beyond E6 and E7's.
- Alerts for the admin (E13-2, E14-1: not in R1).

## Open questions
- None. Mihai asked for the four on 2026-10-12 (decision 0067).

## Built
Built 2026-10-12 (decision 0067, design note 132). Recipients are every member of the
workspace with the switch on, not only the person who published. The digest is opt-in.
updated_at of nothing moves. Tests: src/lib/mail/templates/templates.test.ts (the samples),
src/lib/notifications.test.ts, src/lib/email-prefs.test.ts, e2e/emails.spec.ts, e2e/members.spec.ts.

## Technical notes
- user.email_prefs jsonb (INTERFACES.md EmailPrefs): { validations, digest, guide }; user.email_state
  jsonb (EmailState): { token (32 hex, randomBytes(16), made on the first email that needs it),
  digestAt, steps { [step]: ISO } }. instrument.closed_email_at and complete_email_at.
- The due-email logic is src/lib/notifications.ts; the cross-workspace reads it needs are in
  src/db/queries/internal.ts (the job runs with no session, as jobs:purge does).
- The invitation email: src/lib/members.ts runs better-auth's signInMagicLink inside an
  AsyncLocalStorage context (node:async_hooks) that names the inviter and the workspace; the
  magic-link hook in src/lib/auth.ts reads it and renders email 10 instead of email 1. The
  public sign-in endpoint never sets it, so nobody can forge an invitation.
- The stop page: /email/stop?t=[TOKEN]&k=[KIND]; GET shows the question, POST stops; the
  one-click POST of RFC 8058 (body List-Unsubscribe=One-Click) stops at once.
