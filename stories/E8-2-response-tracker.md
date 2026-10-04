# E8-2 Response tracker: who, status, progress, submitted date, source

User: a PM chasing the people who have not answered
Status: ready
Outcome: one table of every respondent, sorted by any column, narrowed by the page's filter
bar.

Amended 2026-10-03 (design note 40): the filters moved to the page's filter bar (E8-1,
acceptance 3), which this tab honours like every other.

## Acceptance criteria
1. Responses tab (PM app board): name, role (and every other respondent field as a column,
   up to the 8 of E5-1), status (Invited, In progress, Submitted, with "changed after
   submitting" from E7-6, which tells "changes not submitted again" (changedSinceSubmit:
   submitted, signed_off false) apart from "submitted again" (changedAfterSubmit and signed
   off)), progress "[N] of [M]" against the respondent's visible set (E5-4),
   submitted date, source (Public link or Personal invite), reminders sent, and the count of
   answers with a reason or comment.
2. The page's filter bar (E8-1) narrows the rows: a respondent is listed when at least one
   of their answers matches the answer-kind and comment filters, and when their fields match
   the field filters; the tracker adds no filter of its own.
3. Public-link responses with no name field show "Anonymous [N]" in order of first answer.
4. In-progress rows show the count answered; their answers count in the numbers while the
   include-unsubmitted switch is on (E8-1, decision 0030).
5. Sort by any column, ascending and descending, the sort in the URL; 500 rows render under
   500 ms from the SQL query (measured in a test against generated rows, decision 0004 keeps
   it to one measurement).
6. Playwright: filter the seeded project by role Sales in the filter bar, see three rows;
   sort by submitted date and see the order flip.

## Out of scope
- Exporting the tracker: E10-1's answers CSV carries the same columns and the same filter.

## Open questions
- None.

## Technical notes
One query with the respondent fields unpacked from response.fields (jsonb) by key; the
visible-set count per respondent comes from src/lib/perspectives.ts in SQL form (a lateral
count over items filtered by perspectives). The sort is a whitelist of column keys, never a
string from the URL in the query.
