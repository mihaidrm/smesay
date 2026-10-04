# E7-6 After submitting: the Done page, edits until the close date, welcome back

User: an expert who remembered something after submitting
Status: ready
Outcome: answers can be changed until the link closes, every change is a new submit, and the
pages say what state things are in.

## Acceptance criteria
1. The Done page shows the summary line ("4 agreed, 2 changed, 0 not needed, 0 unclear, 1 item
   added"), the timestamp, and "Change my answers", which reopens the Wrap up with the sign-off
   cleared (note 12, finding 10).
2. A personal link opened after submitting shows "Welcome back, [NAME]. You submitted on
   [DATE]. You can change your answers until [CLOSE DATE]. [Change my answers]"; after the
   close date it shows "Your answers were submitted on [DATE]. The link closed on [CLOSE
   DATE]; nothing can be changed now." (docs/copy/errors.md).
3. A public link on the same device after submitting behaves the same; on another device it
   starts a new response (there is nothing to resume).
4. The PM tracker (E8-2) shows the latest submitted_at and a "changed after submitting" mark
   when updated_at is later than the first submit; a unit test checks the mark.
5. Playwright: submit, reopen the link, press Change, submit again, see the new timestamp.
6. (Added 2026-10-04 from E7-5's audit, decision 0044.) An answer, the Wrap up or the About
   you picks changed after a Submit and not submitted again: the response keeps its submitted
   time but is no longer signed off (signed_off false; the sign-off was for the answers as
   submitted); the Done screen and the Wrap up say "You changed answers after submitting.
   Submit again to send them."; Submit again signs it off. E8-2 tells the PM a response with
   changes not submitted again from one submitted again.

## Out of scope
- Withdrawing a response: not in R1.

## Open questions
- None.

## Technical notes
response.first_submitted_at added in migration 0018 (E7-5) so the mark in acceptance 4 does not need
history; submitted_at is the latest.
