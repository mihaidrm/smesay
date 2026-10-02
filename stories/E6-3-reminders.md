# E6-3 Reminders to invitees who have not submitted, manual, at most one every three days

User: a PM two days before the close date
Status: ready
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
