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
  as a pair, and the dark button is at least 320 px wide (wider when "Continue to [AREA]",
  "Continue to section [N]: [AREA]" since decision 0055, needs it; area names take up to 60 characters). The note ("[N] of [M] still to rate
  here.", "Still needed: ...") sits centered under the buttons, as Start's hint does, and
  describes the dark button for screen readers.
- Done and nothing to rate move their buttons into the same bottom band, centered; the
  sample's dark Start free is at least 320 px too.
- The passcode page's Continue stays under its field, centered and at least 320 px wide.
- The link's error page and its 404 are the same 720 px card; Try again sits in the band.
- Controls inside the card offset their focus ring on the card's white from 576 px and on
  the ground below it.
- The Build preview's desktop frame shows the 1032 px column, so it draws the same 1000 px
  card a respondent sees.
- "Powered by" is under the card, the last thing on the page, on every step.

On a phone the steps keep their layout. The changes there: "Powered by" is now the last line,
under the footer; a chapter's count sits under Back and Continue, as on About you and the
Wrap up; Done's buttons are in a band at the bottom.

Consequences:
- frame.ts gains FRAME_ACTIONS, FRAME_PRIMARY, FRAME_LINE and FRAME_RING_OFFSET, used by
  about-you.tsx, chapter-screen.tsx, wrap-up.tsx, passcode-form.tsx, respondent-app.tsx and
  the link's error.tsx and not-found.tsx; preview-frame.tsx shows the 1032 px column.
- The chapter row and the banners line up with the card's 32 px sides.
- docs/design-system.md (Respondent columns), decision 0051 and stories/E5-6, E7-1, E7-4,
  E7-5, E7-6 and E7-7 are amended.
- e2e/respondent-start.spec.ts measures the chapter card and the Wrap up card on a desktop
  and the chapter's footer on a phone; e2e/share.spec.ts measures the passcode page.
- The "Respondent as built" board's screenshots are retaken.
