# E3-2 Upload xlsx or csv, detect the header row, preview ten rows

User: a PM with the spreadsheet they already have
Status: ready
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
Parsing library chosen in the story's first session after the CLAUDE.md research check
(licence, last release, open issues) and recorded here; candidates are SheetJS community
edition and exceljs for xlsx, and a small csv parser with delimiter sniffing. Fixtures under
src/lib/import/fixtures/ are invented (decision 0002). Column letters follow the sheet
(A, B, C); csv gets the same letters.
