# Design note 93: every respondent step in the card, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 under decisions 0044 and 0052.

## What was decided

Mihai liked the About you card from decision 0051 and asked for the same on every step. The
chapter, the Wrap up, Done, nothing to rate and the passcode page now share one frame
(src/components/respondent/frame.ts):

- A centered card on a desktop: 720 px for the short pages, 760 px for the Wrap up and 1000 px
  for a chapter. Each is 48 px from the top and at least 16 px from the window's sides.
- The actions sit in the card's bottom band. On a chapter that is Back and Continue, on the
  Wrap up Back and Submit, on Done Change my answers. They are centered, and the dark button
  is at least 320 px wide, wider when an area's name needs it. The line that goes with them
  (the chapter's count, Submit's "Still needed") sits centered under the buttons, as Start's
  hint does, and describes the dark button.
- The passcode page keeps Continue under its field, centered. The link's error page and 404
  are the same card.
- "Powered by" and, where shown, the privacy link sit under the card as the last thing on
  the page.

## Why the chapter body keeps the ground colour

The item cards and the Wrap up tiles are white cards with a hairline. Inside a white card
they would only be told apart by the hairline, so the chapter's and the Wrap up's content
area keeps the ground colour. The header, the chapter row and the bottom band are white, as
on About you.

## Why the pair is centered and not just the dark button

Back and Continue are one decision, where to go next. Centering the pair keeps them
together, and Back stays next to Continue.

## Why the chapter's count moved under the buttons on a phone too

On About you and the Wrap up the line sits under the button in the page and describes it for
screen readers. The chapter had its count above the buttons. Moving it under on every size
keeps one order for sight and for screen readers, rather than reordering with CSS on a
desktop only.

## Focus rings in the card

A focus ring offset in the ground colour draws a grey gap inside the white card. Controls in
the card take the white offset from 576 px and keep the ground below it (FRAME_RING_OFFSET).

## Checked

- e2e/respondent-start.spec.ts at 1440 by 900: the chapter card is 1000 px and centered, with
  Back and Continue centered as a pair, Continue at 320 px and the note under it; the Wrap up
  card is 760 px, with the pair centered and Submit at 320 px; "Powered by" is under the card
  each time. At 390 the chapter's note is under the buttons and "Powered by" under the note.
- e2e/share.spec.ts at 1440: the passcode card is 720 px and centered, Continue centered and
  at least 320 px.
- The "Respondent as built" board's 1440 and 390 screenshots are retaken.
