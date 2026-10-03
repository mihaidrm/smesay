# E8-4 Registers: different priority, disagree, unclear, missing items

User: a PM reading the reasons
Status: ready
Outcome: four registers, sortable by any column and narrowed by the page's filter bar,
each row linking to the item or to the suggested new item.

Amended 2026-10-03 (design note 40): the names, the sort on every column, the filter bar.

## Acceptance criteria
1. "Different priority and Disagree" tab: the different-priority register (item, respondent,
   role, proposed, their value, reason) and, beside it, the disagree register (item,
   respondent, role, reason; decision 0014), each with its own count in its heading.
   Questions and gaps tab: the unclear register (item, respondent, role, question) and the
   missing-item register (text, suggested area, suggested value, respondent, role).
2. Rows read as the landing page promises: "[Name], [Role] says [Value]: [reason]" or "marked
   it Unclear: [question]" (docs/copy/landing.md); values use the instrument's labels (E5-2).
3. Sortable by every column, ascending and descending, the sort in the URL; the page's
   filter bar (E8-1) narrows every register, so "only the ones that left comments" is the
   comment filter and "only Finance" is the field filter, with no filter of the tab's own.
4. Each row links to the item detail (E8-5). A missing-item row has no action in R1: the
   suggestion is read here and in the CSV (decision 0031).
5. Counts in the tab labels and the register headings equal the register row counts and the
   headline tiles (E8-1) under the same filter.

## Out of scope
- Replying to a question from the dashboard: R2 ("respondent questions answered from the
  source", docs/plan-steps.md Phase 5).

## Open questions
- None. "Add as item" is out of R1 (decision 0031). The name of the `change` kind is design
  note 40's question 2.

## Technical notes
One query per register, scoped by workspace and instrument, taking the ResultsFilter of
E8-1; the sort is a whitelist of column keys.
