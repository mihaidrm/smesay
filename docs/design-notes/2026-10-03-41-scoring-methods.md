# Design note 41: the scoring card and the respondent card in the preview, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 for stories/E5-2, under decision 0044.
Files: src/lib/scoring.ts (the scales, the codes, the mapping), src/app/app/(shell)/projects/
[projectId]/build/scoring-form.tsx and preview-panel.tsx, src/components/respondent/
rating-row.tsx and item-card.tsx, src/components/app/toggle.tsx, migration 0013.

## What was decided

- One file, src/lib/scoring.ts, holds the three scales with their value codes (M, S, C, W;
  1 to 5; K, C, D), the default labels and captions, the words an import may carry for a
  proposed value, and classify(): the mapping from (method, show proposed, proposed code,
  picked code) to the AnswerKind and value stored. Build, the respondent app (E7-2) and
  Results (E8) read it, so the four answers of decision 0014 cannot drift between screens.
- The lowest value of each scale is the disagree answer: Not needed, Drop, and 1 "no fit".
  Decision 0014 names Not needed; the other two follow by position. Listed in
  docs/review-list.md.
- The stored value is always the code; the PM's label is a word over it (ScaleLabels,
  nullable, only the codes that differ from the default). A label is 1 to 20 characters.
- The preview panel gained a screen switch (About you, Items) so Build can show what the
  scoring card changes: the first chapter's cards with the rating row, ringed. The Items
  screen is the respondent card of decision 0018 in its 260 px frame, drawn by the same
  components E7-2 will use; the comment box, Details toggle, Saved note and autosave are
  E7-2 and E7-3. A pick in the preview stays in memory (E5-6, acceptance 4).
- "Published" means a link or an invite row exists on the instrument (E6-1 creates them;
  the sample's come from the seed). The scoring card is then disabled with the line from
  errors.md, and saveScoring() refuses on the server.
- The design system's switch is now one component (src/components/app/toggle.tsx), used by
  the fields card and the scoring card; the mode toggle keeps its own markup for its view
  transition names.
- The method cards are native radios in a fieldset, the chosen one on violet soft with a
  violet border, the focus ring on the card through has-[:focus-visible].

## Checks

- Unit: src/lib/scoring.test.ts (6 tests: every pair of acceptance 5, the proposed words,
  the labels); src/lib/instruments.test.ts gains the save, the refusals and the lock on the
  test database.
- Playwright: e2e/build.spec.ts, the Items screen through two method changes, a label and
  the proposal switch.
