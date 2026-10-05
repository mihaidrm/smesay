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
  is 320 px wide. The line that goes with them (the chapter's count, Submit's "Still needed")
  sits centered under the buttons, as Start's hint does.
- "Powered by" and, where shown, the privacy link sit under the card as the last thing on
  the page.

## Why the chapter body keeps the ground colour

The item cards and the Wrap up tiles are white cards with a hairline. Inside a white card
they would only be told apart by the hairline, so the chapter's and the Wrap up's content
area keeps the ground colour. The header, the chapter row and the bottom band are white, as
on About you.

## Why the pair is centered and not just the dark button

Back and Continue are one decision, where to go next. Centering the pair keeps them
together, and Back stays next to Continue. The reading order on the page does not change:
the note comes first in the code, and on a desktop CSS order puts it under the buttons.

## Checked

- e2e/respondent-start.spec.ts at 1440 by 900: the chapter card is 1000 px and centered, with
  Continue at 320 px and the note under it; the Wrap up card is 760 px, with the pair centered
  and Submit at 320 px; "Powered by" is under the card each time.
- The "Respondent as built" board's 1440 and 390 screenshots are retaken.
