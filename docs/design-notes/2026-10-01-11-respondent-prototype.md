# Design note 11: respondent prototype finished, phone and desktop, 2026-10-01

Made in the Claude Code cloud session of 2026-10-01 (plan step 1.2, decisions 0014 and 0015).
Nothing external was looked at. Source: docs/design-notes/prototype-01/Respondent.dc.html (phone,
390 by 844) and RespondentDesktop.dc.html (desktop, 1440 by 900), both generated from
respondent-generator.py so the two never drift. The desktop board is the same flow in a 640 px
column under a full-width header.

## What changed against note 03

1. Four answers per item (decision 0014): Agree, Change the priority (pick another value plus a
   mandatory reason), Disagree (mandatory reason, prompt "What should it say instead, or why is
   it not needed?"), Unclear (mandatory question).
2. Rate-blind mode: the proposed value is hidden; the respondent picks Must, Should, Could or
   Won't directly, which counts as agree, or Disagree or Unclear.
3. Three layouts: one item per screen (default), one area per screen, one long page. The
   header shows "2 of 6", "Area 1 of 3" or "4 of 6 answered"; Next becomes "Next item", "Next
   area" or "Continue"; the note under the button says what is left on the screen.
4. Personal link: a "Welcome back, Ioana" screen with name and role set by the team, the count
   of items answered last time, and Continue, which lands on the first unanswered item.
5. Closed page: the close date, what happened to the respondent's answers (submitted,
   partial, or not started), and a contact placeholder.
6. Revoked page: the link is inactive, nothing from this visit was saved, ask the team.
7. The summary counts agreed, changed, disagreed and unclear. Disabled buttons are the real
   button at 40 percent (Brand 05), not grey on grey.

## Prototype controls

A dashed strip at the bottom of both boards, not part of the product, cycles the layout, the
proposed value (shown or hidden) and the link state (open, personal, closed, revoked). Mihai
uses it on the phone without a properties panel.

## Checks

- Tags balanced and the logic class parses (node --check) on both files.
- The logic was run headless through every screen: landing to item to missing to summary to
  submitted, all four answers, the three layouts, blind mode, the personal link, closed and
  revoked. One defect found and fixed before publishing: the per-screen count used the whole
  list. The template itself renders only in the canvas runtime; Mihai's click-through is the
  first check of it.

## Not in this pass

Autosave to a server, the privacy notice text, the PM's logo from settings (the header shows a
placeholder "M"), the respondent-side theming rules from Brand 06 beyond the ink buttons.
