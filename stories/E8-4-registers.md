# E8-4 Registers: different priority, disagree, unclear, missing items

User: a PM reading the reasons
Status: built
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
- None. "Add as item" is out of R1 (decision 0031). The `change` kind is "Different
  priority" (decision 0044, item 6).

## Technical notes
One query per register, scoped by workspace and instrument, taking the ResultsFilter of
E8-1; the sort is a whitelist of column keys.

Built 2026-10-04 (decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/registers-tab.tsx: the two
  tabs with their two registers each, from src/db/queries/results.ts registers.answers and
  registers.missing (one query per register, the page's selection).
- Acceptance 2: a row reads across its columns, respondent then what they say and why;
  values and proposals use the instrument's labels; a respondent who has not submitted is
  marked "Not submitted"; the respondent's name is the Responses tab's (a personal invite's
  name or email when the field is empty, "Anonymous [N]" on the public link).
- Acceptance 3: every column sorts both ways, the sort in the URL (item, respondent, the
  role field, proposed, their value, reason or question; for missing items the text, area
  and value); the filter bar narrows every register.
- Acceptance 4: with E8-5 (the item detail); a missing-item row has no action.
- Acceptance 5: the headings' counts are the strip's and the tab's (the same selection);
  src/db/queries/results.test.ts checks them under five filters.
- Playwright: e2e/results-registers.spec.ts.
