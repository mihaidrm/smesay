# E10-1 CSV of answers and CSV of items with aggregates

User: a PM who works in Excel
Status: built
Outcome: CSV files (answers, items with totals, and from E8-1's audit people and missing
items) that open in Excel with correct characters and dates, and whose rows are the
dashboard's numbers.

## Acceptance criteria
1. Export tab (PM app board): "Answers" (one row per answer: respondent, every respondent
   field, item reference, area, item text, proposed value, answer kind, their value, reason or
   question, comment, submitted at, source, perspectives) and "Items with totals" (one row per
   item: reference, text, original, area, proposed value, counts of agree, changed, disagree,
   unclear, not answered, agreement percentage). The answer kind column reads Agree,
   Different priority, Disagree, Unclear or Rated (the rate-blind `pick`; E8-1's name); their value and
   the proposed value are the scale's code with the instrument's label beside it (E5-2,
   acceptance 3: labels appear in exports).
2. UTF-8 with a byte order mark, comma separated, quoted fields, dates as ISO 8601 with the
   UTC offset; opens in Excel with diacritics and dates intact (Mihai checks on his PC; a unit
   test checks the BOM, the quoting of a field with a comma and a newline, and the date
   format).
3. Every number on Results equals the matching CSV row: the reconciliation test from E8-1 and
   E8-3 runs the exports and compares every headline number, every item count and every
   register count to the files. Amended 2026-10-04 (E8-1 audit, docs/review-list.md): the
   tiles that count people and missing items need rows of their own, so the export adds
   "People" (one row per person the filter keeps: status, submitted at, minutes to submit;
   src/db/queries/results.ts people) and "Missing items" (one row per suggestion; results.missing).
   Amended 2026-10-04 (E8-2 check, docs/review-list.md): every file names a respondent as the
   Responses tab does (the name field, else a personal invite's name or email, else
   "Anonymous [N]"; PersonRow who and anon in INTERFACES.md), and "People" adds the tab's
   columns (every respondent field, progress, source, reminders, the answers with a reason or
   comment), so the tab exports through it.
4. Sample project exports carry the watermark in the first row ("Sample data, invented").
5. Downloads are streamed, scoped by workspace, and logged (who, when, what) for E11-2.

## Out of scope
- Excel xlsx output: CSV opens in Excel; xlsx is a candidate for later.

## Open questions
- None.

## Technical notes
One module src/lib/export/csv.ts shared by both files, fed by the same queries as the
dashboard (src/db/queries/results.ts), never by a second computation.

Amended 2026-10-03 (design note 40): every export takes the page's ResultsFilter (E8-1), so
a filtered Results screen exports what it shows and still reconciles to the row; the first
row of a filtered file names the filter. The answer kind column uses the names of decision
0014 as E8 shows them (Agree, Different priority, Disagree, Unclear); the items file's
counts are headed the same way.

Built 2026-10-04 (design note 69, decision 0044):
- Acceptance 1: the Export tab (results/export-tab.tsx) lists Answers, Items with totals,
  People and Missing items, each a download of GET /api/projects/[id]/export/[file] with the
  page's query. Answers: respondent, every field, reference, area, item, proposed value and
  label, answer (Agree, Different priority, Disagree, Unclear, Rated), their value and label,
  reason or question, comment, submitted at, since submitting (Changes not submitted again or
  Submitted again, as the Responses tab marks it), source, perspectives. Items: reference, text,
  original, area, proposed value and label, the five counts, not answered, agreement %.
- Acceptance 2: src/lib/export/csv.ts: the BOM, every field quoted, CRLF, dates as
  2026-10-09T16:30:00+00:00, and a text cell that starts with =, +, -, @, a tab or a line
  break written with a single quote in front so a spreadsheet does not run it as a formula
  (OWASP, CSV Injection); csv.test.ts checks the BOM, a field with a comma, a quote and a
  line break, the formula cells and the date. Excel on Mihai's PC is his check.
- Acceptance 3: src/lib/export/files.ts builds each file from the queries Results reads
  (results.rows with the respondent's columns, agreement.byItem, tracker.people with
  results.people, registers.missing); files.test.ts reconciles every strip number but the
  Actions count (which no file holds) with the files, each item's row (found by its
  reference) with the Agreement tab's counts, not answered and agreement %, and the missing
  register, under no filter, with the switch off and on, under an answer filter, a role filter
  and a name filter. Minutes to submit are whole minutes and the tile is their median rounded,
  so ROUND(MEDIAN(column), 0) in a spreadsheet gives the tile. People and Missing items are there (the E8-1 and E8-2
  amendments); every file names a respondent as the Responses tab does.
- Acceptance 4: the sample's files start with "Sample data, invented"; a filtered file then
  names its filter; a file with the answers not submitted yet then says so. A file with none
  of these starts with its header (RFC 4180, section 2.3).
- Acceptance 5: the route streams the file in chunks of 500 lines from rows read in one go
  (the memory this takes at the plan caps is unmeasured; docs/review-list.md), finds the
  project through the session's workspace (404 otherwise; e2e/export.spec.ts shows a member of
  another workspace gets 404 on all four files), refuses a request another site starts (403)
  and writes an export_log row (migration 0023: who, when, the file, the filter in words
  without what a text filter holds, the rows) for E11-2. The Export tab fetches the file and
  shows the error copy when the route fails.
- Playwright: e2e/export.spec.ts downloads Answers on the sample, reads the BOM, the
  watermark, the header and 30 rows, then a filtered page's file with its filter line, the
  403, a failed download's error and another workspace's 404.

