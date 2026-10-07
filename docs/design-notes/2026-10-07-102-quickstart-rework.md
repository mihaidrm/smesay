# Design note 102: the quickstart reworked, 2026-10-07

Made in the Claude Code cloud session of 2026-10-07 for stories/E12-2, under decision 0044,
from Mihai's screenshot of /app/quickstart: the title, a three-line intro, four cards of 30 to
60 words each and a "Then: read the results" card of 55 words.

## What Mihai asked

"this is very much a wall of text - hard to follow - think about this more and rework it to
actually be friendlier and to make sense and to be easy to absorb by people"

## What was decided

- The page is sized for a 20-second read. The intro is one sentence (25 words, down from 41).
  Each step card is the number, the title and two plain sentences of at most 14 words: the
  first says what you do, the second what you get. No bold labels, no "You do:" prefixes: the
  first line is in ink, the second in muted ink, the same on all four cards. The four cards
  hold 107 words in all, down from 184.
- "Then: read the results" keeps its heading (the guide card on Projects, docs/copy/guide.md,
  says the same words) and becomes three bullets: what arrives live, the AI to-do list, the
  exports. 40 words, down from 55.
- Every fact comes from the 2026-10-05 copy; nothing new is claimed. Two things left the page:
  the list of the three rating scales and the tip to add a few words about the project on
  Import. Build shows the scales and Import shows the project field, so the quickstart no
  longer repeats them.
- The intro keeps "about ten minutes" inside the one sentence, since stories/E12-2 acceptance
  3 and the copy file's note still name that claim as the thing Mihai's timed run replaces or
  removes. Recorded in docs/review-list.md.
- Layout, desktop only (decision 0020), max-width 880 as before: the page's blocks sit 32 px
  apart (24 before), the cards are 24 px inside (20 before) and 20 px apart (14 before), the
  number badge is 32 px and the title's line height is 32 px, so the two share one row. Text in
  the cards is 15/24. No new component and nothing drawn (decision 0041).
- The Playwright test keeps its shape (the h1, the five h2s, data-testid="quickstart") and
  counts the four step cards inside the steps list and the three bullets, since the bullets
  are list items too.

## Why

A new product manager reads this page once, between naming the workspace and the first
import. Four cards of up to 60 words ask for a minute of reading before the first click; two lines
per card say the same things in the time it takes to find the button.
