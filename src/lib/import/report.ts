// The check before import (stories/E3-5, acceptance 1 and 2): over the data rows of an upload
// with their mapping, the rows that become items and the counts the card shows: empty rows
// (no item text) skipped, exact duplicates (same text after trimming and collapsing
// whitespace, case kept; the item keeps its own text) folded into the first with their
// references listed on it (item.flags.foldedRefs at the commit), items over
// ITEM_LIMIT characters imported whole, proposed values not recognised (src/lib/import/
// values.ts) kept as written. Pure, computed once and stored with the set as ImportReport
// (INTERFACES.md), so the import log (E3-6) shows the same numbers. Tested in report.test.ts.
import type { ColumnMapping, ImportReport } from "@/db/types";
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
};

export type CheckResult = {
  items: ImportRow[];
  report: ImportReport;
  emptyRows: number[];
  duplicateRows: { row: number; keptRow: number }[];
  longRows: number[];
  unrecognisedRows: { row: number; value: string }[];
};

export function collapse(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// rows: the data rows below the header; firstRow: the 1-based sheet row of rows[0], so the
// card can name the rows as the PM sees them in the file.
export function checkRows(columns: Column[], mapping: ColumnMapping, rows: string[][], firstRow: number, headerRow: number | null): CheckResult {
  const keys = columnKeys(columns);
  const index = (role: string) => keys.findIndex((k) => mapping[k] === role);
  const textAt = index("text"); const refAt = index("ref"); const areaAt = index("area"); const valueAt = index("value");
  const customAt = keys.map((k, i) => (mapping[k] === "custom" ? i : -1)).filter((i) => i >= 0);
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const items: ImportRow[] = [];
  const seen = new Map<string, ImportRow>();
  const emptyRows: number[] = []; const duplicateRows: { row: number; keptRow: number }[] = []; const longRows: number[] = []; const unrecognisedRows: { row: number; value: string }[] = [];
  rows.forEach((r, i) => {
    const row = firstRow + i;
    const text = cell(r, textAt);
    const key = collapse(text);
    if (key === "") { emptyRows.push(row); return; }
    const ref = cell(r, refAt) || null;
    const kept = seen.get(key);
    if (kept) {
      duplicateRows.push({ row, keptRow: kept.row });
      kept.foldedRefs.push(ref ?? `row ${row}`);
      return;
    }
    const rawValue = cell(r, valueAt);
    if (rawValue && !isRecognised(rawValue)) unrecognisedRows.push({ row, value: rawValue });
    if (text.length > ITEM_LIMIT) longRows.push(row);
    // The item keeps the cell's text (E1-2: original_text is never changed); the collapsed
    // form is the duplicate key only.
    const custom: { [header: string]: string } = {};
    for (const i of customAt) if (cell(r, i)) custom[keys[i]] = cell(r, i);
    const item: ImportRow = { row, ref, text, area: cell(r, areaAt) || null, value: rawValue ? normaliseValue(rawValue).value : null, custom: customAt.length ? custom : null, foldedRefs: [] };
    seen.set(key, item);
    items.push(item);
  });
  const report: ImportReport = {
    rowsRead: rows.length, headerRow: headerRow ?? 0,
    emptyRows: emptyRows.length, exactDuplicates: duplicateRows.length, overLimit: longRows.length,
    unrecognisedValues: unrecognisedRows.length,
    duplicateRefs: items.filter((it) => it.foldedRefs.length > 0).map((it) => ({ kept: it.ref ?? `row ${it.row}`, folded: it.foldedRefs })),
  };
  return { items, report, emptyRows, duplicateRows, longRows, unrecognisedRows };
}
