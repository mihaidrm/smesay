// The preview of an upload (stories/E3-2, acceptance 2 and 3): which sheet, which header row,
// the columns with their letters and names, the first PREVIEW_ROWS data rows and the count of
// data rows. Pure, over the rows parseFile() returned. The sheet is the one the PM picked, else
// the first sheet with rows; the header row is the one the PM picked (0 for "no header row"),
// else detectHeader()'s; with no header, the columns carry their letters alone and the rows
// start at row 1.
// Several sheets (stories/E3-7): with more than one sheet ticked, each is previewed on its own
// in perSheet (its own header row, found by the same finder or picked), the columns are the
// union of theirs, rows the first ticked sheet's and rowsRead the total; sheetRows lists
// every sheet with rows for the Sheets step. One sheet ticked is the single-sheet path.
import type { SheetChoice, SheetPreview, UploadPreview } from "@/db/types";
import { columnLetter, detectHeader } from "./header";
import { PREVIEW_ROWS } from "./limits";
import type { ParsedFile, ParsedSheet } from "./parse";
import { PASTE_COLUMNS } from "./paste";
import { sheetsWithRows, unionColumns } from "./sheets";

export type PreviewChoice = { sheet?: string | null; headerRow?: number | null; sheets?: SheetChoice[] | null };

export function buildPreview(file: ParsedFile, choice: PreviewChoice = {}): UploadPreview {
  const sheets = file.sheets.map((s) => s.name);
  const sheetRows = file.kind === "xlsx" ? sheetsWithRows(file) : undefined;
  const withRows = (preview: UploadPreview): UploadPreview => (sheetRows ? { ...preview, sheetRows } : preview);
  const ticked = (choice.sheets ?? [])
    .map((c) => ({ choice: c, sheet: file.sheets.find((s) => s.name === c.name) }))
    .filter((t): t is { choice: SheetChoice; sheet: ParsedSheet } => t.sheet !== undefined && t.sheet.rows.length > 0);
  if (ticked.length > 1) {
    const perSheet = ticked.map((t) => previewSheet(t.sheet, t.choice.headerRow));
    return withRows({
      sheets, sheet: perSheet[0].name, headerRow: perSheet[0].headerRow,
      columns: unionColumns(perSheet), rows: perSheet[0].rows,
      rowsRead: perSheet.reduce((n, p) => n + p.rowsRead, 0),
      perSheet,
    });
  }
  const pickedSheet = ticked.length === 1 ? ticked[0].sheet.name : choice.sheet;
  const pickedHeader = ticked.length === 1 ? ticked[0].choice.headerRow : choice.headerRow;
  const chosen = (pickedSheet && file.sheets.find((s) => s.name === pickedSheet)) || file.sheets.find((s) => s.rows.length > 0) || null;
  if (!chosen) return withRows({ sheets, sheet: null, headerRow: null, columns: [], rows: [], rowsRead: 0 });
  // A pasted list (stories/E3-4) has its three fixed columns and no header row to find.
  if (file.kind === "pasted") return { sheets, sheet: chosen.name, headerRow: null, columns: PASTE_COLUMNS, rows: chosen.rows.slice(0, PREVIEW_ROWS), rowsRead: chosen.rows.length };
  const one = previewSheet(chosen, pickedHeader);
  return withRows({ sheets, sheet: one.name, headerRow: one.headerRow, columns: one.columns, rows: one.rows, rowsRead: one.rowsRead });
}

// One sheet: the header row picked (0 for none), else found; the columns with their letters
// and names; the first PREVIEW_ROWS data rows, padded to the width; the data row count.
export function previewSheet(sheet: ParsedSheet, picked: number | null | undefined): SheetPreview {
  const headerRow = picked === 0 ? null : picked && picked >= 1 && picked <= sheet.rows.length ? picked : detectHeader(sheet.rows);
  const header = headerRow ? sheet.rows[headerRow - 1] : [];
  const data = sheet.rows.slice(headerRow ?? 0);
  const width = Math.max(header.length, ...data.map((r) => r.length), 0);
  const columns = Array.from({ length: width }, (_, i) => ({ letter: columnLetter(i), name: header[i] ?? "" }));
  return {
    name: sheet.name,
    headerRow,
    columns,
    rows: data.slice(0, PREVIEW_ROWS).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? "")),
    rowsRead: data.length,
  };
}
