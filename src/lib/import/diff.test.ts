import { describe, expect, it } from "vitest";
import { diffLine, diffVersions } from "./diff";

const V1 = [
  { ref: "CL-01", text: "OCR receipt capture" },
  { ref: "CL-02", text: "Multi-allocation of one expense line" },
  { ref: "CL-03", text: "Approve from email" },
  { ref: null, text: "Mileage from addresses" },
  { ref: null, text: "Per diem by country" },
];
const V2 = [
  { ref: "CL-01", text: "OCR receipt capture" },
  { ref: "CL-02", text: "Multi-allocation of one expense line to several cost centres" },
  { ref: "CL-09", text: "Approve from email" },
  { ref: null, text: "Mileage   from addresses" },
  { ref: "CL-10", text: "Payment file for the bank" },
];

describe("diffVersions (stories/E3-6, acceptance 4)", () => {
  it("matches by reference first, then by exact text, and counts the rest", () => {
    // CL-01 unchanged; CL-02 changed; CL-03 gone by ref but its text matches CL-09, so
    // unchanged; the mileage line matches by text (whitespace collapsed); per diem gone;
    // CL-10 new.
    expect(diffVersions(V1, V2)).toEqual({ unchanged: 3, changed: 1, added: 1, gone: 1 });
  });
  it("counts an empty old version as all new, and an empty new version as all gone", () => {
    expect(diffVersions([], V2)).toEqual({ unchanged: 0, changed: 0, added: 5, gone: 0 });
    expect(diffVersions(V1, [])).toEqual({ unchanged: 0, changed: 0, added: 0, gone: 5 });
  });
  it("does not match one old item twice", () => {
    expect(diffVersions([{ ref: null, text: "Same" }], [{ ref: null, text: "Same" }, { ref: null, text: "Same" }])).toEqual({ unchanged: 1, changed: 0, added: 1, gone: 0 });
  });
  it("writes the line", () => {
    expect(diffLine({ unchanged: 3, changed: 1, added: 1, gone: 1 })).toBe("3 items unchanged, 1 changed, 1 new, 1 gone");
    expect(diffLine({ unchanged: 1, changed: 0, added: 0, gone: 0 })).toBe("1 item unchanged, 0 changed, 0 new, 0 gone");
  });
});
