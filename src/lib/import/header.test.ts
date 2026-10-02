// Acceptance 5 of stories/E3-2: the six fixtures (invented, decision 0002) through parseFile()
// and detectHeader(); the expected row is found, or null asks for the picker.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { columnLetter, detectHeader, isHeaderLike, isTyped } from "./header";
import { decode, extensionOf, kindOf, parseFile, type UploadKind } from "./parse";

const fixture = async (name: string) => {
  const kind = kindOf(name) as UploadKind;
  const parsed = await parseFile(kind, new Uint8Array(readFileSync(`src/lib/import/fixtures/${name}`)));
  return parsed.sheets;
};

describe("detectHeader on the fixtures", () => {
  it("clean.csv: row 1", async () => {
    const [sheet] = await fixture("clean.csv");
    expect(sheet.rows[0]).toEqual(["Ref", "Requirement", "Module", "Priority"]);
    expect(sheet.rows).toHaveLength(7);
    expect(detectHeader(sheet.rows)).toBe(1);
  });
  it("no-header.csv: no row qualifies, the picker is asked for", async () => {
    const [sheet] = await fixture("no-header.csv");
    expect(sheet.rows).toHaveLength(6);
    expect(detectHeader(sheet.rows)).toBeNull();
  });
  it("header-row-3.csv: row 3, below a title and an export line", async () => {
    const [sheet] = await fixture("header-row-3.csv");
    expect(sheet.rows[0][0]).toBe("Expense tool requirements");
    expect(detectHeader(sheet.rows)).toBe(3);
  });
  it("semicolons.csv: the delimiter is guessed, row 1", async () => {
    const [sheet] = await fixture("semicolons.csv");
    expect(sheet.rows[0]).toEqual(["Ref", "Requirement", "Module", "Priority"]);
    expect(sheet.rows[1][1]).toContain("OCR receipt capture");
    expect(detectHeader(sheet.rows)).toBe(1);
  });
  it("utf16.csv: the byte order mark picks UTF-16, row 1", async () => {
    const bytes = new Uint8Array(readFileSync("src/lib/import/fixtures/utf16.csv"));
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xfe]);
    expect(decode(bytes).startsWith("Ref,Requirement")).toBe(true);
    const [sheet] = await fixture("utf16.csv");
    expect(sheet.rows[0]).toEqual(["Ref", "Requirement", "Module", "Priority"]);
    expect(detectHeader(sheet.rows)).toBe(1);
  });
  it("title-row.xlsx: row 3, below a title and a blank row", async () => {
    const [sheet] = await fixture("title-row.xlsx");
    expect(sheet.name).toBe("Requirements");
    expect(sheet.rows[0][0]).toBe("Expense tool requirements, v3");
    expect(sheet.rows[1].every((c) => c === "")).toBe(true);
    expect(detectHeader(sheet.rows)).toBe(3);
  });
  it("two-sheets.xlsx: every sheet comes back with its name and rows", async () => {
    const sheets = await fixture("two-sheets.xlsx");
    expect(sheets.map((s) => [s.name, s.rows.length])).toEqual([["Notes", 1], ["Requirements", 7], ["Old", 3]]);
    expect(detectHeader(sheets[0].rows)).toBeNull();
    expect(detectHeader(sheets[1].rows)).toBe(1);
  });
});

describe("the cell rules", () => {
  it("typed cells are numbers, dates and booleans", () => {
    for (const c of ["12", "1,200.50", "-3", "45%", "2026-10-02", "02/10/2026", "yes", "FALSE"]) expect(isTyped(c), c).toBe(true);
    for (const c of ["Ref", "CL-01", "Must", "Q4 2026"]) expect(isTyped(c), c).toBe(false);
  });
  it("header-like cells are short text", () => {
    expect(isHeaderLike("Requirement")).toBe(true);
    expect(isHeaderLike("")).toBe(false);
    expect(isHeaderLike("12")).toBe(false);
    expect(isHeaderLike("x".repeat(41))).toBe(false);
  });
  it("column letters follow the sheet", () => {
    expect([0, 1, 25, 26, 27, 701, 702].map(columnLetter)).toEqual(["A", "B", "Z", "AA", "AB", "ZZ", "AAA"]);
  });
  it("the kind comes from the extension, lower-cased", () => {
    expect(kindOf("List.XLSX")).toBe("xlsx");
    expect(kindOf("list.csv")).toBe("csv");
    expect(kindOf("list.pdf")).toBeNull();
    expect(kindOf("list")).toBeNull();
    expect(extensionOf("a.b.PDF")).toBe("pdf");
  });
  it("a file that is not a workbook is refused as unreadable", async () => {
    await expect(parseFile("xlsx", new TextEncoder().encode("%PDF-1.4 not a workbook"))).rejects.toThrow("could not be read");
  });
});
