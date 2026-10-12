# 128 The preview marks what the last save changed, 2026-10-12

Mihai, 2026-10-12: "when we save something in the 5 steps (import / shape etc, we need to also
highlight the change in the preview version to make it obvious what is changing". The panel's
preview reloads after every save that changes what respondents get (src/lib/preview.ts), but
the compact view carries no ring (decision 0061) and the full view rings the parts a step owns
whether or not the save touched them, so a PM saw a reload and nothing that said what moved.

Decided:
- The respondent app in preview mode keeps the view it drew last for the project and step in
  the tab's session storage, under a key the preview route gives it. The load a save causes
  compares the two (src/lib/preview-diff.ts) and marks the parts that differ in sun, the
  colour the step's violet rings never use: a card that is new or in another section or
  perspective, the wording of a card (its legend), the rating row of a card whose proposal
  changed or of every card when the scale, the labels, the proposal switch or the reason rule
  changed, the chapter row when the areas, their lines or the layout changed, and the closing
  date in the header. About you and the Wrap up are named in words, since the chapter screen
  does not show them.
- One sentence under the band says the whole of it, in the order respondents meet the parts:
  "Your last save changed the wording on CL-01, the rating row and the chapter row." Up to
  three cards are named by their references; more, or a card without one, are counted.
- The compact view opens on the first card that changed, and its note says "Card 3 of 6, the
  one your save changed." until the person moves to another card or chapter.
- A load that changes nothing (the device toggle, a reload, the first open of a step) marks
  nothing; the full view's tab starts its own session and marks nothing on its first load.
  Session storage that is off means no marks, never an error.

Rejected:
- A snapshot table on the server: a migration, a cleanup and a second read on every render,
  for a comparison the browser can make from what it already holds.
- Marking what the step owns on every save (the step's rings in the compact view too): it
  would not say what changed, which was the ask.
- A mark that fades after a few seconds: a timer in the preview would differ under reduced
  motion and in a test; the mark stays until the next load, which is the next save.

Sources: html.spec.whatwg.org/multipage/webstorage.html (the sessionStorage attribute: one set
of areas per top-level traversable, one per origin, so the frame and the step page share it);
react.dev/reference/react/useSyncExternalStore (the read that agrees between the server's
render and hydration).

Tests: src/lib/preview-diff.test.ts (the diff, the sentence, the compact focus); e2e/build.spec.ts
reads the sentence and the rating row's mark after the scoring save, and the card unmarked.
Copy in docs/copy/app.md (the preview panel rows); the marks in docs/design-system.md.
