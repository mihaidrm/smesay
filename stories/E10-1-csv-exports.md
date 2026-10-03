# E10-1 CSV of answers and CSV of items with aggregates

User: a PM who works in Excel
Status: ready
Outcome: two CSV files that open in Excel with correct characters and dates, and whose rows
are the dashboard's numbers.

## Acceptance criteria
1. Export tab (PM app board): "Answers" (one row per answer: respondent, every respondent
   field, item reference, area, item text, proposed value, answer kind, their value, reason or
   question, comment, submitted at, source, perspectives) and "Items with totals" (one row per
   item: reference, text, original, area, proposed value, counts of agree, changed, disagree,
   unclear, not answered, agreement percentage).
2. UTF-8 with a byte order mark, comma separated, quoted fields, dates as ISO 8601 with the
   UTC offset; opens in Excel with diacritics and dates intact (Mihai checks on his PC; a unit
   test checks the BOM, the quoting of a field with a comma and a newline, and the date
   format).
3. Every number on Results equals the matching CSV row: the reconciliation test from E8-1 and
   E8-3 runs both exports and compares every headline number, every item count and every
   register count to the files.
4. Sample project exports carry the watermark in the first row ("Sample data, invented").
5. Downloads are streamed, scoped by workspace, and logged (who, when, what) for E11-2.

## Out of scope
- Excel xlsx output: CSV opens in Excel; xlsx is a candidate for later.

## Open questions
- None.

## Technical notes
One module src/lib/export/csv.ts shared by both files, fed by the same queries as the
dashboard (src/db/queries/results.ts), never by a second computation.

Amended 2026-10-03 (design note 40): both exports take the page's ResultsFilter (E8-1), so
a filtered Results screen exports what it shows and still reconciles to the row; the first
row of a filtered file names the filter. The answer kind column uses the names of decision
0014 as E8 shows them (Agree, Different priority, Disagree, Unclear); the items file's
counts are headed the same way.
