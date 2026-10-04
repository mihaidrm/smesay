# Design note 55: Wrap up and Submit on the live link, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E7-5, under decision 0044.

## What was decided

- The Wrap up is the Build preview's component with the respondent's data: the tally from
  the cards (a higher or lower priority than proposed by the scale's order: MoSCoW Must to
  Not needed, fit by number, keep, change, drop), the sections for what they suggested with
  Change per row, and the form the page holds (the missing item, the closing answer,
  confidence, the sign-off). Agreed items are not listed (decision 0018 item 5). An item with
  no proposal counts as Rated, and that tile appears only when one exists.
- Submit is off until the server holds every visible item complete; the server checks the
  same and more (the mandatory fields, confidence, the sign-off and its sentence as the page
  showed it, a missing item inside the list's areas and the scale) and answers the sentence.
  The page first waits for every change on the cards to reach the server. Under the invite
  row's lock and the response's (the one every save takes), the answers are read and
  checked, then the response is marked: the latest time, the first time kept, the sign-off
  sentence, the closing answer, one missing item replaced. Before, a Submit could pass with
  a change still on its way, checked outside the lock (the audit's second blocking finding).
- The Wrap up's answers save to the server within a second as they are written (PUT
  /r/[token]/wrap; wrap-saver.ts, the cards' timing), like every answer (CLAUDE.md,
  respondent side; the re-audit: kept on the device only, a closing answer written on a
  phone was missing on the laptop). Until the server holds them they stay on the device too
  (smesay-wrap:[token], tied to the response), so a closed tab keeps them. A visit on any
  device starts from what the server holds, so Submit again keeps the missing item and the
  closing answer. The third audit found a kept change landing over a newer one (a laptop's
  week-old draft over a phone's Submit): every Wrap up write and Submit now carries the
  cards' version, page and number (wrap_version, wrap_writer, wrap_writer_seq; wrapTakes),
  the page sends a kept change only when the server would still take it, and a stale write
  gets the stored Wrap up back (src/lib/wrap-queue.ts). A write that changes nothing moves
  nothing but the version, ticking the sign-off sends nothing, Submit first waits for the
  Wrap up's save without dropping it, and the form cannot change while Submit posts. The sign-off is never kept: it is ticked for each Submit. Submit names the
  response the page answers for (409 "not started" otherwise, and the page returns to About
  you with everything kept) and first waits for the cards: it stops when one cannot be
  saved, or when one was refused or changed in another window meanwhile. A list with no areas asks no area for a missing
  item, and "Other items" is not an area (areasOf).
- The receipt goes only to a personal invite's address, on its first Submit, after the
  reply (Next's after(): node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
  after.md); a failure to send does not undo the Submit. An address typed on a public link
  never gets one: anyone could type any address (the audit's first blocking finding).
- Done, in this story: "Thank you, [FIRST NAME]." and "Submitted [DATE], [HH:MM] UTC", with
  Change my answers, which reopens the Wrap up with the sign-off cleared (note 12, finding
  10). E7-6 adds the summary line and the welcome back.
- The schema change is migration 0018: response.first_submitted_at, closing_answer,
  sign_off_text; missing_item.suggested_value (INTERFACES.md, Response schema v2).

## Checks

- src/lib/respondent-submit.test.ts: buckets, the areas, the input (the sign-off sentence, a
  list with no areas), the Wrap up kept on the device, refusals, the check under the lock,
  the stored submission read back, a second Submit, the receipt on a personal invite's first
  Submit only and none to a typed address, a revoked link, another workspace, the route.
- e2e/respondent-submit.spec.ts: the personal link to Done, the Wrap up kept over a reload,
  the receipt, Back from Done, Change and Submit again, the PM's row.
