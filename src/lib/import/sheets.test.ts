// stories/E3-7, acceptance 7: the sheet rule (which files get the step, which sheet is ticked
// first), the header row found per sheet, the union of columns, the missing-text sheet message,
// the per-sheet counts with one duplicate map and the sheet name as area.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sheetsMissingText, sheetsMissingTextError } from "./mapping";
import { parseFile, type ParsedFile } from "./parse";
import { buildPreview } from "./preview";
import { checkRows, checkSheets } from "./report";
import { needsSheetStep, sheetsWithRows, tickedNames, unionColumns } from "./sheets";

const HEADER = ["Ref", "Requirement", "Priority"];
const FILE: ParsedFile = {
  kind: "xlsx",
  sheets: [
    { name: "Cover", rows: [["Expense tool requirements, v3"], [""], ["", ""]] },
    { name: "Submitting", rows: [HEADER, ["SU-01", "Capture a receipt by phone", "Must"], ["SU-02", "Split one expense over two cost centres", "Should"], ["", "", ""], ["SU-03", "Capture a receipt by phone", "Could"]] },
    { name: "Approving", rows: [["Approval requirements"], [], ["Ref", "Requirement", "Owner"], ["AP-01", "Approve from the notification email", "Dana"], ["AP-02", "Flag claims outside the policy", "Ravi"]] },
    { name: "Notes", rows: [["Just one line here"]] },
    { name: "Empty", rows: [] },
  ],
};

describe("the sheet rule", () => {
  it("lists every sheet with at least one non-empty row, with that count", () => {
    expect(sheetsWithRows(FILE)).toEqual([{ name: "Cover", rows: 1 }, { name: "Submitting", rows: 4 }, { name: "Approving", rows: 4 }, { name: "Notes", rows: 1 }]);
  });
  it("gives the step to an xlsx with several such sheets and the first of them is ticked", () => {
    const preview = buildPreview(FILE);
    expect(preview.sheetRows?.map((s) => s.name)).toEqual(["Cover", "Submitting", "Approving", "Notes"]);
    expect(needsSheetStep({ kind: "xlsx", preview })).toBe(true);
    expect(tickedNames({ sheets: null, preview })).toEqual(["Cover"]);
    expect(tickedNames({ sheets: [{ name: "Submitting" }, { name: "Approving" }], preview })).toEqual(["Submitting", "Approving"]);
  });
  it("skips the step for one sheet with rows, a csv and a pasted list", () => {
    const one: ParsedFile = { kind: "xlsx", sheets: [{ name: "Empty", rows: [] }, { name: "List", rows: [HEADER, ["A-1", "Capture a receipt by phone", "Must"]] }] };
    expect(needsSheetStep({ kind: "xlsx", preview: buildPreview(one) })).toBe(false);
    expect(buildPreview(one).sheet).toBe("List");
    const csv: ParsedFile = { kind: "csv", sheets: [{ name: "csv", rows: [HEADER, ["A-1", "Capture a receipt by phone", "Must"]] }] };
    const csvPreview = buildPreview(csv);
    expect(csvPreview.sheetRows).toBeUndefined();
    expect(needsSheetStep({ kind: "csv", preview: csvPreview })).toBe(false);
    const pasted: ParsedFile = { kind: "pasted", sheets: [{ name: "pasted", rows: [["One", "", ""], ["Two", "", ""]] }] };
    expect(needsSheetStep({ kind: "pasted", preview: buildPreview(pasted) })).toBe(false);
  });
  it("the two-sheets fixture: three sheets with rows, the first ticked", async () => {
    const parsed = await parseFile("xlsx", new Uint8Array(readFileSync("src/lib/import/fixtures/two-sheets.xlsx")));
    expect(sheetsWithRows(parsed)).toEqual([{ name: "Notes", rows: 1 }, { name: "Requirements", rows: 7 }, { name: "Old", rows: 3 }]);
    expect(tickedNames({ sheets: null, preview: buildPreview(parsed) })).toEqual(["Notes"]);
  });
});

describe("the preview over several sheets", () => {
  const preview = buildPreview(FILE, { sheets: [{ name: "Submitting" }, { name: "Approving" }, { name: "Empty" }] });
  it("finds the header row per sheet with the same finder", () => {
    expect(preview.perSheet?.map((s) => [s.name, s.headerRow, s.rowsRead])).toEqual([["Submitting", 1, 4], ["Approving", 3, 2]]);
    expect(preview.sheet).toBe("Submitting");
    expect(preview.headerRow).toBe(1);
    expect(preview.rowsRead).toBe(6);
    expect(preview.rows).toHaveLength(4);
  });
  it("takes a header row picked for one sheet and leaves the other found", () => {
    const picked = buildPreview(FILE, { sheets: [{ name: "Submitting", headerRow: 0 }, { name: "Approving", headerRow: 1 }] });
    expect(picked.perSheet?.map((s) => [s.name, s.headerRow, s.rowsRead, s.columns[0].name])).toEqual([["Submitting", null, 5, ""], ["Approving", 1, 4, "Approval requirements"]]);
  });
  it("lists the columns of every ticked sheet once, by key, first seen first", () => {
    expect(preview.columns).toEqual([{ letter: "A", name: "Ref" }, { letter: "B", name: "Requirement" }, { letter: "C", name: "Priority" }, { letter: "C", name: "Owner" }]);
    expect(unionColumns([{ columns: [{ letter: "A", name: "" }, { letter: "B", name: "" }] }, { columns: [{ letter: "A", name: "" }, { letter: "B", name: "Text" }] }])).toEqual([{ letter: "A", name: "" }, { letter: "B", name: "" }, { letter: "B", name: "Text" }]);
  });
  it("one sheet ticked is the single-sheet path", () => {
    const one = buildPreview(FILE, { sheets: [{ name: "Approving" }] });
    expect(one.perSheet).toBeUndefined();
    expect([one.sheet, one.headerRow, one.rowsRead, one.columns.map((c) => c.name)]).toEqual(["Approving", 3, 2, ["Ref", "Requirement", "Owner"]]);
    expect(one).toEqual({ ...buildPreview(FILE, { sheet: "Approving" }) });
  });
  it("names the ticked sheets whose header lacks the item text column", () => {
    const sheets = preview.perSheet!;
    expect(sheetsMissingText(sheets, { Ref: "ref", Requirement: "text", Priority: "value", Owner: "custom" })).toBeNull();
    expect(sheetsMissingText(sheets, { Ref: "ref", Requirement: "skip", Priority: "text", Owner: "custom" })).toEqual({ column: "Priority", sheets: ["Approving"] });
    expect(sheetsMissingTextError({ column: "Priority", sheets: ["Approving"] })).toBe("Sheet Approving has no column Priority. Untick it, or map the item text to a column every ticked sheet has.");
    expect(sheetsMissingTextError({ column: "Priority", sheets: ["Approving", "Notes"] })).toBe("Sheets Approving and Notes have no column Priority. Untick them, or map the item text to a column every ticked sheet has.");
    expect(sheetsMissingText(sheets, { Ref: "ref" })).toBeNull();
  });
});

describe("checkSheets", () => {
  const preview = buildPreview(FILE, { sheets: [{ name: "Submitting" }, { name: "Approving" }] });
  const inputs = preview.perSheet!.map((p) => {
    const rows = FILE.sheets.find((s) => s.name === p.name)!.rows.slice(p.headerRow ?? 0);
    return { name: p.name, columns: p.columns, rows, firstRow: (p.headerRow ?? 0) + 1, headerRow: p.headerRow };
  });
  const mapping = { Ref: "ref", Requirement: "text", Priority: "value", Owner: "custom" } as const;
  it("counts per sheet, folds a duplicate across sheets into the first and keeps sheet order then row order", () => {
    const result = checkSheets(mapping, [...inputs, { name: "Again", columns: inputs[0].columns, rows: [["X-1", "Approve from the notification email", "Must"]], firstRow: 1, headerRow: null }], { sheetAsArea: false });
    expect(result.items.map((i) => [i.sheet, i.row, i.ref, i.area])).toEqual([["Submitting", 2, "SU-01", null], ["Submitting", 3, "SU-02", null], ["Approving", 4, "AP-01", null], ["Approving", 5, "AP-02", null]]);
    expect(result.report).toEqual({
      rowsRead: 7, headerRow: 1, emptyRows: 1, exactDuplicates: 2, overLimit: 0, unrecognisedValues: 0,
      duplicateRefs: [{ kept: "SU-01", folded: ["SU-03"] }, { kept: "AP-01", folded: ["X-1"] }],
      sheets: [
        { name: "Submitting", rowsRead: 4, headerRow: 1, items: 2, emptyRows: 1, exactDuplicates: 1, overLimit: 0, unrecognisedValues: 0 },
        { name: "Approving", rowsRead: 2, headerRow: 3, items: 2, emptyRows: 0, exactDuplicates: 0, overLimit: 0, unrecognisedValues: 0 },
        { name: "Again", rowsRead: 1, headerRow: 0, items: 0, emptyRows: 0, exactDuplicates: 1, overLimit: 0, unrecognisedValues: 0 },
      ],
    });
    expect(result.sheets?.map((s) => [s.emptyRows, s.duplicateRows])).toEqual([[[4], [{ row: 5, keptRow: 2, keptSheet: "Submitting" }]], [[], []], [[], [{ row: 1, keptRow: 4, keptSheet: "Approving" }]]]);
    expect(result.items[2].custom).toEqual({ Owner: "Dana" });
  });
  it("uses the sheet name as the area when the option is on and no area column is mapped", () => {
    const on = checkSheets(mapping, inputs, { sheetAsArea: true });
    expect(on.items.map((i) => i.area)).toEqual(["Submitting", "Submitting", "Approving", "Approving"]);
    const withArea = checkSheets({ Ref: "ref", Requirement: "text", Priority: "area", Owner: "custom" }, inputs, { sheetAsArea: true });
    expect(withArea.items.map((i) => i.area)).toEqual(["Must", "Should", null, null]);
  });
  it("checkRows on one sheet carries no sheet fields", () => {
    const single = checkRows(inputs[0].columns, mapping, inputs[0].rows, 2, 1);
    expect(single.sheets).toBeUndefined();
    expect(single.report.sheets).toBeUndefined();
    expect(single.items.every((i) => i.sheet === undefined)).toBe(true);
    expect(single.report.duplicateRefs).toEqual([{ kept: "SU-01", folded: ["SU-03"] }]);
  });
});
