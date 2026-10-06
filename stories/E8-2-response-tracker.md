# E8-2 Response tracker: who, status, progress, submitted date, source

User: a PM chasing the people who have not answered
Status: built
Outcome: one table of every respondent, sorted by any column, narrowed by the page's filter
bar.

Amended 2026-10-03 (design note 40): the filters moved to the page's filter bar (E8-1,
acceptance 3), which this tab honours like every other.

Amended 2026-10-04 (decision 0044, after the audit): acceptance 3 numbers by start (the
response row is made at Start, before the first answer); acceptance 5 times the query, as
the test does.

Amended 2026-10-06 (E5-7, design note 100): under Names hidden and Anonymous every row reads
"Anonymous [N]", numbered by start across all the validation's links; the columns are
Respondent, Status, Progress and With a reason or comment (no field, no Submitted, no Source,
no Reminders, and no sort by them); an invitee who has not started has no row. Amended again
2026-10-06 after the audit: the tab follows no field or perspective filter under the two
levels (a line says why); under Names hidden the columns are Respondent and With a reason or
comment only, in the order of the numbers, with no status filter; no row fades on a live
update. Amended 2026-10-06, decision 0058: under the two levels the numbers follow a fixed
order (md5 of the response id and the instrument id), not the start, since Share shows who
started when; under Anonymous there is no Progress column and no sort by progress, and under
Names hidden no "Not answered" filter.

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
3. Public-link responses with no name field show "Anonymous [N]" in the order they started.
4. In-progress rows show the count answered; their answers count in the numbers while the
   include-unsubmitted switch is on (E8-1, decision 0030).
5. Sort by any column, ascending and descending, the sort in the URL; the SQL query for 500
   rows returns under 500 ms (measured in a test against generated rows, decision 0004 keeps
   it to one measurement).
6. Playwright: filter the seeded project by role Sales in the filter bar, see three rows;
   sort by submitted date and see the order flip.

## Out of scope
- Exporting the tracker: E10-1's "People" file carries the tab's columns, names each person
  as the tab does and takes the same filter (E10-1, acceptance 3, amended 2026-10-04).

## Open questions
- None.

## Technical notes
One query with the respondent fields unpacked from response.fields (jsonb) by key; the
visible-set count per respondent comes from src/lib/perspectives.ts in SQL form (as built: one
grouped join of the people with the items they see, not a count per person). The sort is a whitelist of column keys, never a
string from the URL in the query.

Built 2026-10-04 (design note 60, decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/responses-tab.tsx and
  tracker.people in src/db/queries/results.ts: name, every other respondent field, status
  (Invited, In progress, Submitted, with "Changes not submitted again" or "Submitted again"),
  progress (the complete answers to the items the person sees, as the respondent's own count),
  submitted date, source, reminders (None on the public link), the answers with a reason or
  comment that count under the switch (the column adds up to the strip's tile). A personal
  invite with an empty name field shows the invite's name, else its email.
- Acceptance 2: the people are E8-1's selection (the same SQL head), so the tab and the strip
  always agree; the tab adds no filter of its own.
- Acceptance 3: "Anonymous [N]" numbers the instrument's public-link responses by when they
  started, before any filter and whatever the names, so no filter and no name added later
  moves a number (a named response holds its number unseen, so numbers can skip).
- Acceptance 4: in-progress rows show their count; their answers count in the numbers while
  the switch is on (E8-1); the rows are listed whatever the switch. The In progress pill is
  the row's "not submitted" mark of E8-1, acceptance 7.
- Before the first answer Results shows E8-1's empty state, so the tab is not reached; the
  Share page's invite list (E6-2, acceptance 4) shows who was invited and their status.
- Acceptance 5: every column header sorts both ways (sort and dir in the URL, aria-sort on
  the sorted header only), mapped to SQL from the tab's own list; src/db/queries/results.test.ts
  times the query for 500 generated people under 500 ms.
- Acceptance 6: e2e/results-responses.spec.ts.
