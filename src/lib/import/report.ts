// The check before import (stories/E3-5, acceptance 1 and 2): over the data rows of an upload
// with their mapping, the rows that become items and the counts the card shows: empty rows
// (no item text) skipped, exact duplicates (same text after trimming and collapsing
// whitespace, case kept; the item keeps its own text) folded into the first with their
// references listed on it (item.flags.foldedRefs at the commit), items over
// ITEM_LIMIT characters imported whole, proposed values not recognised (src/lib/import/
// values.ts) kept as written. Pure, computed once and stored with the set as ImportReport
// (INTERFACES.md), so the import log (E3-6) shows the same numbers. Tested in report.test.ts.
// Several sheets (stories/E3-7, acceptance 6): checkSheets() runs the same check over the
// ticked sheets in order with one duplicate map, so a duplicate on a later sheet folds into
// the first; each sheet's own counts go to report.sheets and the row lists per sheet to
// sheets; with the option on, each item's area is its sheet's name. checkRows() is the
// single-sheet entry point and gives the same result as before.
import type { ColumnMapping, ImportReport, SheetReport } from "@/db/types";
import { columnKeys, type Column } from "./mapping";
import { isRecognised, normaliseValue } from "./values";

export const ITEM_LIMIT = 1000;

export type ImportRow = {
  row: number;
  ref: string | null;
  text: string;
  area: string | null;
  value: string | null;
  custom: { [header: string]: string } | null;
  foldedRefs: string[];
  sheet?: string;
};

export type SheetInput = { name: string; columns: Column[]; rows: string[][]; firstRow: number; headerRow: number | null };

export type SheetCheck = {
  name: string;
  report: SheetReport;
  emptyRows: number[];
  duplicateRows: { row: number; keptRow: number; keptSheet: string }[];
  longRows: number[];
  unrecognisedRows: { row: number; value: string }[];
};

export type CheckResult = {
  items: ImportRow[];
  report: ImportReport;
  emptyRows: number[];
  duplicateRows: { row: number; keptRow: number }[];
  longRows: number[];
  unrecognisedRows: { row: number; value: string }[];
  sheets?: SheetCheck[];
};

export function collapse(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// rows: the data rows below the header; firstRow: the 1-based sheet row of rows[0], so the
// card can name the rows as the PM sees them in the file.
export function checkRows(columns: Column[], mapping: ColumnMapping, rows: string[][], firstRow: number, headerRow: number | null): CheckResult {
  return check(mapping, [{ name: null, columns, rows, firstRow, headerRow }], { sheetAsArea: false });
}

export function checkSheets(mapping: ColumnMapping, sheets: SheetInput[], options: { sheetAsArea: boolean }): CheckResult {
  return check(mapping, sheets, options);
}

type Segment = Omit<SheetInput, "name"> & { name: string | null };

function check(mapping: ColumnMapping, segments: Segment[], options: { sheetAsArea: boolean }): CheckResult {
  // The sheet names stand in for areas only while no column at all is mapped as area (a
  // sheet without that column gets no area, not its name).
  const sheetAsArea = options.sheetAsArea && !Object.values(mapping).includes("area");
  const items: ImportRow[] = [];
  const seen = new Map<string, ImportRow>();
  const emptyRows: number[] = []; const duplicateRows: { row: number; keptRow: number }[] = []; const longRows: number[] = []; const unrecognisedRows: { row: number; value: string }[] = [];
  const sheets: SheetCheck[] = [];
  for (const segment of segments) {
    const keys = columnKeys(segment.columns);
    const index = (role: string) => keys.findIndex((k) => mapping[k] === role);
    const textAt = index("text"); const refAt = index("ref"); const areaAt = index("area"); const valueAt = index("value");
    const customAt = keys.map((k, i) => (mapping[k] === "custom" ? i : -1)).filter((i) => i >= 0);
    const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const own: SheetCheck = { name: segment.name ?? "", report: { name: segment.name ?? "", rowsRead: segment.rows.length, headerRow: segment.headerRow ?? 0, items: 0, emptyRows: 0, exactDuplicates: 0, overLimit: 0, unrecognisedValues: 0 }, emptyRows: [], duplicateRows: [], longRows: [], unrecognisedRows: [] };
    const rowLabel = (row: number) => (segment.name === null ? `row ${row}` : `row ${row} of ${segment.name}`);
    segment.rows.forEach((r, i) => {
      const row = segment.firstRow + i;
      const text = cell(r, textAt);
      const key = collapse(text);
      if (key === "") { emptyRows.push(row); own.emptyRows.push(row); return; }
      const ref = cell(r, refAt) || null;
      const kept = seen.get(key);
      if (kept) {
        duplicateRows.push({ row, keptRow: kept.row });
        own.duplicateRows.push({ row, keptRow: kept.row, keptSheet: kept.sheet ?? "" });
        kept.foldedRefs.push(ref ?? rowLabel(row));
        return;
      }
      const rawValue = cell(r, valueAt);
      if (rawValue && !isRecognised(rawValue)) { unrecognisedRows.push({ row, value: rawValue }); own.unrecognisedRows.push({ row, value: rawValue }); }
      if (text.length > ITEM_LIMIT) { longRows.push(row); own.longRows.push(row); }
      // The item keeps the cell's text (E1-2: original_text is never changed); the collapsed
      // form is the duplicate key only.
      const custom: { [header: string]: string } = {};
      for (const i of customAt) if (cell(r, i)) custom[keys[i]] = cell(r, i);
      // The area: the mapped column's cell; with no area column and the option on, the sheet.
      const area = cell(r, areaAt) || (sheetAsArea && segment.name ? segment.name : null);
      const item: ImportRow = { row, ref, text, area, value: rawValue ? normaliseValue(rawValue).value : null, custom: customAt.length ? custom : null, foldedRefs: [] };
      if (segment.name !== null) item.sheet = segment.name;
      seen.set(key, item);
      items.push(item);
      own.report.items += 1;
    });
    own.report.emptyRows = own.emptyRows.length; own.report.exactDuplicates = own.duplicateRows.length;
    own.report.overLimit = own.longRows.length; own.report.unrecognisedValues = own.unrecognisedRows.length;
    sheets.push(own);
  }
  const keptLabel = (it: ImportRow) => it.ref ?? (it.sheet ? `row ${it.row} of ${it.sheet}` : `row ${it.row}`);
  const report: ImportReport = {
    rowsRead: segments.reduce((n, s) => n + s.rows.length, 0), headerRow: segments[0]?.headerRow ?? 0,
    emptyRows: emptyRows.length, exactDuplicates: duplicateRows.length, overLimit: longRows.length,
    unrecognisedValues: unrecognisedRows.length,
    duplicateRefs: items.filter((it) => it.foldedRefs.length > 0).map((it) => ({ kept: keptLabel(it), folded: it.foldedRefs })),
  };
  if (segments.length > 1) {
    report.sheets = sheets.map((s) => s.report);
    return { items, report, emptyRows, duplicateRows, longRows, unrecognisedRows, sheets };
  }
  return { items, report, emptyRows, duplicateRows, longRows, unrecognisedRows };
}
