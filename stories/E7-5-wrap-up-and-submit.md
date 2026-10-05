# E7-5 Wrap up: tally, missing item, closing question, confidence, sign-off, submit

User: an expert finishing
Status: built
Outcome: the respondent reviews what they said, adds what is missing, says how sure they are,
confirms, and submits once; a second submit updates.

## Acceptance criteria
1. Wrap up (respondent board, note 12, decision 0018 item 5): a tally of five tiles (agreed,
   higher priority, lower priority, not needed, unclear; in rate-blind mode rated, not
   needed, unclear), an amber box naming the gaps with a button to the chapter, sections for
   what the respondent suggested (still to finish, higher, lower, not needed, a question; agreed
   items are not listed) with Change per row, the missing-item form when on (text, area
   dropdown, suggested value), the closing question when set, confidence 1 to 5, the sign-off
   as one 48 px label with a checkbox, Submit with "Still needed: ..." or "Everything is in.
   Submit when you are ready."
2. Submit is disabled at 40 percent until every visible item is complete, the mandatory
   fields are filled, confidence is picked and the sign-off is ticked; the note lists what is
   missing. Confidence not given: "Pick how sure you are, 1 to 5, before you submit."
3. Submitting stores submitted_at in UTC, signed_off true, confidence, the missing item as a
   missing_item row and the closing answer; the Done page shows "Thank you, [NAME]." and the
   timestamp "Submitted [DATE], [HH:MM] UTC". A second submit updates the same response and
   never creates another (unique by device token or invite; a test submits twice and counts
   one row).
4. A submit failure keeps the answers on the device and shows "Your answers were not
   submitted; they are still saved on this device. Check your connection and press Submit
   again."
5. On a personal invite's first Submit, the submission receipt (email 4, docs/copy/emails.md)
   goes to the invite's address; otherwise nothing is sent and the Done page is the receipt.
   (Amended 2026-10-04 after the audit; the criterion said "when the respondent's email is
   known (personal invite or an email field)": an address typed on a public link would let
   anyone send mail through SMEsay. docs/review-list.md.)
6. Playwright: complete the sample instrument, submit, see Done; press "Change my answers",
   change one, submit again, see the same response updated in the PM tracker.

## Out of scope
- Partial responses policy: E7-1's open question.

## Open questions
- None. The receipt lists counts only, with the link (decision 0031).

## Technical notes
Submission calls `withinPlan(ws, "responses")` (E2-6) before marking the response submitted;
always true on the free entry.
missing_item (text, suggested_area, and a suggested value column added in migration 0018
with the closing answer column on response, `closing_answer`); INTERFACES.md first. The tally
and sections reuse the respondent board's bucket rules.

Owed from E5-5 (recorded 2026-10-03): the Wrap up is src/components/respondent/wrap-up.tsx,
shared with the Build preview; E7-4 built the gaps, the Go to handler and the live page's
header and row; E7-5 adds the answers to the tally and the sections, the form, Submit, the
mandatory fields in the "Still needed" line and the "Pick how sure you are" line, and stores
the sign-off sentence the respondent ticked on the response (docs/review-list.md).

Built 2026-10-04 (design note 55, decision 0044):
- Acceptance 1: the Wrap up on the live link (src/components/respondent/wrap-up.tsx, shared
  with the Build preview) shows the tally from the respondent's answers (tallyOf, bucketOf:
  higher and lower by the scale's order), the gaps box and list (E7-4), the sections higher,
  lower, not needed and their questions with Change per row (agreed items are not listed),
  the missing-item form when on, the closing question when set, confidence 1 to 5 and the
  sign-off label. On a desktop (decision 0052) it is a centered 760 px card, Back and Submit
  centered as a pair in its bottom band with Submit at 320 px and the line under them, and
  "Powered by" under the card.
- Acceptance 2: Submit is off until every visible item is complete on the server, the
  mandatory fields are filled, confidence is picked and the sign-off ticked; the line says
  what is still needed, and "Pick how sure you are, 1 to 5, before you submit." when only
  the confidence is left; the server checks the same (submitResponse) and answers the
  sentence. Submit first waits for every change on the cards to reach the server, and the
  server reads the answers under the response's lock (the one every save takes), so no save
  lands between the check and the mark.
- Acceptance 3: POST /r/[token]/submit stores submitted_at (UTC), first_submitted_at (kept),
  signed_off, confidence, the sign-off sentence shown, the closing answer and one missing
  item (migration 0018), under the invite row's lock; Done shows "Thank you, [FIRST NAME]."
  and "Submitted [DATE], [HH:MM] UTC". A second Submit updates the same response
  (src/lib/respondent-submit.test.ts counts one row).
- Acceptance 4: a failed Submit keeps everything and says so in the line under Submit; what
  waited to be saved stays queued and is retried. The Wrap up's answers save to the server
  within a second as they are written (PUT /r/[token]/wrap, src/app/r/[token]/wrap-saver.ts),
  like the cards (CLAUDE.md, respondent side), with the cards' version rule (an old change
  kept on a device never replaces a newer one, a submitted one included; another window's
  change shows with a sentence). Until the server holds them they stay on the device
  (smesay-wrap:[token]) and go once more as the tab closes (keepalive), so a closed tab loses
  nothing; a change that cannot go then waits on that device for the link's next visit
  there. A Submit again keeps the missing item and the closing answer. The sign-off is
  ticked again each time and is never saved; ticking it sends nothing. The form cannot
  change while Submit posts. Submit names the response the page
  answers for, as every save does; a response that is not this device's is "not started",
  and the page goes back to About you with everything kept, as when a card's save finds it.
- Acceptance 5 as amended: the receipt (email 4, src/lib/mail/templates/receipt.ts) goes to a
  personal invite's address on its first Submit, after the reply (Next's after()); nothing
  goes to a typed address.
- Acceptance 6: e2e/respondent-submit.spec.ts completes a two-item list on a personal link,
  submits, sees Done and the receipt, changes an answer, submits again and sees the new time
  and Submitted on the PM's invite row. The PM tracker the story names is E8-2 (built
  2026-10-04 after this story); the invite row stands in (docs/review-list.md).
- withinPlan(ws, "responses") is checked on the first Submit (always true on the free entry);
  the month counts the first Submit (first_submitted_at).
- Audit 2026-10-04: 5 blocking (the receipt to a typed address on a public link; a Submit
  that could post before the cards' last changes, with the check outside the lock; a later
  Submit erasing the stored closing answer and missing item; a list with no areas offering
  the title as an area; the Wrap up's answers lost with the tab), 12 should-fix, 12 nits.
  Fixed as above. Also: the sign-off sentence the respondent ticked is checked against the
  PM's; the receipt goes after the reply and once; the month counts the first Submit; the
  Change button opens its item with a 48 px hit area; the limits come from the shared
  constants; the thanks takes the server's first name; Back from Done unticks the sign-off.
  Recorded in docs/review-list.md: the receipt rule, answers changed after a Submit (E7-6).
- Re-audit 2026-10-04: 1 blocking (Submit did not name the response it was for, so a window
  whose cookie was replaced submitted another window's response, and the wait for the cards
  ended true after a reset), 8 should-fix, 8 nits. Fixed: Submit names the response; the wait
  (settleState, unit tested) stops on a failure, a card refused or changed elsewhere ("One of
  your answers was not saved as you left it. ..."), or another response; a 409 from Submit
  goes back to About you as a card's does; the Wrap up's answers save to the server as they
  are written; an area the list no longer offers is not sent; the receipt's first Submit is
  decided under the lock, with a rate-blind wording; the month backfills first_submitted_at
  for responses submitted before migration 0018 and the sample seed; the tenancy test goes
  through an invite of the other workspace; the email field's wording; the unused label.
  E7-6 takes answers changed after a Submit.
- Third audit 2026-10-04: 1 blocking (a Wrap up change kept on one device, sent when the
  page opened a week later, replaced the answers the respondent had submitted on another
  device, with no version check), 9 should-fix, 9 nits. Fixed: the Wrap up carries the cards'
  version rule (wrap_version, wrap_writer, wrap_writer_seq in migration 0018; wrapTakes;
  src/lib/wrap-queue.ts with unit tests); a stale write and a stale Submit get the stored
  Wrap up back and the page says so above the form; Submit sends what waits at once and
  never drops it, and the form cannot change while it posts; ticking the sign-off and a
  write that changes nothing move nothing but the version; after a lost response the Wrap up
  goes to the new one whatever it holds; a kept change has its area checked; keepalive on
  hide; the response a write names is checked first; the completeness check uses the
  perspectives as locked; the missing item is updated in place; Submit has a time limit; a
  stale sentence under Submit clears on a change or a move; the receipt's rate-blind line is
  in docs/copy/emails.md; the wrap route's JSON-only test; a test runs the migration's
  backfill.
- Fourth audit 2026-10-04: 0 blocking, 3 should-fix (a change put back to what the server
  held while the first was in doubt was dropped; a kept change that landed trimmed read as
  "changed elsewhere"; a late keepalive reply moved what the page thought the server held
  back), 7 nits. Fixed: a change goes in the queue unless it says what waits, or with none
  waiting what the server holds or last refused (wrapChange); Wrap ups are compared as the
  server stores them (sameWrap trims and ignores an area and a value without text); a reply
  about an older version than the page has seen changes nothing; the refusal that stops a
  Submit shows under Submit; a Submit clears the Wrap up's sentence; one send per change
  after a rebase; SECURITY.md lists the kept saves; the queue's decisions have unit tests
  (src/lib/wrap-queue.test.ts). The area check against perspectives as of the save is
  recorded in docs/review-list.md.
- Fifth audit 2026-10-04 (on those fixes): 0 blocking, 0 should-fix, 7 nits. Merged (PR
  92); the nits are fixed with E7-6, whose saver changes touch the same code
  (stories/E7-6-submitted-and-edit.md).
