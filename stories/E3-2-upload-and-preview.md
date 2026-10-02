# E3-2 Upload xlsx or csv, detect the header row, preview ten rows

User: a PM with the spreadsheet they already have
Status: built
Outcome: the file is accepted as it is, the header row found, and the first ten rows shown
before anything is imported.

## Acceptance criteria
1. Files up to 5 MB and 2,000 rows import (SECURITY.md, Data). Over either limit, the inline
   message names the size or the row count and the limit (docs/copy/errors.md, Import). A file
   that is not xlsx or csv: "This file is [EXTENSION]. Upload an xlsx or csv, or paste the list
   instead."
2. The header row is detected as the first row where most cells are short text and the rows
   below are longer or typed differently. When no row qualifies, the message "No header row
   found. Pick the row that holds the column names, or tell us which column is the
   requirement." appears with a row picker.
3. The preview shows the first ten data rows with the detected column letters and names (PM
   app board, Import: Ref, Requirement, Module, Priority). Multi-sheet xlsx: the first sheet
   with rows, with a sheet picker when there are several.
4. The upload is stored in the bucket under the workspace's prefix and parsed on the server,
   not in the browser (SECURITY.md); an interrupted upload shows the banner from errors.md and
   nothing is written.
5. A unit test runs the header detection on six fixture files (clean, no header, header on
   row 3, csv with semicolons, csv in UTF-16, xlsx with a title row above the header) and the
   expected row is found or the picker is asked for.
6. Playwright: upload the Marlow fixture, see ten rows and the four columns.

## Out of scope
- Mapping: E3-3. Paste: E3-4. Jira and Notion: R2.

## Open questions
- None.

## Technical notes
Built 2026-10-02.

- Libraries, after the CLAUDE.md research check, read from the npm registry on 2026-10-02
  (`npm view <package> version license time`): read-excel-file 9.3.10 (MIT, published
  2026-08-10, gitlab.com/catamphetamine/read-excel-file) for xlsx and papaparse 5.7.0 (MIT,
  published 2026-08-24, github.com/mholt/PapaParse) for csv. Open issue counts: unverified in
  this session (GitHub access is scoped to this repository; Mihai can read them on the two
  pages). Not taken: SheetJS community edition, whose npm package `xlsx` stopped at 0.18.5
  (published 2022-03-24, Apache-2.0) and exceljs, whose last release on npm is from 2024-12-20
  and which writes workbooks too, more than this story needs. Both choices are easy to swap:
  src/lib/import/parse.ts is the only file that imports them, and everything after it works
  on string[][].
- src/lib/import/parse.ts reads the file into rows of trimmed strings per sheet (numbers and
  dates as text, a UTF-16 byte order mark picks the encoding, papaparse guesses the delimiter);
  src/lib/import/header.ts is the detection (the first row with at least two filled cells, most
  of them short text, where the rows below are clearly longer or typed in at least one column;
  the first 20 rows are searched); src/lib/import/preview.ts builds UploadPreview
  (INTERFACES.md): the sheet (picked, else the first with rows), the header row (picked, 0 for
  none, else detected), the columns with letters A, B, C for xlsx and csv alike, the first ten
  data rows, the data row count. src/lib/import/limits.ts holds 5 MB and 2,000 rows.
- src/lib/uploads.ts: the checks in order (extension, size, readable, rows), then the object
  under uploads/<workspace id>/<16 hex>.<xlsx|csv> (never the PM's file name), then the row in
  the upload table (migration 0005, docs/schema.md): a file that fails a check is never written,
  a store failure leaves no row, a failed insert removes the object again. The row limit is
  checked on every sheet (each with its own detected header) at upload, and again on the sheet
  and header row picked in rechoose(), which rebuilds the preview from the stored object and
  refuses a pick over the limit (the stored choice stays); the message carries the real count,
  so parseFile() keeps every row. Upload with no file chosen gets its own message; a connection
  that drops mid-upload never reaches the action and lands on the signed-in error page with
  nothing stored (errors.md names the wording for E11-6). Uploads to the sample project and to a
  project of another workspace are refused on the server (tested). Earlier uploads of a project
  keep their rows and objects until the workspace deletion (E11-2). The server action's body
  limit is 6 MB (next.config.ts) and the browser checks the 5 MB before sending. Messages live
  in src/lib/import/copy.ts, shared by the server and the upload form.
- The Import page shows the upload card and the preview of the latest upload (design note 20);
  the preview rows are stored in the row, so the page does not parse the file again. The
  mapping (E3-3) reads upload.preview.columns and the stored object.
- Fixtures under src/lib/import/fixtures/ are invented (decision 0002), written by a script
  with Python's zipfile (no spreadsheet program in the session): clean.csv, no-header.csv,
  header-row-3.csv, semicolons.csv, utf16.csv, title-row.xlsx, plus two-sheets.xlsx for the
  sheet picker, and big-second-sheet.xlsx (a two-row first sheet, 2,001 rows on the second) for
  the row limit; e2e/fixtures/expense-requirements.xlsx is the Marlow list with 12 rows so the
  preview shows ten.
- Tests: src/lib/import/header.test.ts (the six fixtures and the cell rules, acceptance 5),
  src/lib/uploads.test.ts (the checks, the stored object and row, another workspace refused,
  the pickers), e2e/import.spec.ts (acceptance 6: a pdf refused, the Marlow fixture, four
  columns, ten rows, the row picker, reload).
- Not in this story: the mapping card (E3-3), paste (E3-4), the import itself (E3-5).
- Open: SECURITY.md says uploads are "parsed server-side in a worker". Here the parse runs in
  the server action's process (a file is at most 5 MB; read-excel-file unzips the workbook in
  memory). Whether a worker is needed before launch is Mihai's decision (asked 2026-10-02);
  until then this line stays open and the audit's finding stays recorded here.
- Open: acceptance 2's rule accepts a one-column header; the code asks for at least two filled
  cells in the header row (MIN_FILLED), so a one-column list gets the picker. And the noHeader
  message says "tell us which column is the requirement", a control E3-3 adds. Both asked
  2026-10-02.
- Change of 2026-10-02 (with E3-5): LONGER_MIN in src/lib/import/header.ts went from 8 to 3,
  because a header "Requirement" over 19-character requirements was not found (the data
  rows were not "clearly longer" by 8); header.test.ts has the case. The six fixtures still
  give the same rows, no-header.csv included.
