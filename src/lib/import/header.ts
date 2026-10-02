// Header row detection (stories/E3-2, acceptance 2): the header is the first row where most
// cells are short text and the rows below are longer or typed differently. Pure, so the six
// fixtures test it (header.test.ts); the picker takes over when no row qualifies.
//
// The rule, cell by cell: a cell is "header-like" when it is text of at most HEADER_CELL_MAX
// characters that is not a number, a date or a boolean. A row is a candidate when at least
// MIN_FILLED cells are filled and at least MOST of the filled cells are header-like. The
// candidate wins when the rows below it (up to LOOK_AHEAD of them) differ from it in at least
// one column: on average they are clearly longer there (LONGER_RATIO times the header cell and
// at least LONGER_MIN characters more) or typed (number, date, boolean) where the candidate has
// text. A title row ("Expense tool requirements, v3" alone in column A) fails MIN_FILLED; a sheet
// whose first rows are all data of the same shape finds no row, because a data row's short
// cells ("Must", "Submitting") are followed by cells of the same length.
export const HEADER_CELL_MAX = 40;
export const MIN_FILLED = 2;
export const MOST = 0.6;
export const LOOK_AHEAD = 5;
export const SEARCH_ROWS = 20;
export const LONGER_RATIO = 1.5;
export const LONGER_MIN = 3;

export type HeaderResult = { headerRow: number | null };

const NUMBER = /^[-+]?(\d+([.,]\d+)?|\d{1,3}([ ,.]\d{3})+([.,]\d+)?)%?$/;
const DATE = /^(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})(T| |$)/;
const BOOLEAN = /^(true|false|yes|no)$/i;

export function isTyped(cell: string): boolean {
  return NUMBER.test(cell) || DATE.test(cell) || BOOLEAN.test(cell);
}

export function isHeaderLike(cell: string): boolean {
  return cell !== "" && cell.length <= HEADER_CELL_MAX && !isTyped(cell);
}

// 1-based row number of the header, or null. Rows are the sheet's rows as parseFile() returns
// them, empty cells as "".
export function detectHeader(rows: string[][]): number | null {
  const limit = Math.min(rows.length, SEARCH_ROWS);
  for (let i = 0; i < limit; i += 1) {
    const row = rows[i];
    const filled = row.filter((c) => c !== "");
    if (filled.length < MIN_FILLED) continue;
    if (filled.filter(isHeaderLike).length / filled.length < MOST) continue;
    const below = rows.slice(i + 1, i + 1 + LOOK_AHEAD).filter((r) => r.some((c) => c !== ""));
    if (below.length === 0) continue;
    if (differsBelow(row, below)) return i + 1;
  }
  return null;
}

// At least one column where the rows below are, on average, clearly longer than the header
// cell or typed where the header is text.
function differsBelow(header: string[], below: string[][]): boolean {
  const width = Math.max(header.length, ...below.map((r) => r.length));
  for (let c = 0; c < width; c += 1) {
    const h = header[c] ?? "";
    if (!isHeaderLike(h)) continue;
    const cells = below.map((r) => r[c] ?? "").filter((v) => v !== "");
    if (cells.length === 0) continue;
    const typed = cells.filter(isTyped).length / cells.length;
    const meanLength = cells.reduce((s, v) => s + v.length, 0) / cells.length;
    if (typed >= MOST || meanLength > Math.max(h.length * LONGER_RATIO, h.length + LONGER_MIN)) return true;
  }
  return false;
}

// Column letters as the sheet shows them (A, B, ..., Z, AA): the story's rule for csv too.
export function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
