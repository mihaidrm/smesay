// The CSV writer of the exports (stories/E10-1, acceptance 2): UTF-8 with a byte order mark so
// Excel reads the characters (support.microsoft.com, "Opening CSV UTF-8 files correctly in
// Excel": "You can open a CSV file encoded with UTF-8 normally if it was saved with BOM"), comma
// separated, every field in double quotes with a
// quote inside doubled and lines ending in CRLF (RFC 4180, sections 2.6 and 2.7, and 2.1), and
// dates as ISO 8601 with the UTC offset written out. No database import: pure, so a test and
// the route share it.
export const BOM = "\uFEFF";

export type Cell = string | number | null | undefined;

// Text a respondent typed can start like a formula. A spreadsheet runs a cell that begins with
// =, +, -, @, a tab, a carriage return or a line feed, so such a text cell gets a single quote
// in front (OWASP, CSV Injection: community.owasp.org/attacks/CSV_Injection, which lists those
// characters and the single quote among its mitigations). A plain number, such as a scale code
// of -1, is not text a spreadsheet runs and is left as it is.
const FORMULA = /^[=+\-@\t\r\n]/;
const NUMBER = /^[+-]?\d+(\.\d+)?$/;
export const safeText = (s: string): string => (FORMULA.test(s) && !NUMBER.test(s) ? `'${s}` : s);

// A field always quoted, so a comma, a quote or a line break inside it stays in its cell.
export const field = (v: Cell): string => `"${v === null || v === undefined ? "" : (typeof v === "number" ? String(v) : safeText(v)).replace(/"/g, '""')}"`;

export const line = (cells: Cell[]): string => `${cells.map(field).join(",")}\r\n`;

// "2026-10-04T21:00:00+00:00": ISO 8601 (toISOString) with the offset written as +00:00 in
// place of "Z". Whether a given spreadsheet reads either form as a date is unverified; Mihai
// checks Excel and Google Sheets.
export const isoUtc = (d: Date | null): string => (d === null ? "" : d.toISOString().replace(/\.\d{3}Z$/, "+00:00"));

// A file as text: the BOM, the lines before the header (the watermark, the filter), the
// header and the rows.
export const csv = (preamble: Cell[][], header: Cell[], rows: Cell[][]): string => BOM + [...preamble, header, ...rows].map(line).join("");
