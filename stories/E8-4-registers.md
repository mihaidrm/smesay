# E8-4 Registers: different priority, disagree, unclear, missing items

User: a PM reading the reasons
Status: built
Outcome: four registers, sortable by any column and narrowed by the page's filter bar,
each answer row linking to its item (a suggested missing item has no action, acceptance 4).

Amended 2026-10-03 (design note 40): the names, the sort on every column, the filter bar.

Amended 2026-10-04 (decision 0044, after the audit; docs/review-list.md): acceptance 2's
sentence form became columns that read across (respondent, value, reason), so every part
sorts; the landing page no longer quotes the sentence. The disagree register sits under the
different-priority register, not beside it, so both keep their columns at 1440.

Amended 2026-10-07 (decision 0062, design note 114): the tab's name carries the two
registers' counts side by side, "Different priority 7 · Disagree 3", never their sum; the
plain name "Different priority and Disagree" stays for the detail's Back link and a failed
load's banner. The sample's disagree register holds 3 rows (Lukas on CL-05 joins Priya's two).

## Acceptance criteria
1. "Different priority and Disagree" tab: the different-priority register (item, respondent,
   role, proposed, their value, reason) and, under it, the disagree register (item,
   respondent, role, reason; decision 0014), each with its own count in its heading.
   Questions and gaps tab: the unclear register (item, respondent, role, question) and the
   missing-item register (text, suggested area, suggested value, respondent, role).
2. Rows read across their columns: the respondent (named as on the Responses tab), their
   role, the value and the reason or question; values use the instrument's labels (E5-2).
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
One query for a tab's answer registers and one for the missing items, scoped by workspace and instrument, taking the ResultsFilter of
E8-1; the sort is a whitelist of column keys.

Built 2026-10-04 (design note 60, decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/registers-tab.tsx: the two
  tabs with their two registers each, the disagree register under the different-priority one,
  from src/db/queries/results.ts registers.answers (one query for a tab's answer registers)
  and registers.missing (one for the missing items), the page's selection.
- Acceptance 2: a row reads across its columns, respondent then what they say and why;
  values and proposals use the instrument's labels; a respondent is named as on the
  Responses tab; one who has not submitted is marked "Not submitted", one who changed answers
  after Submit "Changes not submitted again" (E7-6).
- Acceptance 3: every column sorts both ways, the sort in the URL (item, respondent, the
  role field, proposed, their value, reason or question; for missing items the text, area
  and value); the value columns sort in the scale's order (Must, Should, Could, Not needed),
  not by the stored code; the header marks the column the rows are sorted by; the filter bar
  narrows every register. An empty register reads "None under this filter." or, with no
  filter, "None yet."
- Acceptance 4: a row's item opens its detail (E8-5), the item in the URL; a missing-item row
  has no action.
- Acceptance 5: the headings' counts are the strip's and the tab's (the same selection);
  src/db/queries/results.test.ts checks them under five filters, every sort both ways, the
  marks, another workspace, and 600 generated responses under 500 ms.
- Playwright: e2e/results-registers.spec.ts.
