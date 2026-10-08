# 117 The landing page for a stranger, 2026-10-08

Mihai, 2026-10-08, on the results card of "What you get back": "i like the idea of this
section, but it needs to be alot more clearer what it says - even for me its a bit confusing
and unclear and i dont understand what i am looking at. I think you need to do a full pass on
landing page to make sure evens a complete stranger understands everything - like if i go show
my dad this, he understands what the product is doing".

What was wrong, read as that stranger: the headline spoke of "the list" without saying what
list; "experts" read as consultants; the page used the Marlow example everywhere (CL-04, Should
have, the policy flags, Sales) and never said whose example it was; the results card showed
five numbers, three chips and a chart with no sentence saying what they were; the cards beside
it had labels written as slogans ("See where the list is weak", "Walk into the meeting with the
decisions listed", "Numbers that hold up").

The rule for the pass: every section says what you are looking at, the example is named once
at the top, and no product word appears without its plain meaning beside it the first time.
The copy is in docs/copy/landing.md; the board and the page carry the same strings (decision
0017); the metadata description says the same as the hero.

Decided, section by section:
- Hero. The chip names the example: "Example on this page: a company choosing an expense
  tool". The headline says what the list is: "Send your requirements as a link. See who
  agrees, and why." The paragraph says who the experts are and what they do: "You wrote down
  what a new tool or process must do. SMEsay turns that list into a link. Your experts, the
  people who know the work, open it and answer item by item: agree, a different priority, not
  needed, or a question. You see where they agree, where they do not, and why." The four
  answers are the four kinds the product counts (decision 0014, decision 0062), in the words
  the dashboard uses. The live card reads "Your proposal" and the agreement chip "30 answers
  from 5 of 7 experts", so the 5 of 7 of the tiles has its meaning before the visitor reaches
  them.
- Three steps. The title stays. The line beside it and the three cards say what each step does
  in a plain sentence: a row becomes an item, the AI sorts and rewrites and the PM checks, the
  experts open the link on any device with no account (the phone stays named in Questions
  only, Mihai's call of 2026-10-04, design note 53).
- What you get back. The line beside the title says what the section shows. The results card
  is labelled "The dashboard, as the answers arrive"; its line reads the chart for the visitor
  ("One bar per item: green agreed, yellow a different priority, grey not needed, purple a
  question. The percentage is the share that agreed with your proposal."); one sentence under
  the tiles says what the five numbers are ("7 experts were asked and 5 have submitted. Of
  their 30 answers, 18 agree with your proposals (60%), 7 want a different priority, 3 say not
  needed and 2 asked a question."); the "+ Choose tiles" chip leaves the page, since it meant
  nothing to a visitor; the line under the chart names the two filters and says the three
  switches are views of the same answers. The group card is "See which group disagrees, and
  why" with a title that states the split in words ("Sales wants the policy flags as a Must;
  everyone else is fine with Should.") and row headings that say what the bars count ("Want a
  different priority", "Say it is not needed"). The to-do card is labelled by what it is ("A
  to-do list, written by AI from the answers") and its lines say "From 2 answers, each one
  cited". The export card says what the two files are for.
- Questions. A first question, "Who is it for?", names the people the product is for and
  expands SME once more, in the place a visitor looks for it. The questions are eight.
- Unchanged: the Compare section (its sentences already compare in plain words), Pricing, the
  footer, the question bubble, the fragments' numbers (the seed's, decision 0005).

Not done, recorded in docs/review-list.md: the Shape card's "Your sheet / Shaped" switch and the
Compare section's six points were left as they were; a first user's read decides whether they
need the same treatment.

Test: e2e/landing.spec.ts reads the new headline, the sentence under the tiles and eight
questions; the rest of its checks are unchanged.
