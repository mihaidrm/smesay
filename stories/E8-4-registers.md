# E8-4 Registers: pushed back, disagreed, unclear, missing items

User: a PM reading the reasons
Status: ready
Outcome: four registers, sortable by item or by respondent, each row linking to the item or
to the suggested new item.

## Acceptance criteria
1. Pushed back tab: the priority register (item, respondent, role, proposed, their value,
   reason) and, beside it, the disagree register (item, respondent, role, reason; decision
   0014). Questions and gaps tab: the unclear register (item, respondent, role, question) and
   the missing-item register (text, suggested area, suggested value, respondent, role).
2. Rows read as the landing page promises: "[Name], [Role] says [Value]: [reason]" or "marked
   it Unclear: [question]" (docs/copy/landing.md); values use the instrument's labels (E5-2).
3. Sortable by item and by respondent; a filter by respondent field as in E8-2.
4. Each row links to the item detail (E8-5). A missing-item row has no action in R1: the
   suggestion is read here and in the CSV (decision 0031).
5. Counts in the tab labels equal the register row counts and the headline strip (E8-1).

## Out of scope
- Replying to a question from the dashboard: R2 ("respondent questions answered from the
  source", docs/plan-steps.md Phase 5).

## Open questions
- None. "Add as item" is out of R1 (decision 0031).

## Technical notes
One query per register, scoped by workspace and instrument; the registers share the tracker's
filter component.
