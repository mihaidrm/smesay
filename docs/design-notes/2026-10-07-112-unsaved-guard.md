# 112 The unsaved changes guard on the setup steps, 2026-10-07

Mihai, 2026-10-07: "on each page when setting up an event - we must not allow to navigate away
from that page, if you have any unsaved changes on that page (in any section) we shake the
screen or notify the user, and we put in red text what is not saved, and we show a message
that he needs to save or discard changes". The event is a validation; the pages are Import,
Shape, Build and Share. Story: stories/E5-9-unsaved-changes-guard.md.

What was looked at: the leave-page pattern of the browser itself (the beforeunload dialog,
developer.mozilla.org/docs/Web/API/Window/beforeunload_event) and the in-app version that
desk tools use, a banner naming what is unsaved with a Discard beside it. No product's
screens were copied; the words are Mihai's.

Decided:
- One registry for the signed-in shell, not one per page: every form with its own Save (or
  Send, or Use this list) registers under its card's title and says whether it is unsaved.
  Nine forms: About this project and The list (the paste box) on Import; Intro, Scoring,
  Perspectives, Closing and Respondent fields on Build; Public link (the link card and the
  newer draft card) and Personal invites on Share. Shape and column mapping save on each
  press, so they register nothing. Unsaved means: changed since the last save, a save on its
  way, a save the server refused, or a save that found the session ended (the text is kept
  for after the sign-in, E11-6).
- The guard stops the click, it does not ask. The stepper pills, Projects, Settings, Help,
  the sidebar's project list, Open the sample and the Go to Shape link under Perspectives
  run it. What the PM sees: the unsaved cards shake once (4 px side to side over 400 ms,
  nothing under reduced motion), their hairline turns danger and an inset line makes it
  2 px without moving the layout, "Not saved" in danger text sits beside each title, and a
  banner in the pinned project header reads "Save or discard your changes before you leave:
  [the card titles]." with a secondary Discard beside it. Mihai said "shake the screen or
  notify"; the cards shake, not the screen, so the eye lands on what is unsaved. The banner
  sits in the pinned header so it is in view wherever the page is scrolled, and the banner is
  role alert so a screen reader hears it at once.
- Discard remounts each unsaved form through a changed key
  (react.dev/learn/preserving-and-resetting-state, "Resetting a form with a key"): the
  values, the dirty flag and the last result all go back to what the server rendered, with
  no per-form reset code to drift. About this project also drops its stored draft first.
- Closing the tab, reloading or typing another address shows the browser's own dialog, with
  its own words, while a form is unsaved. The browser's Back button inside the app is not
  guarded: Next gives a page no way to cancel a client-side history move (docs/review-list.md).
- Nothing of this on Results, Projects or Settings, and nothing while no form is unsaved: the
  guard is a no-op then, and outside the signed-in shell (the admin area) too.

Rejected:
- A confirm dialog on the click (window.confirm): it would let the PM leave and lose the
  text with one key, and its words cannot be styled or named per card.
- Autosaving the setup forms: Mihai asked for the guard; the forms keep their Save.
- Shaking the whole page: the cards are the thing to fix, so they move.

Tests: src/lib/unsaved.test.ts (the registry, 8 tests); e2e/unsaved-guard.spec.ts (Build:
type in the Intro, click Share, stay with the banner and the label, Discard, type, Save,
click Share, reach Share). Mihai checks the shake on his PC and the leave dialog in his
browsers.
