# 0052 Every respondent step sits in the card, 2026-10-05

Mihai, on a screenshot of About you on a desktop after decision 0051: "the way you fixed the
issue here - was great - please apply the changes everywhere on every step where we have
similar issues, and also update the design".

The chapters and the Wrap up still had the old desktop layout: a full-height column with no
card, "Powered by" above the footer, and the footer's buttons on the left. Done and nothing
to rate were in the card, but their buttons sat on the left under the text.

Decision: every respondent step uses the frame of decision 0051
(src/components/respondent/frame.ts). From a 576 px column:
- The chapters are a centered card 1000 px wide and the Wrap up one 760 px wide. The columns
  are 1032 and 792 px so the card keeps 16 px from the window's sides. The header, the chapter
  row and the progress bar sit in the card. The item cards stay on the ground colour inside
  it, so a white card never sits on a white card.
- The footer is the card's bottom band. Back and Continue, or Back and Submit, are centered
  as a pair, and the dark button is 320 px wide. The note ("[N] of [M] still to rate here.",
  "Still needed: ...") sits centered under the buttons, as Start's hint does.
- Done and nothing to rate move their buttons into the same bottom band, centered.
- The passcode page's Continue is 320 px and centered.
- "Powered by" is under the card, the last thing on the page, on every step.

On a phone the steps keep their layout. The two changes there are that "Powered by" is now
the last line, under the footer, and that Done's buttons are in a band at the bottom.

Consequences:
- frame.ts gains FRAME_ACTIONS, FRAME_PRIMARY and FRAME_LINE, used by about-you.tsx,
  chapter-screen.tsx, wrap-up.tsx, passcode-form.tsx and respondent-app.tsx.
- The chapter row and the banners line up with the card's 32 px sides.
- docs/design-system.md (Respondent columns), decision 0051 and stories/E7-1, E7-4, E7-5 and
  E7-6 are amended.
- e2e/respondent-start.spec.ts measures the chapter card and the Wrap up card on a desktop.
- The "Respondent as built" board's screenshots are retaken.
