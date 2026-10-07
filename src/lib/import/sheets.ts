// The sheet rule (stories/E3-7, acceptance 1): a workbook with more than one sheet that has at
// least one non-empty row gets the Sheets step; the first such sheet is ticked by default. A
// csv and a pasted list have one sheet and never get the step. Pure, over parseFile()'s rows
// and the stored preview; tested in sheets.test.ts.
import type { UploadPreview, UploadSheets } from "@/db/types";
import { columnKeys, type Column } from "./mapping";
import type { ParsedFile, UploadKind } from "./parse";

// Every sheet with at least one non-empty row, with that count, in file order.
export function sheetsWithRows(file: ParsedFile): { name: string; rows: number }[] {
  return file.sheets
    .map((s) => ({ name: s.name, rows: s.rows.filter((r) => r.some((c) => c !== "")).length }))
    .filter((s) => s.rows > 0);
}

export function needsSheetStep(upload: { kind: UploadKind; preview: UploadPreview }): boolean {
  return upload.kind === "xlsx" && (upload.preview.sheetRows?.length ?? 0) > 1;
}

// The names ticked: the stored choice, else the first sheet with rows.
export function tickedNames(upload: { sheets: UploadSheets | null; preview: UploadPreview }): string[] {
  if (upload.sheets && upload.sheets.length > 0) return upload.sheets.map((s) => s.name);
  const first = upload.preview.sheetRows?.[0];
  return first ? [first.name] : [];
}

// The columns of several sheets as one list for the mapping card (acceptance 4): each key once,
// first seen first, with the letter of the sheet it was first seen in. The mapping is keyed by
// these keys (src/lib/import/mapping.ts columnKeys), so a header shared by the sheets maps once.
export function unionColumns(sheets: { columns: Column[] }[]): Column[] {
  const seen = new Set<string>();
  const union: Column[] = [];
  for (const sheet of sheets) {
    const keys = columnKeys(sheet.columns);
    sheet.columns.forEach((column, i) => {
      if (seen.has(keys[i])) return;
      seen.add(keys[i]);
      union.push(column);
    });
  }
  return union;
}
