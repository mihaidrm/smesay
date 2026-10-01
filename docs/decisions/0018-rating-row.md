# 0018 The rating row: values as the answer, proposed value marked, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01, from a screenshot he supplied
of a rating row (Must, Should with a "proposed" caption, Could, Not needed, Requirement unclear,
plus a comment link).

1. Each card shows the scale as small pills: Must, Should, Could, Not needed, Unclear. The
   proposed value has a dashed border and the caption "proposed". Tapping it is Agree. Tapping
   another value is Change the priority. Not needed is Disagree. Unclear stays Unclear.
   Decision 0014's four answers hold; they are reached through the values instead of four
   separate buttons. "Wrong as written" is said in the comment.

2. Reasons stay mandatory (decisions 0003, 0014): when the rating differs from the proposal,
   or is Not needed or Unclear, the comment box opens under the card and the card is not rated
   until it has text. On the proposed value the comment is optional, behind "+ comment".

3. Each card has a Details toggle that expands a longer description when the import carried
   one (another column, or the original text). The AI reader version stays the card title.

4. Cards are compact so several fit a screen: 12 px padding, 15 px title, 36 px pills (the
   screenshot's 28 px is too small for a thumb; Mihai can lower it), two columns on desktop.
   The chapter screen scrolls.

5. Wrap up, same day: a tally at the top (agreed, higher priority, lower priority, not needed,
   unclear), then sections for what the respondent suggested: still to finish, higher priority,
   lower priority, not needed, a question. Agreed items are not listed; the tally carries them.

Consequence: respondent boards regenerated; docs/design-system.md gains the rating row; the
landing page and PM app fragments that show answer buttons follow in the next pass.
