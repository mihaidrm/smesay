# E6-3 Reminders to invitees who have not submitted, manual, at most one every three days

User: a PM two days before the close date
Status: built
Outcome: one click reminds a person; the count and the last date show per invitee; nobody is
reminded twice in three days or after submitting.

## Acceptance criteria
1. Remind per row and "Remind everyone who has not submitted" at the top. A submitted invitee
   has no Remind. A reminder within three days of the last: the button is disabled with
   "Reminded [DAYS] days ago. The next reminder can go on [DATE]." (docs/copy/errors.md).
2. The email is email 3 in docs/copy/emails.md with the branch "You have not started yet." or
   "You answered [N] of [M] items." from the response.
3. invite.reminders_sent and last_reminder_at update on send; the row shows "[N] sent, last
   [DATE]" or "None sent" (PM app board).
4. Reminders are never sent automatically (docs/copy/emails.md, Not sent).
5. A unit test proves the three-day rule across the boundary (71 hours refused, 73 allowed).

## Out of scope
- Scheduled reminders: not in R1.

## Open questions
- None.

## Technical notes
Same transport as E2-1. "Remind everyone" is one request that returns per-row results.

Built 2026-10-03 (design note 48, decision 0044):
- Acceptance 1: Remind on each row of the Personal invites card and "Remind everyone who
  has not submitted" over the list (share/remind-buttons.tsx); a submitted person, a Not
  sent row and a revoked link have no Remind; under three days since the last reminder
  the row shows "Reminded [DAYS] days ago. The next reminder can go on [DATE]." in place
  of the button (src/lib/reminders-rules.ts canRemind), and the server says the same.
- Acceptance 2: email 3 (src/lib/mail/reminder-email.ts) with "You have not started yet."
  when the invite has no answer and "You answered [N] of [M] items." from the newest
  response's answers (answers.countForResponse), sent as "[PM NAME] via SMEsay" with
  reply-to the PM.
- Acceptance 3: invites.claimReminder adds one to reminders_sent and sets last_reminder_at
  in one statement (two presses send one); a failed email gives the claim back
  (unclaimReminder); the row reads "[N] sent, last [DATE]" or "None sent".
- Acceptance 4: nothing sends a reminder but the two buttons; no job, no schedule.
- Acceptance 5: src/lib/reminders.test.ts refuses at 71 hours and allows at 72 and 73:
  canRemind at 71, 72 and 73, remindInvitee at 71 and 73 against the database, and the
  claim statement at 71 (refused), 72 and 73 (allowed).
- Playwright: e2e/reminders.spec.ts sends one invite, presses Remind, sees the count, the
  row's reminders cell and the too-soon line, reads email 3 in Mailpit, and sees "Remind
  everyone" off with "Nobody is due a reminder."
