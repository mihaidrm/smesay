# E3-7 Import the sheets that hold the list

User: a PM whose workbook keeps the requirements on one or two of its tabs
Status: built
Outcome: the PM ticks the sheets that hold the list, every ticked sheet is previewed, mapped
and imported in one version, and the tab names become the areas when the file has none.

## Acceptance criteria
1. When an xlsx has more than one sheet with at least one non-empty row, the Preview card shows
   a Sheets step before the header row: every such sheet with its row count and a checkbox,
   the first sheet with rows ticked, and a "Use these sheets" button. A sheet with no rows is
   not listed. A file with one such sheet, a csv and a pasted list skip the step and keep the
   path of E3-2 as it is.
2. Until "Use these sheets" is pressed, the card shows the step and the line "Tick the sheets
   that hold the list, then press Use these sheets." and nothing else; the mapping and the
   check cards wait. Pressing it with no sheet ticked shows "Tick at least one sheet." and
   changes nothing. Ticking sheets whose rows together pass 2,000 shows "The sheets ticked
   have [N] rows together. The limit is 2,000. Untick a sheet or split the list." and keeps
   the stored choice.
3. The header row is found per ticked sheet with the finder of E3-2, and each ticked sheet
   has its own header row picker. The preview shows the first ten rows of each ticked sheet
   under "Sheet [NAME]: [N] rows, header on row [N]." (or "no header row", with the E3-2
   message). The summary line reads "We read [N] rows from [FILE] across [N] sheets."
4. The mapping card lists the columns of every ticked sheet once, by header, and the mapping
   applies to every ticked sheet. A ticked sheet whose header does not carry the column
   mapped as item text is named: "Sheet [NAME] has no column [HEADER]. Untick it, or map the
   item text to a column every ticked sheet has." The Import button is disabled until the
   sheet is unticked or the mapping changed.
5. When no column is mapped as Area and more than one sheet is ticked, the mapping card shows
   the switch "Use the sheet names as areas", on by default; on, every item's area is the name
   of its sheet. Mapping an Area column hides the switch and the column wins.
6. The rows are imported in sheet order, then row order, as one version. Exact duplicates fold
   across sheets into the first (E3-5, acceptance 2). The check card counts per sheet, each
   under "Sheet [NAME]", with the rows named as in the file. The import log's Source stays
   "xlsx" and its Checks cell adds "[N] sheets".
7. Unit tests: the sheet rule (which files get the step, which sheet is ticked first), the
   header row found per sheet, the union of columns, the missing-text sheet message, the
   per-sheet counts and the sheet name as area. A database test imports two sheets of the
   two-sheets fixture and checks the version, the item order, the folded duplicates, the areas
   and the report. Playwright: a two-sheet workbook built in the test, both sheets ticked,
   imported, the item count and the areas checked on the version page.

## Out of scope
- A csv has one sheet. A pasted list has one sheet.
- Different mappings per sheet: one mapping covers every ticked sheet.
- The row limit stays 2,000 for the ticked sheets together (SECURITY.md, Data).

## Open questions
- None. Mihai's message of 2026-10-07 asked for the step: "if we detect file has more tabs,
  we ask users which tabs we import and map - and he selects all tabs that apply" (design
  note 111).

## Technical notes
Built 2026-10-07 from Mihai's message (design note 111), stacked on the missing-box branch
(migration 0036), so its migration is 0037.

- Schema (migration 0037, upload_sheets): upload.sheets jsonb UploadSheets (INTERFACES.md:
  the ticked sheets in file order, each with the header row the PM picked when there is one;
  null until the step is confirmed, and null for a csv, a pasted list and an old row) and
  upload.sheet_areas boolean not null default true (the switch of acceptance 5). upload.sheet
  and upload.header_row stay for the single-sheet path.
- UploadPreview gains sheetRows (every sheet with rows and its count, xlsx only) and perSheet
  (the ticked sheets when more than one, each with its own header row, columns, ten rows and
  count); the top-level columns are then the union of the ticked sheets' columns by key
  (src/lib/import/mapping.ts columnKeys), rows the first ticked sheet's, rowsRead the total.
- ImportReport gains sheets: SheetReport[] when more than one sheet was read.
- src/lib/import/sheets.ts holds the rule and the union; src/lib/import/report.ts gains
  checkSheets() (one duplicate map across the sheets; the sheet name as area when the option
  is on); checkRows() stays the single-sheet entry point.
- src/lib/uploads.ts: chooseSheets() (the step), rechoose() with a sheet's header row when
  several are ticked, saveMapping() with the switch. src/lib/imports.ts: checkUpload() over the
  ticked sheets, sheetsError() for acceptance 4.
