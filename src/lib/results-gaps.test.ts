// Where groups disagree (stories/E8-6): the items shown, their order and the groups' order.
import { describe, expect, it } from "vitest";
import { allAgree, orderGaps, topGaps } from "./results-gaps";

const g = (group: string, agree: number, answered: number) => ({ group, agree, answered, compared: answered >= 3 });

describe("orderGaps", () => {
  it("keeps only the items in the list given (those with a proposal shown)", () => {
    const rows = [{ itemId: "rated", gap: 80, groups: [] }, { itemId: "a", gap: 10, groups: [] }];
    expect(orderGaps(rows, ["a"]).map((r) => r.itemId)).toEqual(["a"]);
  });
  it("orders by the gap, largest first, then by the list's order, items with no gap last", () => {
    const rows = [{ itemId: "c", gap: 20, groups: [] }, { itemId: "a", gap: null, groups: [] }, { itemId: "b", gap: 20, groups: [] }, { itemId: "d", gap: 40, groups: [] }];
    expect(orderGaps(rows, ["a", "b", "c", "d"]).map((r) => r.itemId)).toEqual(["d", "b", "c", "a"]);
  });
  it("orders groups by name in any case, Not given last", () => {
    const rows = [{ itemId: "a", gap: 0, groups: [g("", 1, 3), g("sales", 1, 3), g("Finance", 1, 3)] }];
    expect(orderGaps(rows, ["a"])[0].groups.map((x) => x.group)).toEqual(["Finance", "sales", ""]);
  });
});

describe("topGaps", () => {
  it("shows at most four items, and none whose groups agree to the point", () => {
    const rows = [50, 40, 30, 20, 10, 0].map((gap, i) => ({ itemId: `i${i}`, gap, groups: [] }));
    expect(topGaps(rows).map((r) => r.gap)).toEqual([50, 40, 30, 20]);
    expect(topGaps([{ itemId: "a", gap: 0, groups: [] }, { itemId: "b", gap: null, groups: [] }])).toEqual([]);
  });
});

describe("allAgree", () => {
  it("is true when groups are compared on some item and agree on every one", () => {
    expect(allAgree([{ itemId: "a", gap: 0, groups: [] }, { itemId: "b", gap: null, groups: [] }])).toBe(true);
    expect(allAgree([{ itemId: "a", gap: 0, groups: [] }, { itemId: "b", gap: 5, groups: [] }])).toBe(false);
    expect(allAgree([{ itemId: "a", gap: null, groups: [] }])).toBe(false);
  });
});
