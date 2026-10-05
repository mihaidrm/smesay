# Design note 99: the chapter card reworked, and the slide between chapters, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 under decisions 0044 and 0056, from Mihai's
screenshot of a chapter on a desktop in dark mode. Design note 98 (the PM's setting for when a
reason is required) answers the eighth point of the same message.

## What Mihai asked

1. "Comment and details share the same box - its maybe a bit confusing - i would move the
   details above the rating pill and make it visible by clicking a view more button while
   keeping the comment logic as it is."
2. "the CL-01 having the ID there in that form might be a bit confusing - maybe add it as a
   title above the summary of each card and say something like requirement CL-01"
3. "Would be super cool to have like a swipe animation or something similar when moving
   through chapters, nothing too obnoxious"
4. "i have different heights between the 2 cards - i really wanna avoid this"
5. "Instead of saying Why X and not Y - lets make something more generic like - Could you tell
   us why you think the priority should be different?"
6. "there is a "Say why." text bottom right with seems like its condescening - and maybe its
   not needed cause already added above"

## What was decided

- The line above the summary reads "Requirement [REF]" at 12/16 weight 600 in muted, the
  reference itself no longer in mono, since it now reads as part of a sentence. An item with
  no reference has no line. "Requirement" is the word for every item: SMEsay's lists are lists
  of requirements (the landing page, the terms).
- When the item has details, View more sits under the summary, opens the details in place
  above the rating row, on the ground, and turns into View less. While open, the summary shows
  whole too, since the details are where the clamped part used to be read. The details no
  longer scroll inside a fixed slot, so the scrolling region and its name ("Details: [ITEM]")
  are gone.
- Under the rating row there is one box at most, the reason or the comment, as before. "+
  comment" stays in the footer; the footer no longer has Details.
- The card has no fixed height. It fills its grid cell, CSS grid stretching the items of a row
  to the tallest (developer.mozilla.org/docs/Web/CSS/align-items), and its footer sits at the
  bottom, so the two cards of a row are always the same height, whatever opens in either. The
  fixed 260 px frame (decision 0018) could not hold both an open details block and a box, so
  it went; cards in different rows can differ.
- The reason box over a value other than the proposal asks "Could you tell us why you think
  the priority should be different?" with MoSCoW, "the fit" with 1 to 5 fit, and "it" with
  keep, change, drop, where the value is not a priority. The prompts for Not needed and Unclear
  stay.
- The card's note says nothing while a reason or a question is missing; it still says Not
  rated yet and Saved. The Wrap up's Still to finish list keeps naming what is missing, now as
  "Reason not written yet" and "Question not written yet", in the same form as "Not rated yet".
- The slide: a move to another chapter, to another item on the one-item layout, or to the Wrap
  up brings the new content in from 24 px on the side the respondent moved towards and fades
  it in over 240 ms (cubic-bezier 0.2, 0.8, 0.2, 1, the design system's ease-out); the header,
  the chapter row and the footer stay still. The direction comes from the screens' order, so
  Continue, Back, a chapter pill and the browser's Back all agree; the first screen does not
  slide. Nothing moves under reduced motion. The content is clipped sideways so a phone never
  shows a sideways scrollbar during the 240 ms.

- From the audit of the same day: with no visible note, a screen reader still hears what the
  answer lacks ("Reason not written yet", the Wrap up's words, in a line only it reads) and the
  box carries aria-required; View more is named with its item for screen readers; on the
  one-item layout the new Previous or Next item button takes the focus after a move, since the
  pressed one is remounted for the slide; the Wrap up's slide moves an inner block, so the clip
  holds it; long words in a chapter's title and intro and in a summary wrap, so the clip never
  hides text; Go to from the Wrap up focuses the rating row, not View more; axe in the
  accessibility test waits for the slide to end.

## Where

src/components/respondent/item-card.tsx, chapter-screen.tsx and wrap-up.tsx (data-slide),
src/app/r/[token]/respondent-app.tsx (the direction), the keyframes at the end of
src/app/globals.css, RESPONDENT_COPY in src/lib/respondent-rules.ts. The Build preview and the
visitors' sample use the same card. Docs: docs/design-system.md (Rating row), docs/copy/app.md
and errors.md, stories E7-2 (amended 1, 2, 3, 6) and E7-4 (acceptance 7 added). Boards:
Respondent and RespondentDesktop (and respondent-generator.py, which writes them, and
respondent-sim.js, whose checks pass), RespondentV2, and the Respondent as built screenshots.

## Checked

e2e/sample-instrument.spec.ts, "the sample's cards": "Requirement CL-01", the details hidden,
then shown above the rating row by View more, the two cards of the row the same height before,
with the details open and with the reason box open, the generic question, no note, and
data-slide "next" after Continue and "prev" after Back. respondent-rate, respondent-a11y (View
more by the keyboard, axe with the details open) and build pass with the new note rules.
