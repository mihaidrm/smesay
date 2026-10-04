# E7-3 Autosave within one second; resume by personal link or device token

User: an expert interrupted mid-way, on the train
Status: built
Outcome: every answer is on the server within a second of being given, and closing the tab
loses nothing.

## Acceptance criteria
1. Each change on a card is sent within one second (debounced 400 ms, flushed on blur and on
   page hide); the server answers with the saved state and the card note shows Saved. A test
   measures the time from input to the request on the sample link under 1,000 ms.
2. Public link: a device token (32 characters, E1-2 check) is created on Start, stored in a
   cookie scoped to /r/[token], and the response is keyed by it; reopening on the same device
   restores every answer, the chapter and the fields. Personal link: the response is keyed by
   the invite and resumes on any device.
3. Connection lost: the banner "Not saved. Your connection dropped; this page keeps trying.
   Your answers stay on this device until it reconnects." and the header note "Not saved";
   answers queue in memory and in localStorage and are sent when the state route (E6-4)
   answers again. A test cuts the network in Playwright, answers two cards, restores it and
   sees both saved.
4. Storage unavailable (private window, cleared): the page "This browser does not keep
   answers between visits. ..." once, and the session still works in one sitting.
5. A newer set version with saved answers on this device (public link reopened after the PM
   built a new instrument on version 2): the page "The list changed since you last answered.
   [N] of your answers still apply and are kept; [N] items are new or changed and are marked."
   Since responses are pinned to a version (E1-2), "kept" means the old response stays
   readable on its version and a new response starts on the new one; the message counts
   unchanged items by reference. (Amended 2026-10-04, not built in R1: publishing a newer
   version closes the older links, so a device never meets a newer version through an old
   link; see Built below and docs/review-list.md.)
6. The Response schema section of INTERFACES.md is written in this story: the autosave
   payload and the stored answer shape the dashboard and exports read.
7. Owed from E6-4 (recorded 2026-10-04): the autosave route checks the link through
   linkStatus (src/lib/link-access.ts) before every write and answers 410 with nothing
   written on a revoked or closed link; a test proves an autosave after revocation is
   refused with 410 and nothing written.

## Out of scope
- Offline for hours: the queue is per tab, not a service worker.

## Open questions
- None.

## Technical notes
Routes under /r/[token]/answers (PUT one answer) and /r/[token]/state (E6-4). updated_at on
answer and response; the server is the source of truth, last write wins per answer (amended
2026-10-04 after the audits: a write lands on the version of the answer it was made on, or
after an earlier save of the same page, or after a save it names as one it was made on top
of, so a change made on an answer another window or device has replaced since is not saved
over it; no clock decides). Rate limit in E11-1.

Built 2026-10-04 (design note 52, decision 0044):
- Acceptance 1: a change waits 400 ms, and never more than 900 ms after the first change
  still waiting, then PUT /r/[token]/answers; focus leaving a control and the page being
  hidden send at once (src/app/r/[token]/answer-saver.ts; the timing rules in
  src/lib/answer-queue.ts). The server answers the stored kind, whether it is complete and
  the version it holds; the card reads Saved.
  e2e/respondent-autosave.spec.ts measures pick to request under 1,000 ms on the test's own
  project (the sample link collects nothing, docs/review-list.md).
- Acceptance 2: the device token and its cookie from E7-1; reopening restores the answers
  and the fields, and a visit with no screen in the address lands on the first chapter with
  an unfinished item (resumeAt, src/lib/respondent-rules.ts). A personal link's response is
  found by its invite on any device (E7-1's test). Every write carries the answer's version
  it was made on, the page that sends it (a random id per page load) with its number for
  the save, and the response the page answers for (answer.version, writer and writer_seq,
  migration 0017). The server stores it when the stored version is still that one, or when
  the same page wrote it last with a lower number (a late reply, a timeout), or when the
  write names the last writer's save as one it was made on top of (after), and otherwise
  answers "stale" with the stored answer. Opening the link sends what the device kept with
  the version, page and number it was queued with, so the same rule decides: a change made
  after the closed page's own earlier save (its reply lost in a tunnel) lands, and a change
  left unsent on a phone does not replace an answer saved since on a laptop; the card says
  the answer was changed elsewhere and shows the saved one. An edit on a card while such a
  kept change still waits for the server keeps that change's version and names it, so it
  lands exactly where that change would have (nextEntry). When the stale answer is the
  page's own (written by it, by a kept change's page with exactly that save, or saying the
  same) nothing changes. The test copies the device
  cookie into a second browser, types key by key in the first one with saves failing,
  answers in the second, closes the first tab and opens the link again: the card shows the
  second browser's answer with the sentence, then Saved on the next visit. Trade-off: of two
  devices changing one answer from the same version, the first save to land stays, and the
  other device's card says so (docs/review-list.md).
- Acceptance 3: an answer that cannot reach the server stays in memory and in localStorage,
  tied to its response and merged with what another window on the link keeps; the header
  says "Not saved", a complete card "Not saved yet", and the banner says the connection
  dropped; the state route is asked every 5 seconds and on the online event, and when it
  answers every waiting answer is sent. Of the failures only a 422 drops an answer (a stale
  reply from another window or device drops the change too, with the sentence); a rate limit, a 5xx or
  an unexpected code keeps it and retries, and "Not saved" stays until every failed answer
  has gone through. Closing or hiding the page sends every unconfirmed answer again with
  keepalive, the ones in flight included. The Playwright test cuts the network, answers two cards, restores it and sees both
  Saved, then closes a tab offline and sees the answer sent when the link opens again.
- Acceptance 4: where localStorage throws, the notice shows once, as a banner over the first
  chapter screen (the story said "the page"), and answers still save; the test blocks
  localStorage in the browser. A browser that blocks cookies usually blocks storage too
  (MDN, Window.localStorage, Exceptions): Start works, the first save finds no response, and
  the note under Start says the browser did not keep the cookie.
- Acceptance 5: not built. Publishing a newer version closes the older public and personal
  links (src/db/queries/invites.ts publish), so a device never meets a newer set through an
  old link: the respondent sees the closed page, which removes the device's unsent answers
  for that link, and nothing points to the new link (docs/review-list.md).
- Acceptance 6: INTERFACES.md, Response schema.
- Acceptance 7: the answers route checks the link through openLinkFor (src/lib/respondent.ts),
  the same rule as linkStatus (viewOf) plus the sample and the passcode; after a revoke it
  answers 410 and writes nothing (src/lib/respondent.test.ts).
- Audit 2026-10-04: 1 blocking finding (an old queue could replace a newer answer), 12
  should-fix and 9 nits; fixed as above, the rest recorded in docs/review-list.md. Unit
  tests for the queue rules: src/lib/answer-queue.test.ts.
- Second audit 2026-10-04: 1 blocking finding (a count of saves let an older change made
  with more keystrokes win across devices), 10 should-fix; replaced by the respondent's edit
  time, with the response id on every write and the in-flight save sent again on page hide.
- Third audit 2026-10-04: 1 blocking finding (the edit time, clamped to the server's clock,
  could no longer confirm the page's own save), 5 should-fix and 8 nits; the clock was
  dropped for the version, the page id and its save number (this record). Also from that
  audit: Start binds the new response before the cards' answers are sent again; a keepalive
  that fails marks the answer not saved and retries, and the page sends what is unconfirmed
  when it shows again; one keepalive per answer when the page hides; a reset removes only
  that response's queue; a reply after the page closed changes nothing; the unknown-link
  page removes the queue; the sentence says what to do. A change taken while the page was
  still hydrating is sent when the page mounts (found by the e2e test, 2 of 4 runs failed
  before the fix, 4 of 4 passed after).
- Fourth audit 2026-10-04: 1 blocking finding (on opening, the page dropped a change made
  after its closed page's own earlier save as "changed elsewhere", since it knew only the
  version), 4 should-fix and 6 nits. The page now sends what it finds with its version,
  page and number and lets the server's rule decide; what a reply does to the queue is one
  function with unit tests (replyStep); a copy of a save answered after another copy no
  longer leaves "Not saved" behind; the page answers for no response between a reset and
  Start, and binding another response forgets the old one's versions. Recorded: two windows
  writing the store at the same moment (docs/review-list.md).
- Fifth audit 2026-10-04: 1 blocking finding (an edit on a restored card, made before the
  server answered for the restored change, took the version the page had loaded: with the
  restored request lost it could replace another device's answer, or drop the respondent's
  own edit), 2 should-fix and 6 nits. Such an edit now keeps the restored change's version
  and names it (after, at most 8 saves; the server's rule takes a write after a named save
  or an earlier one of that page); a Start that names another response than the page
  answered for sends the cards again like a lost one; one keepalive per save also after a
  rebase; a copy of a confirmed save no longer shows the offline banner; a reply for an
  earlier save no longer clears a newer change's failed mark.
- Sixth audit 2026-10-04: no blocking, 4 should-fix, 5 nits. Fixed: a stale reply counts as
  the page's own when this page wrote it, or the kept change's page wrote exactly that save
  (a later save of that page is another tab's newer change, not this one's); the docs and
  comments that left out after; a test for the bound on after. Recorded: the 8 names.
