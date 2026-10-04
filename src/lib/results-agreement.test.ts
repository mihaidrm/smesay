// The Agreement tab's model (stories/E8-3): areas in the list's order with an area for the
// loose items, totals and percentages recomputed from the counts, the sort within an area both
// ways with ties in the list's order, groups of fewer than 3 answers drawn but not compared,
// and the series every view draws (the kinds, or the values picked where no proposal was shown).
import { describe, expect, it } from "vitest";
import { buildAgreement, kindSeries, notAnsweredOf, percentOf, sortRows, valueSeries, type Counts } from "@/lib/results-agreement";

const c = (agree: number, change = 0, disagree = 0, unclear = 0, couldSee = agree + change + disagree + unclear, pick = 0, values: Record<string, number> = {}): Counts => ({ agree, change, disagree, unclear, pick, values, couldSee });
const items = [
  { id: "i1", reference: "CL-01", title: "One", area: "Submitting", proposed: "M", position: 1 },
  { id: "i2", reference: "CL-02", title: "Two", area: "Submitting", proposed: "S", position: 2 },
  { id: "i3", reference: "CL-03", title: "Three", area: "Paying", proposed: "M", position: 3 },
  { id: "i4", reference: null, title: "Loose", area: null, proposed: null, position: 4 },
];
const counts = [
  { itemId: "i1", group: null, ...c(4, 1, 0, 0, 5) },
  { itemId: "i2", group: null, ...c(1, 2, 1, 1, 6) },
  { itemId: "i3", group: null, ...c(3, 0, 1, 0, 4) },
];

describe("the Agreement tab's model", () => {
  it("keeps the list's areas in order, then the loose items, with totals and percentages", () => {
    const areas = buildAgreement(items, ["Paying", "Submitting"], counts, false, { key: "ref", dir: "asc" });
    expect(areas.map((a) => a.name)).toEqual(["Paying", "Submitting", null]);
    const submitting = areas[1];
    expect(submitting.rows.map((r) => r.reference)).toEqual(["CL-01", "CL-02"]);
    expect([submitting.totals.agree, submitting.totals.change, submitting.percent, submitting.notAnswered]).toEqual([5, 3, 50, 1]);
    expect(areas[2].rows[0]).toMatchObject({ title: "Loose", percent: null, notAnswered: 0 });
    expect([percentOf(c(19, 7, 2, 2)), percentOf(c(23, 7, 2, 2)), percentOf(c(1, 1)), percentOf(c(0))]).toEqual([63, 68, 50, null]);
  });

  it("sorts within an area both ways, ties in the list's order", () => {
    const rows = buildAgreement(items, ["Submitting"], counts, false, { key: "ref", dir: "asc" })[0].rows;
    expect(sortRows(rows, { key: "change", dir: "desc" }).map((r) => r.id)).toEqual(["i2", "i1"]);
    expect(sortRows(rows, { key: "agreement", dir: "asc" }).map((r) => r.id)).toEqual(["i2", "i1"]);
    expect(sortRows(rows, { key: "ref", dir: "desc" }).map((r) => r.id)).toEqual(["i2", "i1"]);
    const tied = [{ ...rows[0], counts: c(1, 0, 1) }, { ...rows[1], counts: c(1, 0, 1) }];
    expect(sortRows(tied, { key: "disagree", dir: "desc" }).map((r) => r.id)).toEqual(["i2", "i1"]);
    expect(sortRows(tied, { key: "disagree", dir: "asc" }).map((r) => r.id)).toEqual(["i1", "i2"]);
  });

  it("splits by group, comparing only groups of 3 answers or more", () => {
    const split = [
      { itemId: "i1", group: "Sales", ...c(2, 1, 0, 0, 3) },
      { itemId: "i1", group: "Finance", ...c(1, 0, 0, 0, 1) },
    ];
    const row = buildAgreement(items, ["Submitting"], split, true, { key: "ref", dir: "asc" })[0].rows[0];
    expect(row.groups.map((g) => [g.group, g.compared, g.percent])).toEqual([["Finance", false, 100], ["Sales", true, 67]]);
    expect([row.counts.agree, row.counts.change, row.percent]).toEqual([3, 1, 75]);
  });

  it("draws the kinds and Not answered, or the values picked where no proposal was shown", () => {
    expect(kindSeries(c(4, 1, 0, 0, 7)).map((s) => [s.key, s.value])).toEqual([["agree", 4], ["change", 1], ["disagree", 0], ["unclear", 0], ["none", 2]]);
    const blind = c(0, 0, 0, 1, 6, 4, { M: 3, S: 1 });
    expect(valueSeries(blind, "moscow", { M: "Essential" }).map((s) => [s.label, s.value])).toEqual([["Essential", 3], ["Should", 1], ["Could", 0], ["Not needed", 0], ["Unclear", 1], ["Not answered", 1]]);
    expect(kindSeries(blind).some((s) => s.key === "pick" && s.value === 4)).toBe(true);
    expect(notAnsweredOf(c(3, 0, 0, 0, 2))).toBe(0);
  });
});
