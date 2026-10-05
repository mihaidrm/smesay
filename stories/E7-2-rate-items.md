# E7-2 Rate items in the chosen method; reasons and questions are mandatory

User: an expert going through the chapters
Status: built
Outcome: each card takes one of the four answers through the rating row, and a card does not
count as answered until its reason or question is written.

## Acceptance criteria
1. The chapter screen (respondent board, note 12, decision 0018): title, one-line intro,
   compact cards two columns wide on desktop, one on the phone. A card is a fieldset: the
   reference and item text as legend, the rating row of pills (the scale from E5-2, Unclear
   last; proposed value dashed and captioned when shown), a Details toggle when the import
   carried more text, "+ comment" when a comment is optional. (Amended 2026-10-05, design
   note 99, Mihai: "Comment and details share the same box - its maybe a bit confusing" and
   "add it as a title above the summary of each card and say something like requirement
   CL-01": the legend is "Requirement [REF]" over the summary; the details open with View
   more above the rating row; the two cards of a row are the same height.)
2. The four answers (decision 0014) through the values (decision 0018): the proposed value is
   Agree; another value is Change with the box "Could you tell us why you think the priority
   should be different?" (amended 2026-10-05, design note 99; the fit or "it" for the other
   methods; was "Why [VALUE] and not [PROPOSED]? The team reads every reason."); Not needed is Disagree with "Why is it not needed, or what should it
   say instead?"; Unclear with "What would you need to know to rate it?". Rate-blind: the
   value is `pick`, comment optional. Keep, change, drop and 1 to 5 follow the same rule:
   a value equal to the proposal (when shown) is agree, anything else needs a reason.
3. The note under the card says "Not rated yet" or "Saved" (docs/copy/errors.md, Respondent
   answering); while a reason or a question is missing it says nothing, since the box asks
   (amended 2026-10-05, design note 99; Mihai: the "Say why." note "seems like its
   condescening"; it said "Say why." and "Write your question." before). A card counts as
   answered only when complete (the respondent board's `complete()` rule).
4. The three layouts (E5-3) render here: chapters, one item per screen with "Item 1 of 2 in
   [AREA]", single page with every area and no chapter row. A Playwright test at 375 by 667
   opens each layout on the sample instrument and checks the document width and the
   smallest pill height (E5-3's acceptance 3, moved here from the preview).
5. Typed text is kept when the respondent switches between answers on the same card (note 12,
   finding 4).
6. Playwright: on the sample link, answer one card with Change and a reason, see Saved;
   answer another with Unclear and no question, see no note and the card still incomplete
   (amended 2026-10-05, design note 99).

7. The selected answer pill takes `effectiveAccent()` from the workspace (E2-5, acceptance 3);
   ink when the accent fails (E7-7).

## Out of scope
- Saving: E7-3. Wrap up: E7-5.

## Open questions
- None.

## Technical notes
answer rows (kind, value, reason, comment; INTERFACES.md AnswerKind) with the mapping from
src/lib/scoring.ts (E5-2). Cards are server-rendered with client islands for the row and the
box; the first paint on a phone carries no JavaScript heavier than the island.

Built 2026-10-04 (design note 51, decision 0044):
- Acceptance 1: the chapter screen shows the chapter's name and intro over its cards, one
  column on a phone and two from 768 px (src/components/respondent/chapter-screen.tsx). The
  card is the Build preview's ItemCard, now controlled by the page: fieldset and legend,
  the rating row, the details text in the card's slot (with a Details toggle when a box
  takes the slot), "+ comment" on an answer that takes one
  (src/components/respondent/item-card.tsx). The card is 260 px; with a box in the slot it
  grows so the box keeps two lines and the footer can wrap the server's sentence.
- Acceptance 2: the pick goes to PUT /r/[token]/answers; the server maps it with classify
  (src/lib/scoring.ts) and stores kind, value, reason and comment, keeping the reason only
  when the answer needs one and the comment only when it does not (src/lib/respondent.ts
  saveAnswer, respondent-rules.ts answerFor). The boxes carry the story's prompts.
- Acceptance 3: the note says Not rated yet, Say why., Write your question., or Saved once
  the server has the complete answer and no newer change for the card waits (noteFor); a
  refused answer shows the server's sentence instead. One save per card is in flight at a
  time and the server locks the response row, so the stored answer is the newest (residual
  case in docs/review-list.md). A device whose response is gone (cookie cleared) returns to
  About you with every card not saved, and Start sends the cards again.
- Acceptance 4: the three layouts render on the live link; e2e/respondent-rate.spec.ts opens
  each at 375 by 667 on the test's own published project (the sample link collects
  nothing, docs/review-list.md) and checks the document width and the 38 px pills.
- Acceptance 5: the reason and comment stay in the card's draft whatever the answer; the
  test switches Should, Not needed, Should and keeps the text.
- Acceptance 6: the same test answers Change with a reason and sees Saved, and Unclear with
  no question and sees "Write your question."
- Acceptance 7: the selected pill fills with effectiveAccent(); the test reads the default
  violet. The ink fallback for a failing accent is E7-7's.
- Saving: a change waits 400 ms for the next, then goes out; focus leaving any control and
  the page being hidden send what waits. E7-3 adds the offline queue and its banner.
