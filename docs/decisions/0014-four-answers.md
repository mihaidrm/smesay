# 0014 Four answers per item, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01, on Claude's recommendation.
Replaces item 1 of design note 03 and item 2 of decision 0009 where they say three answers.

Every item offers the same four answers whatever the scoring method:

1. Agree: with the proposed value when it is shown; in rate-blind mode the respondent picks
   the value and that counts as agree.
2. Change the priority: pick another value, reason mandatory.
3. Disagree: the item is not needed or is wrong as written, reason mandatory. The reason box
   asks "What should it say instead, or why is it not needed?"
4. Unclear: question mandatory.

Dashboard: Disagree is the fifth status in place of "not needed", same grey (#718096), with its
own register beside the disagreement (priority) register, because "drop or rewrite the item" is
a different action from "decide the priority". The AI actions cite both.

Why: a respondent who thinks a requirement is wrong had no button. "Won't have" only exists
under MoSCoW and means not needed, not wrong as written.

Cost: one more button on the phone screen. Accepted.

Also decided the same day: the trademark database search is not run now. The name stays
provisional; the search happens at the launch gate with the domain (decision 0012 amended).

Consequence: the respondent board, the PM app register, the hero example on landing page E and
docs/design-system.md status names change in the next pass on each.
