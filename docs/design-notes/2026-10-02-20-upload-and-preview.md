# Design note 20: the upload card and the preview, 2026-10-02

Story E3-2. Built from the PM app board (Import step: the summary line "expense-requirements.xlsx,
6 rows read, header found on row 1." under the title) and docs/design-system.md. The board has
no upload control and no preview table of its own, so both are composed from the design system
here; the mapping card that follows them on the board is E3-3. Screenshots beside the boards:
import-upload-desktop.png (a new project, the About card and the upload card),
import-preview-desktop.png (the Marlow fixture, 12 rows, ten shown),
import-preview-no-header-desktop.png (the picker set to "No header row": the message, the
letters alone, 13 rows), import-preview-sheets-desktop.png (a three-sheet workbook with the
sheet picker on "Requirements"). The dark circle bottom left is Next's dev tools badge, dev
server only.

## The upload card

A card like the About card: the title "The list", one line, the file input (the browser's own
control, as the logo input in Settings) beside the primary "Upload" pill, and the limits as a
13 px muted line above them. The error of the last attempt sits under the input in the danger
colour with role alert and the id upload-error (Next's route announcer also has role alert, so
tests address the id). The card is not shown on the sample project, which is read-only.

## The preview card

The title "Preview" and the board's summary line, then the pickers in one row: "Sheet" with
"Show sheet" (only when the workbook has more than one sheet) and "Header row" with "Use this
row" (always; "No header row" and Row 1 to Row 20 at most). Both are native selects, 36 px,
hairline-strong border, radius 6, next to a secondary pill that shows the loading state while
the server re-reads the stored file; a pick the row limit refuses shows its message under the
pickers (id pick-error). When no header row was found, the errors.md message sits above the
pickers in the danger colour.

The table is the design system's table: in each header cell the column letter in muted and the
column name beside it (the letter alone when there is no header), then the first ten data rows,
cells truncated at 420 px with the full text as a title. Under the table "The first 10 of [N]
rows." when there are more. An empty sheet shows one muted line instead of the table.

## Decisions taken here

- The summary line keeps the board's wording and adds the no-header variant.
- The row picker caps at Row 20, the range the detection searches (src/lib/import/header.ts,
  SEARCH_ROWS); a header below row 20 is not a case the story covers.
- Phone (390): the pickers wrap, the table scrolls sideways inside its card. The PM side is
  desktop only in R1 (decision 0020), so no phone screenshot.
