// The CSV writer (stories/E10-1, acceptance 2): the byte order mark, a field with a comma, a
// quote and a line break kept in its cell, CRLF line ends, dates as ISO 8601 with the offset.
import { describe, expect, it } from "vitest";
import { BOM, csv, field, isoUtc, line } from "./csv";

describe("csv", () => {
  it("starts with the BOM and quotes every field", () => {
    const text = csv([["Sample data, invented"]], ["Respondent", "Reason"], [["Ana Pop", 'Says "no", then\nyes'], ["Bo", null]]);
    expect(text.startsWith(BOM)).toBe(true);
    expect(text.slice(1)).toBe('"Sample data, invented"\r\n"Respondent","Reason"\r\n"Ana Pop","Says ""no"", then\nyes"\r\n"Bo",""\r\n');
  });
  it("writes numbers and empty cells as text in quotes", () => {
    expect(line([3, undefined, "ă ș ț"])).toBe('"3","","ă ș ț"\r\n');
    expect(field('"')).toBe('""""');
  });
  it("writes dates as ISO 8601 with the UTC offset", () => {
    expect(isoUtc(new Date("2026-10-09T16:30:00.000Z"))).toBe("2026-10-09T16:30:00+00:00");
    expect(isoUtc(null)).toBe("");
  });
});
