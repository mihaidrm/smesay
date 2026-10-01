# E8-2 Response tracker: who, status, progress, submitted date, source; filters

User: a PM chasing the people who have not answered
Status: ready
Outcome: one table of every respondent with filters by respondent field and by perspective.

## Acceptance criteria
1. Responses tab (PM app board): name, role (and every other respondent field as a column,
   up to the 8 of E5-1), status (Invited, In progress, Submitted, with "changed after
   submitting" from E7-6), progress "[N] of [M]" against the respondent's visible set (E5-4),
   submitted date, source (Public link or Personal invite), reminders sent.
2. Filters: any respondent field (dropdown fields as select, text fields as contains), status,
   perspective (E5-4). Filters are in the URL so a filtered view can be shared within the
   workspace.
3. Public-link responses with no name field show "Anonymous [N]" in order of first answer.
4. In-progress rows show the count answered and are not counted in agreement (E8-1 note).
5. Sort by any column; 500 rows render under 500 ms from the SQL query (measured in a test
   against generated rows, decision 0004 keeps it to one measurement).
6. Playwright: filter the seeded project by role Sales, see three rows.

## Out of scope
- Exporting the tracker: E10-1's answers CSV carries the same columns.

## Open questions
- None.

## Technical notes
One query with the respondent fields unpacked from response.fields (jsonb) by key; the
visible-set count per respondent comes from src/lib/perspectives.ts in SQL form (a lateral
count over items filtered by perspectives).
