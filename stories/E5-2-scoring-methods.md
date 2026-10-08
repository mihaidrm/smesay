# E5-2 Scoring method templates: MoSCoW with the proposed value, 1 to 5 fit, keep change drop

User: a PM choosing how experts rate
Status: built
Outcome: switching the method re-renders every card in the preview, and the proposed value
can be shown or hidden.

## Acceptance criteria
1. Build offers three methods (PM app board): MoSCoW (Must, Should, Could, Not needed), 1 to
   5 fit ("no fit" to "fits fully"), keep change drop. The rating row renders per decision
   0018: values as pills, Unclear last; under MoSCoW with the proposed value shown, the
   proposed pill is dashed and captioned "proposed".
2. "Show the proposed value" toggle (decision 0003). Off, respondents pick a value directly
   and the answer is stored as kind `pick` (INTERFACES.md). On, the same value as the proposal
   is `agree`, another is `change`, Not needed is `disagree` (decision 0014, 0018).
3. Custom labels: each value's label can be edited (up to 20 characters); the stored value
   stays the scale's code. Labels appear on cards, in registers and in exports.
4. Changing the method on a draft re-renders every item; answers are not kept across a method
   change, so the method is locked once the instrument is published (the toggle and the method
   are disabled with "Published instruments keep their method and when a reason is required.
   Build a new instrument to change them."; the line named only the method before acceptance 6).
5. A unit test maps every (method, shown, picked value) to the AnswerKind and value stored.
6. (Added 2026-10-05, design note 98; Mihai: "When setting up these things, the PM should be
   able to say when its mandatory to add comment or not".) The Scoring card offers "When a
   reason is required" as three radio cards: When the answer differs (the default and the rule
   before this criterion: a value other than the proposal, Not needed and Unclear need their
   reason or question), Never (the boxes still show; an empty reason or question still counts
   as answered), On every answer (an agreeing answer and a rating need a comment too; the
   comment box opens on its own, labelled "Comment, required"). Unclear's question follows the
   rule. The rule is checked on the server, decides when a card is complete everywhere (the
   card's note, the counts, the Wrap up's gaps, Submit, the reminder's count, the Responses
   tab's Progress), is copied by "Build on version N" and kept by the project file, and is
   locked once published, like the method.

## Out of scope
- Methods beyond the three: not in R1.

## Open questions
- None.

## Technical notes
instrument.method, show_proposed, reason_rule (docs/schema.md); labels in a new jsonb column
`scale_labels` (migration 0013 as built; the note said 0002, shape ScaleLabels in INTERFACES.md). The mapping function in
src/lib/scoring.ts is shared with E7 and E8.

Built 2026-10-03 (design note 41, decision 0044):
- Acceptance 1: the Scoring card on Build (scoring-form.tsx) with the three methods as radio
  cards; the preview panel (since E5-6 the respondent app in an iframe, note 65) shows the
  first chapter's cards with the rating
  row (src/components/respondent/rating-row.tsx, item-card.tsx, shared with E7-2): values
  as pills, Unclear last, the proposed pill dashed and captioned "proposed", the 1 to 5
  scale captioned "no fit" and "fits fully".
- Acceptance 2: the "Show the proposed value to respondents" switch; classify() in
  src/lib/scoring.ts stores `pick` when off or when the item has no proposal, `agree` on
  the proposal, `disagree` on Not needed, Drop or 1, `change` otherwise.
- Acceptance 3: one label per value, up to 20 characters, in instrument.scale_labels
  (migration 0013, ScaleLabels in INTERFACES.md); the stored value is always the code;
  labelFor() gives the word to cards, registers and exports.
- Acceptance 4: a draft changes method freely; isPublished() (a link or an invite exists)
  locks the method, the switch and the labels with the line from errors.md, on the server
  too (the layout on the same card stays editable, E5-3).
- Acceptance 5: src/lib/scoring.test.ts maps every (method, shown, picked) pair; the
  instrument test saves, refuses and locks on the test database.
- Playwright: e2e/build.spec.ts switches to 1 to 5 fit and sees the pills change, renames
  Must to Essential, turns the proposal off and on.

Built 2026-10-05 (design note 98, decision 0044):
- Acceptance 6: instrument.reason_rule (migration 0035_reason_rule, text, default `differs`,
  checked to the three values; every existing row reads `differs`; ReasonRule in
  INTERFACES.md). The cards after the labels on the Scoring card (scoring-form.tsx,
  REASON_RULES_META in src/lib/scoring.ts), saved by saveScoring with the server's check
  (SCORING_ERRORS.badReasonRule; a form that posts none keeps the stored rule; ignored once
  published). textRequired(kind, rule) in src/lib/respondent-rules.ts, with isComplete,
  noteFor, answeredCount, resumeAt, landingOf, gapsOf and tallyOf taking the rule; the
  server's saveAnswer and submitResponse read it from the link's instrument; the SQL twin
  completeSql (src/db/queries/complete.ts) counts the reminder's answers and the Responses
  tab's Progress. The item card opens the comment box for an agreeing answer or a rating under
  On every answer, labelled "Comment, required", with no "+ comment" toggle. buildOnLatest
  copies the rule; the project file carries reasonRule (a file without it reads `differs`).
  The visitors' sample keeps the default. Unit tests: src/lib/respondent.test.ts (every rule
  by every answer kind, the server's complete flag, the SQL count against isComplete),
  src/lib/respondent-submit.test.ts (Submit under On every answer and Never),
  src/lib/instruments.test.ts (save, refuse, copy, lock), src/db/schema.test.ts (migration
  0035 on a row from before it), src/lib/export/project.test.ts (round trip, an older file, an
  unknown rule), src/db/queries/results.test.ts (Progress under each rule).

Changed 2026-10-08 (design note 122): the Scoring card is collapsible, closed on load with
"MoSCoW, proposal shown, a reason when the answer differs, chapters" on its title row (the
method, the switch, the reason rule and the layout); it opens by its title row, one Build
card at a time. e2e/build.spec.ts and e2e/respondent-rate.spec.ts open it first.
