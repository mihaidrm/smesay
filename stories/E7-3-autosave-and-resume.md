# E7-3 Autosave within one second; resume by personal link or device token

User: an expert interrupted mid-way, on the train
Status: ready
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
   unchanged items by reference.
6. The Response schema section of INTERFACES.md is written in this story: the autosave
   payload and the stored answer shape the dashboard and exports read.

## Out of scope
- Offline for hours: the queue is per tab, not a service worker.

## Open questions
- None.

## Technical notes
Routes under /r/[token]/answers (PUT one answer) and /r/[token]/state (E6-4). updated_at on
answer and response; the server is the source of truth, last write wins per answer. Rate limit
in E11-1.
