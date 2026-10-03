# 0044 Claude decides the open points until Mihai's full review, 2026-10-03

Mihai: "I will do a full round of testing when all epics are done and I will give feedback
then. Until then I want you to just do whatever you consider would be best for the project
and the user, best practices; write all things somewhere and we sort them when I do the
full review. Until then you only ask me if absolutely necessary."

Decision: from this day until the full review, Claude takes every open design, copy and
story decision itself, with the recommendation it would have made, and records each one
in docs/review-list.md (one row: date, what was decided, where it lives, what to look at
in the review) and, when it changes a rule, in docs/decisions/. Claude asks Mihai only
when a step cannot go on without him: an account, a payment, a secret, a legal page, a
spend (decision 0039), or two of his earlier decisions in conflict. Decision 0007 stays
for those cases. Mihai's acceptance of each story moves to the full review.

The eight questions open on this day are decided here, with the recommendations of design
notes 39 and 40:
1. The first-project path shows at the top of the Projects page.
2. Rescue tips exist for the three stuck states, with the thresholds as written.
3. The sample walkthrough has three tips.
4. The robot has no name in R1; the copy says "the guide".
5. A donut is allowed for a whole area and the whole list, never per item.
6. The `change` kind is called "Different priority" on screen.
7. Each user picks their own tiles on Results.
8. The tile catalogue of E8-1 stands as written.

Consequences: CLAUDE.md's decisions rule carries this mode; docs/context.md's "Waiting on
Mihai" becomes the review list; the open-question lines of E8-1, E8-3, E8-4, E15-2, E15-3
and E15-4 and the question sections of notes 39 and 40 point here.
