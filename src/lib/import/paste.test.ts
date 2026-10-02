import { describe, expect, it } from "vitest";
import { parsePaste, pasteError, pastedRows, stripMarker, PASTE_COPY } from "./paste";

describe("parsePaste (stories/E3-4)", () => {
  it("strips leading numbers, bullets and dashes (acceptance 1)", () => {
    for (const [line, expected] of [["1. Receipts by phone", "Receipts by phone"], ["- Approve from email", "Approve from email"], ["• Pay by payroll", "Pay by payroll"], ["a) Travel advances", "Travel advances"], ["(12) Per diems", "Per diems"], ["3) * Mileage", "Mileage"], ["Plain line", "Plain line"], ["2024 budget rules", "2024 budget rules"]]) {
      expect(stripMarker(line), line).toBe(expected);
    }
  });
  it("skips empty lines and lines that are only a marker", () => {
    expect(parsePaste("1. One\n\n   \n2. \n- Two\r\n")).toEqual([{ text: "One", area: "", value: "" }, { text: "Two", area: "", value: "" }]);
  });
  it("fills the area and the proposed value from a bar-separated line (acceptance 3)", () => {
    expect(parsePaste("OCR receipts | Submitting | Must\nApprove from email | Approving\nPay by payroll")).toEqual([
      { text: "OCR receipts", area: "Submitting", value: "Must" },
      { text: "Approve from email", area: "Approving", value: "" },
      { text: "Pay by payroll", area: "", value: "" },
    ]);
    expect(pastedRows(parsePaste("A | B | C | ignored"))).toEqual([["A", "B", "C"]]);
  });
  it("needs two lines (acceptance 2)", () => {
    expect(pasteError(parsePaste("Only one"))).toBe(PASTE_COPY.tooFew);
    expect(pasteError(parsePaste(""))).toBe(PASTE_COPY.tooFew);
    expect(pasteError(parsePaste("One\nTwo"))).toBeNull();
  });
});
