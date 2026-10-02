# E5-2 Scoring method templates: MoSCoW with the proposed value, 1 to 5 fit, keep change drop

User: a PM choosing how experts rate
Status: ready
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
   are disabled with "Published instruments keep their method. Build a new instrument to
   change it.").
5. A unit test maps every (method, shown, picked value) to the AnswerKind and value stored.

## Out of scope
- Methods beyond the three: not in R1.

## Open questions
- None.

## Technical notes
instrument.method, show_proposed (docs/schema.md); labels in a new jsonb column
`scale_labels` (migration 0002, shape ScaleLabels in INTERFACES.md). The mapping function in
src/lib/scoring.ts is shared with E7 and E8.
