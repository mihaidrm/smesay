// A pasted list (stories/E3-4): one item per line, leading numbers, bullets and dashes
// stripped (acceptance 1), "text | area | value" filling the area and the proposed value
// (acceptance 3). The result has the row shape of a file with three columns and no header
// row, so the preview, the mapping (Item, Area, Proposed value guess themselves,
// src/lib/import/mapping.ts) and the import (E3-5) treat a pasted list like a file. Pure,
// tested in paste.test.ts. Copy: docs/copy/app.md and errors.md.
export const PASTE_COLUMNS = [{ letter: "A", name: "Item" }, { letter: "B", name: "Area" }, { letter: "C", name: "Proposed value" }];
export const PASTE_MIN_LINES = 2;

export const PASTE_COPY = {
  filename: "Pasted list",
  tooFew: "Paste at least two lines, one item per line.",
  hint: "One item per line. Add an area and a proposed value with a bar: text | area | value.",
  summary: (rows: number) => `Pasted list, ${rows.toLocaleString("en-GB")} ${rows === 1 ? "item" : "items"}.`,
};

// Leading list markers: "1. ", "1) ", "(1) ", "a) ", "A. ", a hyphen, an asterisk, a bullet
// (U+2022), an en or em dash (U+2013, U+2014), a middle dot or ">", a few of them stacked
// ("1. - "), then whitespace.
const MARKER = /^(?:\(?(?:\d{1,4}|[a-zA-Z])[.)]\s+|[-*\u2022\u2013\u2014\u00b7>]\s+)+/;

export function stripMarker(line: string): string {
  return line.trimStart().replace(MARKER, "").trim();
}

export type PastedRow = { text: string; area: string; value: string };

export function parsePaste(text: string): PastedRow[] {
  return text.split(/\r?\n/).map(stripMarker).filter((line) => line !== "").map((line) => {
    const [item = "", area = "", value = ""] = line.split("|").map((part) => part.trim());
    return { text: item, area, value };
  }).filter((row) => row.text !== "");
}

// The rows as the preview and the import read them: three columns always, so the mapping
// has the same keys for every pasted list.
export function pastedRows(rows: PastedRow[]): string[][] {
  return rows.map((r) => [r.text, r.area, r.value]);
}

export function pasteError(rows: PastedRow[]): string | null {
  return rows.length < PASTE_MIN_LINES ? PASTE_COPY.tooFew : null;
}
