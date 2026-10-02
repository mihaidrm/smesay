// The upload messages (stories/E3-2; docs/copy/errors.md, Import, and app.md). Kept apart from
// src/lib/uploads.ts so the upload form (a client component) can show the same size message
// without importing the database.
import { ROWS_MAX, SIZE_MAX, formatBytes } from "./limits";

export const UPLOAD_COPY = {
  noFile: "Choose an xlsx or csv file, then press Upload.",
  notSpreadsheet: (extension: string) => `This file is ${extension || "without an extension"}. Upload an xlsx or csv, or paste the list instead.`,
  tooBig: (size: number) => `This file is ${formatBytes(size)}. The limit is ${formatBytes(SIZE_MAX)}. Remove sheets or columns you do not need and upload again.`,
  tooManyRows: (rows: number, sheet: string | null) =>
    `${sheet ? `Sheet ${sheet} has` : "This file has"} ${rows.toLocaleString("en-GB")} rows. The limit is ${ROWS_MAX.toLocaleString("en-GB")}. Split the list and upload the first part.`,
  pasteTooBig: (size: number) => `This list is ${formatBytes(size)}. The limit is ${formatBytes(SIZE_MAX)}. Paste a shorter list.`,
  pasteTooManyRows: (rows: number) => `This list has ${rows.toLocaleString("en-GB")} lines. The limit is ${ROWS_MAX.toLocaleString("en-GB")}. Split it and paste the first part.`,
  unreadable: "The file could not be read as a spreadsheet. Export it again as xlsx or csv and upload it.",
  sample: "The sample project cannot be edited.",
  noHeader: "No header row found. Pick the row that holds the column names, or tell us which column is the requirement.",
  summary: (filename: string, rows: number, headerRow: number | null) =>
    `${filename}, ${rows.toLocaleString("en-GB")} ${rows === 1 ? "row" : "rows"} read, ${headerRow ? `header found on row ${headerRow}` : "no header row found"}.`,
};
