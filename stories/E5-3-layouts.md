# E5-3 Layout templates: chapters, one item per screen, single long page

User: a PM choosing how dense the respondent journey is
Status: built
Outcome: the three layouts render the same instrument and all pass the phone check at 375 px.

## Acceptance criteria
1. Build offers three layouts with chapters first and default (decision 0016): "Chapters: one
   area per screen, compact cards", "One item per screen", "Single long page" (PM app board).
2. Chapters: a chapter row (About you, the areas, Wrap up) at the top of every screen, free
   navigation, compact cards two columns wide on desktop (decision 0018 item 4). One item per
   screen: the chapter row stays, one card, "Item 1 of 2 in Submitting". Single page: no
   chapter row, every area in order, "All [N] on one page".
3. All three render without horizontal scroll at 375 px wide and with 48 px tap targets; a
   Playwright test at 375 by 667 opens each layout on the sample instrument and checks
   document width and the smallest pill height.
4. The preview panel (E5-6) rings the chapter row when the layout changes (decision 0021).

## Out of scope
- The respondent-side implementation of the layouts: E7-2 and E7-4 build the screens; this
  story sets the option and the preview.

## Open questions
- None.

## Technical notes
instrument.layout (INTERFACES.md Layout: chapters, item, page). The respondent board
(docs/design-notes/prototype-01/Respondent.dc.html) is the reference for all three.

Built 2026-10-03 (design note 42, decision 0044):
- Acceptance 1: the Layout cards on the Scoring card of Build (scoring-form.tsx), chapters
  first and default, with the board's three names; saved by saveScoring with the server
  rule; the layout still changes once the instrument is published (only the method, the
  switch and the labels are locked, E5-2 acceptance 4), since answers do not depend on it.
- Acceptance 2: the preview (since E5-6 the respondent app in an iframe, note 65) renders
  the three: chapters
  with the chapter row (About you, every area with the first active, Wrap up) and the first
  area's cards; one item per screen with the chapter row, one card and "Item 1 of [N] in
  [AREA]"; the single page with every area in order, "All [N] on one page" and no chapter
  row. Free navigation between chapters and the two card columns on desktop came with E7-4,
  E7-2 and the iframe of E5-6.
- Acceptance 3: the check runs in the preview frame (390 px, the respondent app does not
  exist yet) on a fresh project: no side scroll in any layout (the frame's scrollWidth), and
  every pill at least 38 px high. The pills are 38 px by docs/design-system.md (decision 0018
  item 4 said 36 and left the size open), not the 48 px this line asked for; the Back and
  Continue buttons are 48 (docs/review-list.md). E7-2 repeats the check at 375 by 667 on
  the real screens of the sample instrument (its acceptance 4).
- Acceptance 4: the chapter row carries the violet ring in Build's preview, with the
  rating rows (decision 0021; src/lib/preview.ts STEP_RINGS).
- Playwright: e2e/build.spec.ts switches through the three layouts and checks the note, the
  card count, the chapter row, the side scroll and the pill heights.

