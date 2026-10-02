# E7-2 Rate items in the chosen method; reasons and questions are mandatory

User: an expert going through the chapters
Status: ready
Outcome: each card takes one of the four answers through the rating row, and a card does not
count as answered until its reason or question is written.

## Acceptance criteria
1. The chapter screen (respondent board, note 12, decision 0018): title, one-line intro,
   compact cards two columns wide on desktop, one on the phone. A card is a fieldset: the
   reference and item text as legend, the rating row of pills (the scale from E5-2, Unclear
   last; proposed value dashed and captioned when shown), a Details toggle when the import
   carried more text, "+ comment" when a comment is optional.
2. The four answers (decision 0014) through the values (decision 0018): the proposed value is
   Agree; another value is Change with the box "Why [VALUE] and not [PROPOSED]? The team
   reads every reason."; Not needed is Disagree with "Why is it not needed, or what should it
   say instead?"; Unclear with "What would you need to know to rate it?". Rate-blind: the
   value is `pick`, comment optional. Keep, change, drop and 1 to 5 follow the same rule:
   a value equal to the proposal (when shown) is agree, anything else needs a reason.
3. The note under the card says exactly what is missing ("Not rated yet", "Say why.", "Write
   your question.") or "Saved" (docs/copy/errors.md, Respondent answering). A card counts as
   answered only when complete (the respondent board's `complete()` rule).
4. The three layouts (E5-3) render here: chapters, one item per screen with "Item 1 of 2 in
   [AREA]", single page with every area and no chapter row.
5. Typed text is kept when the respondent switches between answers on the same card (note 12,
   finding 4).
6. Playwright: on the sample link, answer one card with Change and a reason, see Saved;
   answer another with Unclear and no question, see "Write your question."

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
