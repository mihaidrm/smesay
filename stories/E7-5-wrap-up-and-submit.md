# E7-5 Wrap up: tally, missing item, closing question, confidence, sign-off, submit

User: an expert finishing
Status: ready
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
5. When the respondent's email is known (personal invite or an email field), the submission
   receipt (email 4, docs/copy/emails.md) is sent; otherwise nothing is sent and the Done page
   is the receipt.
6. Playwright: complete the sample instrument, submit, see Done; press "Change my answers",
   change one, submit again, see the same response updated in the PM tracker.

## Out of scope
- Partial responses policy: E7-1's open question.

## Open questions
- None. The receipt lists counts only, with the link (decision 0031).

## Technical notes
Submission calls `withinPlan(ws, "responses")` (E2-6) before marking the response submitted;
always true on the free entry.
missing_item (text, suggested_area, and a suggested value column added in migration 0002
with the closing answer column on response, `closing_answer`); INTERFACES.md first. The tally
and sections reuse the respondent board's bucket rules.

Owed from E5-5 (recorded 2026-10-03): the Wrap up is src/components/respondent/wrap-up.tsx,
shared with the Build preview; E7-4 built the gaps, the Go to handler and the live page's
header and row; E7-5 adds the answers to the tally and the sections, the form, Submit, the
mandatory fields in the "Still needed" line and the "Pick how sure you are" line, and stores
the sign-off sentence the respondent ticked on the response (docs/review-list.md).
