# E5-3 Layout templates: chapters, one item per screen, single long page

User: a PM choosing how dense the respondent journey is
Status: ready
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
