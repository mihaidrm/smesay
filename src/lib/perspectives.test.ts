// The perspective rule (stories/E5-4, acceptance 4): an instrument with three perspectives
// and the visible set for four respondent combinations, none included; the names and tags
// parsed with the rule.
import { describe, expect, it } from "vitest";
import { keptTags, parsePerspectives, parseTags, PERSPECTIVES_COPY, renamePairs, visibleItems } from "./perspectives";

const items = [
  { ref: "A", perspectives: [] as string[] },
  { ref: "B", perspectives: ["Finance"] },
  { ref: "C", perspectives: ["Sales"] },
  { ref: "D", perspectives: ["Finance", "Sales"] },
  { ref: "E", perspectives: ["HR"] },
];
const refs = (picked: string[]) => visibleItems(items, picked).map((i) => i.ref);

describe("visibleItems", () => {
  it("shows the untagged items plus the ones sharing a pick", () => {
    expect(refs([])).toEqual(["A"]);
    expect(refs(["Finance"])).toEqual(["A", "B", "D"]);
    expect(refs(["Sales", "HR"])).toEqual(["A", "C", "D", "E"]);
    expect(refs(["Finance", "Sales", "HR"])).toEqual(["A", "B", "C", "D", "E"]);
    expect(refs(["Legal"])).toEqual(["A"]);
  });
});

describe("parsePerspectives and parseTags", () => {
  it("reads one name per line with the rule", () => {
    expect(parsePerspectives("Finance\n\n Sales \nHR")).toEqual({ names: ["Finance", "Sales", "HR"] });
    expect(parsePerspectives("")).toEqual({ names: [] });
    expect(parsePerspectives(Array.from({ length: 11 }, (_, i) => `P${i}`).join("\n"))).toEqual({ error: PERSPECTIVES_COPY.tooMany });
    expect(parsePerspectives("x".repeat(31))).toEqual({ error: PERSPECTIVES_COPY.badName });
    expect(parsePerspectives("Finance\nfinance")).toEqual({ error: PERSPECTIVES_COPY.sameName });
    expect(parsePerspectives(5)).toEqual({ error: PERSPECTIVES_COPY.badShape });
  });
  it("accepts tags that are defined and refuses the rest", () => {
    expect(parseTags(JSON.stringify(["Sales", "Sales", " Finance "]), ["Finance", "Sales"])).toEqual({ tags: ["Sales", "Finance"] });
    expect(parseTags([], ["Finance"])).toEqual({ tags: [] });
    expect(parseTags(JSON.stringify(["Legal"]), ["Finance"])).toEqual({ error: PERSPECTIVES_COPY.unknownTag });
    expect(parseTags("nope", ["Finance"])).toEqual({ error: PERSPECTIVES_COPY.badShape });
    expect(parseTags([1], ["Finance"])).toEqual({ error: PERSPECTIVES_COPY.badShape });
    const pairs = renamePairs(["finance", "Legal"], ["Finance", "Sales"]);
    expect(pairs).toEqual([{ from: "finance", to: "Finance" }]);
    expect(keptTags(["finance", "Legal"], pairs)).toEqual(["Finance"]);
    expect(keptTags(["Legal"], renamePairs(["Legal"], []))).toEqual([]);
  });
});
