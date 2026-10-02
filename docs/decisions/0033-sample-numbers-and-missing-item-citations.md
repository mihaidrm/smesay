# 0033 The seed is the sample's source; where an action cites a missing item, 2026-10-02

Status: part 1 made by Claude on 2026-10-02 while building stories/E1-4, as a consequence of
decision 0018; Mihai can overturn it. Part 2 is a question waiting for Mihai.

1. The seed (src/db/seed/sample.ts) is the one source of the Marlow Group sample; the boards,
   the landing page and the stories follow it. Building it showed that the PM app board stored
   Priya Nair's answer on CL-06 as "changed to Not needed", which under decision 0018 is
   Disagree. The sample is therefore 19 agree of 30 submitted answers (63 percent), 7 changed,
   2 not needed, 2 unclear, 1 missing item, confidence 3.8 (the sign-off record on landing
   page E: Ioana 4, Tom 3, Dana 5, Lukas 4, so Priya 3). There are six personal invites and
   one public-link respondent; the invitee who never opened the link has no response row, so
   the seed holds 6 responses, not the "7 responses" decision 0027 counted. Story E1-4's
   acceptance criterion 1, story E8-1's numbers, the PM app board data, the landing page
   fragment and docs/copy/landing.md were changed to match on 2026-10-02.
2. Question. The fourth sample action ("Consider adding mileage from addresses to Submitting")
   cites a missing item, not an answer. Schema v1 has `insight.cited_answer_ids` only, and
   story E9-1 drops an action whose citations do not exist. Where does an action cite a
   missing item? Recommended: a second column, `cited_missing_item_ids uuid[]`, added in
   migration 0002 with E9-1, and the seed fills it then. Until Mihai answers, the fourth
   sample action is seeded without a citation.
