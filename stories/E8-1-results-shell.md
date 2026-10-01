# E8-1 Results page: headline numbers, tabs, empty state

User: a PM opening Results while the link is open
Status: ready
Outcome: the five headline numbers and the tabs the prototype shows, with an empty state
before the first answer.

## Acceptance criteria
1. Results (PM app board): the headline strip with submitted of invited ("5 of 7"), agreement
   ("67%, 20 of 30"), pushed back, disagreed, unclear, missing items; then tabs Agreement,
   Pushed back (n), Questions and gaps (n), Responses, Actions (n), Export.
2. Empty state before any answer: "No answers yet. The link is [open until DATE / not
   published]. Share it, or open the sample project to see what results look like." with the
   two buttons (docs/copy/errors.md).
3. Loading and error states exist for the strip and every tab (CLAUDE.md, PM side): a
   skeleton for the first load, and a banner naming the tab that failed with Try again.
4. Every number on the strip comes from one SQL query per instrument (src/db/queries/
   results.ts), computed in the database, not in the browser (CLAUDE.md, dashboard rules), and
   reconciles with E10-1's items CSV to the row; the reconciliation test is written here
   against the seed and extended in E10.
5. The sample project shows the same page with the watermark (E8-8).
6. Playwright: open the seeded project's Results, see "5 of 7" and 67%.

## Out of scope
- Each tab's content: E8-2 to E8-6. Live updates: E8-7.

## Open questions
- None.

## Technical notes
Agreement counts only submitted responses (E7-1's recommendation; changes if Mihai decides
otherwise). "Pushed back" is kind change; "disagreed" is kind disagree (decision 0014 keeps
them apart); the Pushed back tab shows both registers.
