// stories/E3-5, acceptance 4: a fixture with 3 empty rows, 2 duplicates and 1 long item, the
// counts and the kept references; the unrecognised values line from E3-3.
import { describe, expect, it } from "vitest";
import { checkRows, ITEM_LIMIT } from "./report";

const COLUMNS = [{ letter: "A", name: "Ref" }, { letter: "B", name: "Requirement" }, { letter: "C", name: "Module" }, { letter: "D", name: "Priority" }, { letter: "E", name: "Owner" }];
const MAPPING = { Ref: "ref", Requirement: "text", Module: "area", Priority: "value", Owner: "custom" } as const;
const ROWS = [
  ["CL-01", "OCR receipt capture", "Submitting", "Must", "Dana"],
  ["", "", "", "", ""],
  ["CL-02", "  OCR   receipt capture ", "Submitting", "M", ""],
  ["CL-03", "Approve from email", "Approving", "High", "Ravi"],
  ["CL-04", "", "Paying", "", ""],
  ["CL-05", "x".repeat(ITEM_LIMIT + 1), "Paying", "3", ""],
  ["CL-06", "approve from email", "Approving", "", ""],
  ["CL-07", "Approve from email", "Approving", "keep", ""],
  ["", "   ", "", "", ""],
];

describe("checkRows", () => {
  const result = checkRows(COLUMNS, MAPPING, ROWS, 2, 1);
  it("counts empty rows, exact duplicates and long items, and lists the rows", () => {
    expect(result.report).toEqual({ rowsRead: 9, headerRow: 1, emptyRows: 3, exactDuplicates: 2, overLimit: 1, unrecognisedValues: 1, duplicateRefs: [{ kept: "CL-01", folded: ["CL-02"] }, { kept: "CL-03", folded: ["CL-07"] }] });
    expect(result.emptyRows).toEqual([3, 6, 10]);
    expect(result.duplicateRows).toEqual([{ row: 4, keptRow: 2 }, { row: 9, keptRow: 5 }]);
    expect(result.longRows).toEqual([7]);
    expect(result.unrecognisedRows).toEqual([{ row: 5, value: "High" }]);
  });
  it("keeps the first of the duplicates with the folded references, case kept, whitespace collapsed", () => {
    expect(result.items.map((i) => [i.ref, i.text.slice(0, 20), i.value, i.area])).toEqual([
      ["CL-01", "OCR receipt capture", "Must", "Submitting"],
      ["CL-03", "Approve from email", "High", "Approving"],
      ["CL-05", "x".repeat(20), "3", "Paying"],
      ["CL-06", "approve from email", null, "Approving"],
    ]);
    expect(result.items[0].custom).toEqual({ Owner: "Dana" });
    expect(result.items[2].text).toHaveLength(ITEM_LIMIT + 1);
    expect(result.items[3].custom).toEqual({});
  });
  it("works without a reference or custom column and names rows by number", () => {
    const r = checkRows([{ letter: "A", name: "Item" }], { Item: "text" }, [["Same"], ["Same"], ["Other"]], 1, null);
    expect(r.report.duplicateRefs).toEqual([{ kept: "row 1", folded: ["row 2"] }]);
    expect(r.items.map((i) => i.custom)).toEqual([null, null]);
    expect(r.report.headerRow).toBe(0);
  });
});
