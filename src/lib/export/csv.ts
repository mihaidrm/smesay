// The CSV writer of the exports (stories/E10-1, acceptance 2): UTF-8 with a byte order mark so
// Excel reads the characters (learn.microsoft.com, "Opening CSV UTF-8 files correctly in
// Excel": Excel detects UTF-8 by the BOM), comma separated, every field in double quotes with a
// quote inside doubled and lines ending in CRLF (RFC 4180, sections 2.6 and 2.7, and 2.1), and
// dates as ISO 8601 with the UTC offset written out. No database import: pure, so a test and
// the route share it.
export const BOM = "﻿";

export type Cell = string | number | null | undefined;

// A field always quoted, so a comma, a quote or a line break inside it stays in its cell.
export const field = (v: Cell): string => `"${v === null || v === undefined ? "" : String(v).replace(/"/g, '""')}"`;

export const line = (cells: Cell[]): string => `${cells.map(field).join(",")}\r\n`;

// "2026-10-04T21:00:00+00:00": ISO 8601 (toISOString) with the offset spelled out, not "Z",
// which some spreadsheet locales do not read as a time zone.
export const isoUtc = (d: Date | null): string => (d === null ? "" : d.toISOString().replace(/\.\d{3}Z$/, "+00:00"));

// A file as text: the BOM, the lines before the header (the watermark, the filter), the
// header and the rows.
export const csv = (preamble: Cell[][], header: Cell[], rows: Cell[][]): string => BOM + [...preamble, header, ...rows].map(line).join("");
