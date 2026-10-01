# Design note 08: landing page D, the simple one, 2026-10-01

Mihai, after notes 06 and 07: find something real simple that anyone would understand.

## The idea

Three pictures and three captions, before any explanation: a spreadsheet, a phone, a results
list. Numbered 1, 2, 3 with an arrow between them. Anyone who has ever been emailed a spreadsheet
understands the first picture, and the other two follow from it. The headline says the same
thing in one sentence: "Send your requirement list as a link. Get back who agrees, and why."

Below the strip, the same three steps once more, one screen each, with one picture and a short
paragraph. Then three plain answers to "why not a survey form", who it is for, pricing, a
closing panel, a footer that expands SME once.

What was dropped from pages B and C: the live hero panel, the reasons band, the six output
cards, the comparison table, the auto-advancing stepper. They explained more, and that was the
problem. Page D explains less, in order.

## Motion

Hero text rises in on load, then the three frames appear one after another with half a second
between them, so the eye reads them in order. The results frame fills its bars one by one on a
loop. Every block below reveals on scroll. Nothing else moves.

## Where it is

Board "Landing page D (simple)" on the canvas, 1440 by 5,152 px. Source:
docs/design-notes/prototype-01/LandingD.dc.html. Rendered at 1440 px, no overflow.

Pages A, B and C stay on the canvas for comparison. Recommendation: D. If D is right, the scroll
story from note 07 is not needed; its best part (one object followed through) is already in the
three frames.

## Change the same day

Mihai: answering on a phone is an extra, not a selling point. Agreed, with one addition: the
phone is the proof that busy experts finish, which is where validations usually fail. So the
phone moves from the frame 2 caption to one line under step 2. Frame 2 now reads "They answer,
and say why". The hero sentence ends with "You get reasons, not votes."

## Page E, the same day

Mihai: B's layout, D's story, and several kinds of output. Page E: B's hero (headline left, the
answers-arriving panel right) and auto-advancing three-step panel; D's three pictures, with the
third now the to-do list and sign-off since the hero already shows answers arriving; a gallery of
six outputs in one section (agreement by area, where groups disagree by role, confidence at
sign-off, the disagreement register, the sign-off record, the AI to-do list) plus the four export
types; the reasons band; who it is for; pricing as one card, free while validating (decision
0008); closing; footer. B's separate results chart is dropped so no chart appears twice.
Board "Landing page E (B layout, D story, outputs)", 1440 by 5,192 px, rendered at 1440 px.
Claude's recommendation: E replaces A, B, C and D.
