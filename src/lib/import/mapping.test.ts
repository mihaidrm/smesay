import { describe, expect, it } from "vitest";
import { applyMapping, cleanMapping, columnKeys, customCount, guessMapping, headersKey, MAPPING_COPY, mappingError, ROLES } from "./mapping";

const MARLOW = [{ letter: "A", name: "Ref" }, { letter: "B", name: "Requirement" }, { letter: "C", name: "Module" }, { letter: "D", name: "Priority" }];

describe("the mapping rules (stories/E3-3)", () => {
  it("keys columns by header, or by letter without one, and the headers key is order-free", () => {
    expect(columnKeys([{ letter: "A", name: "Ref" }, { letter: "B", name: " Requirement " }, { letter: "C", name: "" }])).toEqual(["Ref", "Requirement", "C"]);
    expect(headersKey(MARLOW)).toBe(headersKey([...MARLOW].reverse()));
    expect(headersKey(MARLOW)).not.toBe(headersKey(MARLOW.slice(0, 3)));
  });
  it("keeps two columns apart when their headers repeat or read like a letter (audit finding 1)", () => {
    const twice = [{ letter: "A", name: "Requirement" }, { letter: "B", name: "Requirement" }, { letter: "C", name: "B" }, { letter: "D", name: "" }];
    expect(columnKeys(twice)).toEqual(["Requirement (A)", "Requirement (B)", "B", "D"]);
    const letterClash = [{ letter: "A", name: "B" }, { letter: "B", name: "" }];
    expect(columnKeys(letterClash)).toEqual(["B (A)", "B"]);
    expect(guessMapping(twice)).toEqual({ "Requirement (A)": "text", "Requirement (B)": "skip", B: "skip", D: "skip" });
    expect(cleanMapping(twice, { "Requirement (A)": "skip", "Requirement (B)": "text" })).toEqual({ "Requirement (A)": "skip", "Requirement (B)": "text", B: "skip", D: "skip" });
  });
  it("guesses the usual headers and skips the rest", () => {
    expect(guessMapping(MARLOW)).toEqual({ Ref: "ref", Requirement: "text", Module: "area", Priority: "value" });
    expect(guessMapping([{ letter: "A", name: "Owner" }, { letter: "B", name: "Description" }])).toEqual({ Owner: "skip", Description: "text" });
    expect(guessMapping([{ letter: "A", name: "" }, { letter: "B", name: "" }])).toEqual({ A: "text", B: "skip" });
    expect(guessMapping([{ letter: "A", name: "ID" }, { letter: "B", name: "Key" }])).toEqual({ ID: "ref", Key: "skip" });
  });
  it("lets the latest pick win a single role, and guesses a notes column as context (design note 120)", () => {
    const columns = [{ letter: "A", name: "Ref" }, { letter: "B", name: "Requirement" }, { letter: "C", name: "Module" }];
    expect(cleanMapping(columns, { Ref: "ref", Requirement: "text", Module: "ref" }, "Module")).toEqual({ Ref: "skip", Requirement: "text", Module: "ref" });
    expect(cleanMapping(columns, { Ref: "ref", Requirement: "text", Module: "ref" })).toEqual({ Ref: "ref", Requirement: "text", Module: "skip" });
    expect(cleanMapping(columns, { Ref: "context", Requirement: "text", Module: "context" }, "Ref")).toEqual({ Ref: "context", Requirement: "text", Module: "skip" });
    expect(guessMapping([{ letter: "A", name: "Requirement" }, { letter: "B", name: "Notes" }])).toEqual({ Requirement: "text", Notes: "context" });
    expect(ROLES.map((r) => r.value)).toEqual(["text", "area", "value", "ref", "context", "custom", "skip"]);
    expect(ROLES.every((r) => r.hint.length > 0)).toBe(true);
  });
  it("cleans a form mapping: one column per single role, five custom fields at most, unknown roles skipped", () => {
    const columns = Array.from({ length: 8 }, (_, i) => ({ letter: String.fromCharCode(65 + i), name: `H${i}` }));
    const raw = { H0: "text", H1: "text", H2: "custom", H3: "custom", H4: "custom", H5: "custom", H6: "custom", H7: "custom", H9: "area", bogus: "ref" };
    const cleaned = cleanMapping(columns, raw);
    expect(cleaned).toEqual({ H0: "text", H1: "skip", H2: "custom", H3: "custom", H4: "custom", H5: "custom", H6: "custom", H7: "skip" });
    expect(customCount(cleaned)).toBe(5);
    expect(cleanMapping(columns.slice(0, 1), { H0: "nonsense" })).toEqual({ H0: "skip" });
  });
  it("requires a text column", () => {
    expect(mappingError({ Ref: "ref", Requirement: "text" })).toBeNull();
    expect(mappingError({ Ref: "ref", Requirement: "skip" })).toBe(MAPPING_COPY.noText);
  });
  it("applies a remembered mapping to the same headers in another order", () => {
    const remembered = guessMapping(MARLOW);
    expect(applyMapping([...MARLOW].reverse(), remembered)).toEqual({ Priority: "value", Module: "area", Requirement: "text", Ref: "ref" });
    expect(applyMapping([{ letter: "A", name: "Ref" }, { letter: "B", name: "New" }], remembered)).toEqual({ Ref: "ref", New: "skip" });
  });
});
