// Reading an upload into rows of text (stories/E3-2, acceptance 1, 3 and 4). Parsing happens on
// the server, never in the browser (SECURITY.md, Data). Two libraries, both MIT, chosen in the
// story's research check (stories/E3-2-upload-and-preview.md, Technical notes):
// - read-excel-file 9.3.10 for xlsx: readXlsxFile(buffer) returns every sheet with its rows
//   (node_modules/read-excel-file/node/index.d.ts: `readXlsxFile(input, options?):
//   Promise<Sheet[]>`, Sheet = { sheet: string; data: Row[] }, a cell is string, number,
//   boolean, Date or null: types/SheetData.d.ts). InvalidInputError when the input is not an
//   xlsx (types/InvalidInputError.d.ts, FILE_NOT_SUPPORTED, XLS_FILE_NOT_SUPPORTED,
//   INVALID_ZIP) and InvalidSpreadsheetError when the workbook is malformed
//   (types/InvalidSpreadsheetError.d.ts).
// - papaparse 5.7.0 for csv: Papa.parse(text, { delimiter: "" }) guesses the delimiter from
//   the first rows (node_modules/@types/papaparse/index.d.ts, `delimiter`: "Leave blank to
//   auto-detect from a list of most common delimiters"), skipEmptyLines drops blank lines
//   (ibid.), and meta.delimiter reports the one it chose.
// The text decoding is ours: a UTF-16 byte order mark (FF FE or FE FF) picks that encoding,
// a UTF-8 mark is dropped by TextDecoder's default (developer.mozilla.org/docs/Web/API/
// TextDecoder/TextDecoder: ignoreBOM false strips it), anything else is read as UTF-8.
// Every cell becomes a trimmed string: a number as JavaScript prints it, a date as an ISO date,
// so the header detection and the preview see one shape for both kinds of file.
import Papa from "papaparse";
import readXlsxFile, { InvalidInputError, InvalidSpreadsheetError } from "read-excel-file/node";
import { ROWS_MAX, SIZE_MAX } from "./limits";
import { SEARCH_ROWS } from "./header";

export type UploadKind = "xlsx" | "csv";
export type ParsedSheet = { name: string; rows: string[][] };
export type ParsedFile = { kind: UploadKind; sheets: ParsedSheet[] };

export class UnreadableFileError extends Error {
  constructor() { super("The file could not be read as a spreadsheet."); this.name = "UnreadableFileError"; }
}

// The kind comes from the file name's extension, lower-cased; the content check is the parse
// itself (a renamed PDF fails as an xlsx or yields one column of noise as a csv).
export function kindOf(filename: string): UploadKind | null {
  const ext = extensionOf(filename);
  return ext === "xlsx" || ext === "csv" ? ext : null;
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot < 0 ? "" : filename.slice(dot + 1).toLowerCase();
}

export async function parseFile(kind: UploadKind, bytes: Uint8Array): Promise<ParsedFile> {
  if (bytes.byteLength > SIZE_MAX) throw new Error(`parseFile refuses ${bytes.byteLength} bytes; check the size before calling it.`);
  const sheets = kind === "xlsx" ? await parseXlsx(bytes) : [parseCsv(bytes)];
  // Enough rows for the row limit to be checked after the header (which sits within the first
  // SEARCH_ROWS rows), not more: a 5 MB csv of one-word lines is not read whole.
  return { kind, sheets: sheets.map((s) => ({ name: s.name, rows: s.rows.slice(0, ROWS_MAX + SEARCH_ROWS + 1) })) };
}

async function parseXlsx(bytes: Uint8Array): Promise<ParsedSheet[]> {
  try {
    const sheets = await readXlsxFile(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    return sheets.map((s) => ({ name: s.sheet, rows: trimTrailing(s.data.map((row) => row.map(cellText))) }));
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof InvalidSpreadsheetError) throw new UnreadableFileError();
    throw error;
  }
}

function parseCsv(bytes: Uint8Array): ParsedSheet {
  const text = decode(bytes);
  const result = Papa.parse<string[]>(text, { delimiter: "", skipEmptyLines: true });
  return { name: "csv", rows: trimTrailing(result.data.map((row) => row.map((c) => (c ?? "").trim()))) };
}

export function decode(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

// Rows with nothing in them at the end of a sheet are not rows; rows in the middle stay, so the
// row numbers in the preview match the sheet.
function trimTrailing(rows: string[][]): string[][] {
  let end = rows.length;
  while (end > 0 && rows[end - 1].every((c) => c === "")) end -= 1;
  return rows.slice(0, end);
}
