# E7-6 After submitting: the Done page, edits until the close date, welcome back

User: an expert who remembered something after submitting
Status: built
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
3. A public link on the same device after submitting behaves the same while the link is
   open; on another device it starts a new response (there is nothing to resume). (Amended
   2026-10-04 after the audit: a closed public link shows no per-device state, decision 0031,
   so the closed message of acceptance 2 is a personal link's.)
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

Built 2026-10-04 (design note 56, decision 0044):
- Acceptance 1: the Done screen shows the thanks, the time in UTC, the summary line ("[N]
  agreed, [N] changed, [N] not needed, [N] unclear, [N] items added", with ", [N] rated"
  after "changed" when items without a proposal were rated, and "[N] rated, ..." on a
  rate-blind list) and Change my answers, which reopens the Wrap up with the sign-off
  cleared.
- Acceptance 2: a submitted personal link opened again lands on "Welcome back, [FIRST NAME].
  You submitted on [DATE]. You can change your answers until [CLOSE DATE]." with the summary
  and Change; after the close date the link page says "Your answers were submitted on
  [DATE]. The link closed on [CLOSE DATE]; nothing can be changed now." (loadRespondent,
  closedSubmitted).
- Acceptance 3: a public link on the same device finds its response by the device cookie
  and behaves the same while open; another device has no cookie and starts a new response;
  a closed public link shows no per-device state (decision 0031).
- Acceptance 4: changedAfterSubmit (src/lib/respondent-rules.ts) is true when updated_at is
  later than first_submitted_at (migration 0018, E7-5); a unit test checks it. The tracker
  that shows it is E8-2.
- Acceptance 5: e2e/respondent-after-submit.spec.ts submits, opens the link again, sees the
  welcome back, presses Change, submits a minute later and sees the new time.
- Acceptance 6: an answer (answers.upsert), the Wrap up (responses.saveWrap) or a Start that
  changes something takes the sign-off back on a submitted response; a write that changes
  nothing does not; Submit gives it back. Done and the Wrap up say "You changed answers after submitting. Submit again to
  send them." changedSinceSubmit tells the PM; changedAfterSubmit no longer counts a Submit
  or a Start that changes nothing (they do not move the last save). Tested in
  src/lib/respondent-submit.test.ts and the Playwright test (the notice before the second
  Submit, none after).
- Audit 2026-10-04: 2 blocking (the closed submitted page no longer cleared what the device
  kept; a change after Submit left the response signed off with nothing said), 6 should-fix,
  3 nits. Fixed: the closed submitted page clears the device's keys; acceptance 6 as above;
  the mark's false positives; a revoked link on an archived project shows nothing of the
  respondent's (also the closedOwn page); the rated count in the summary; INTERFACES.md;
  the stale wording; tests for the closed line and the no-close-date line. The wait of up to
  a minute in the Playwright test stays: the time on Done has minutes, not seconds.
- Re-audit 2026-10-04 (on E7-5's version rule): 1 blocking (a Wrap up save that changed
  nothing, a sign-off tick included, took the sign-off back and moved the last save), 8
  should-fix, 4 nits. Fixed: a write of an answer or the Wrap up that says what is stored
  moves neither, ticking the sign-off sends nothing (E7-5), and Submit moves the last save
  only when it carries a change; the saves and Start answer changedSince, so the notice
  follows what the server holds (a kept change sent on opening, a change undone before it
  was saved, an emptied field at Start); a closed personal link with changes not submitted
  again says so; the summary's missing item is the one on the Wrap up now; INTERFACES.md's
  Response schema; E8-1 and E8-2 carry the "changes not submitted again" state and the
  review list records how it counts; tests for a Start that changes the details, a public
  link reopened on its device and on another, and the revoked closedOwn case; the
  Playwright test checks the new time is the minute of the second Submit. Left as is, with
  E6-4's 60-second rule: a welcome back open across the close date says "until [a time now
  past]" until the page's next check, and Change then reloads onto the closed page.
- Third audit 2026-10-04: 0 blocking, 4 should-fix, 4 nits. Fixed: the notice follows the
  server only, from the first "changed" any answer carries until the next Submit (the
  server's state only goes one way between Submits, so the order answers arrive in does not
  matter, and a change undone before it was saved never shows it); stale answers and a
  stale Submit carry changedSince too; INTERFACES.md's reply shapes; tests for new picks at
  Start, the Start route's answer, a write that changes nothing on a response already
  changed, and a stale write; a Start moves the last save forward only (responses.restart);
  the Playwright tests click Start once the page has hydrated; acceptance 3 amended for
  decision 0031; the review list's settled row. A save from another device stamped after a
  first Submit's time but committed before it can still mark "changed after submitting" with
  nothing changed after it (docs/review-list.md). The page now shows the notice once the
  server holds the change, not while it waits offline.
- E7-5's last audit (on its fixes, 0 blocking, 0 should-fix, 7 nits) is fixed here, in the
  saver this story changes: a reply with no readable version settles the change, a retry
  still set goes once the server answers, a lost response forgets the refused value, the
  saver's header, a comment that cited no source, one import, and unit tests for the send
  rules (answered, sendsNext).
- Fourth audit 2026-10-04: 0 blocking, 2 should-fix (a keepalive copy's answer cleared the
  retry a newer Wrap up change waited for and sent nothing; no workspace test for
  responses.restart), 6 nits. Fixed: a keepalive copy's answer drives the queue like any
  other; restart has its cross-workspace test; an answer to a request sent before the
  page's last Submit posted does not bring the notice back; a refusal also lets the newer
  change go at once; a new response after a lost one starts with no Submit and no notice;
  the comment; tests for an answer's and a Submit's stale answer carrying "changed". The
  mark's two-device races are recorded in docs/review-list.md.
