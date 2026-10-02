// The preview of an upload (stories/E3-2, acceptance 2 and 3): which sheet, which header row,
// the columns with their letters and names, the first PREVIEW_ROWS data rows and the count of
// data rows. Pure, over the rows parseFile() returned. The sheet is the one the PM picked, else
// the first sheet with rows; the header row is the one the PM picked (0 for "no header row"),
// else detectHeader()'s; with no header, the columns carry their letters alone and the rows
// start at row 1.
import type { UploadPreview } from "@/db/types";
import { columnLetter, detectHeader } from "./header";
import { PREVIEW_ROWS } from "./limits";
import type { ParsedFile } from "./parse";

export function buildPreview(file: ParsedFile, choice: { sheet?: string | null; headerRow?: number | null } = {}): UploadPreview {
  const sheets = file.sheets.map((s) => s.name);
  const chosen = (choice.sheet && file.sheets.find((s) => s.name === choice.sheet)) || file.sheets.find((s) => s.rows.length > 0) || null;
  if (!chosen) return { sheets, sheet: null, headerRow: null, columns: [], rows: [], rowsRead: 0 };
  const picked = choice.headerRow;
  const headerRow = picked === 0 ? null : picked && picked >= 1 && picked <= chosen.rows.length ? picked : detectHeader(chosen.rows);
  const header = headerRow ? chosen.rows[headerRow - 1] : [];
  const data = chosen.rows.slice(headerRow ?? 0);
  const width = Math.max(header.length, ...data.map((r) => r.length), 0);
  const columns = Array.from({ length: width }, (_, i) => ({ letter: columnLetter(i), name: header[i] ?? "" }));
  return {
    sheets,
    sheet: chosen.name,
    headerRow,
    columns,
    rows: data.slice(0, PREVIEW_ROWS).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? "")),
    rowsRead: data.length,
  };
}
