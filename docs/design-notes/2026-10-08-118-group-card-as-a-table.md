# 118 The landing's group card: a table of people, not "2 of 2", 2026-10-08

Mihai, 2026-10-08, with the card's bars pasted: "I still have 0 clue what these numbers mean
here - as i said you assume everyone understands this sample data but nobody does".

What was wrong: each bar ended in "2 of 2", "0 of 3", "0 of 2", "1 of 3" under two headings
("Want a different priority", "Say it is not needed"). Nothing on the card said that the
numbers count people, that "2" is the size of Sales and "3" the size of everyone else, or which
item the card is about. A reader had to know the sample to read it.

Decided:
- The card names the item first: Item CL-04, "Expenses over the policy limit are flagged
  before they reach the approver." You proposed Should. The headline stays one sentence (Sales
  wants it as a Must; everyone else is fine with Should).
- The counts are a table with its rows and columns named: caption "How the 5 people who
  answered split on this item, by role"; columns Their answer, Sales (2 people), Everyone else
  (3 people); rows Agree with Should (0, 2), Want a different priority (2, with "both say Must"
  under the number, 0), Say it is not needed (0, 1). Each column adds up to its group, so "of" is not needed. The two
  disagreement rows stay separate (decision 0062). The numbers are the seed's (src/db/seed/
  sample.ts, item 4: Ioana and Tom change to Must, Dana and Lukas agree, Priya not needed; Sam
  has not submitted).
- No bars: with two groups and three answers the table reads faster than lengths, and a bar
  needs a number next to it anyway.
- Phone (390): the table has one text column and two number columns, 346 px inside the card's
  padding; the group size and "both say Must" sit on a second line under their number, and the
  number columns carry 16 px of padding on their left, so the headers do not touch.
- The same change on the LandingF board and in docs/copy/landing.md.

Not changed: the product's own "Where groups disagree" view (conflict-view.tsx) prints "agree
of answered" per group next to a bar, with a legend line per group; Mihai has not pointed at
it. A row in docs/review-list.md asks whether it should read like this card.
