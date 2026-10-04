// The Agreement tab's model (stories/E8-3): areas in the list's order with an area for the
// loose items, totals and percentages recomputed from the counts, the sort within an area both
// ways with ties in the list's order, groups of fewer than 3 answers drawn but not compared,
// and the series every view draws (the kinds, or the values picked where no proposal was shown).
import { describe, expect, it } from "vitest";
import { buildAgreement, figureOf, groupTotals, kindSeries, notAnsweredOf, percentOf, sortRows, valueSeries, type Counts } from "@/lib/results-agreement";

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
    const areas = buildAgreement(items, ["Paying", "Submitting"], counts, false, { key: "ref", dir: "asc" }, "Not given");
    expect(areas.map((a) => a.name)).toEqual(["Paying", "Submitting", null]);
    const submitting = areas[1];
    expect(submitting.rows.map((r) => r.reference)).toEqual(["CL-01", "CL-02"]);
    expect([submitting.totals.agree, submitting.totals.change, submitting.percent, submitting.notAnswered]).toEqual([5, 3, 50, 1]);
    expect(areas[2].rows[0]).toMatchObject({ title: "Loose", percent: null, notAnswered: 0 });
    expect([percentOf(c(19, 7, 2, 2)), percentOf(c(23, 7, 2, 2)), percentOf(c(1, 1)), percentOf(c(0))]).toEqual([63, 68, 50, null]);
  });

  it("sorts within an area both ways, ties in the list's order", () => {
    const rows = buildAgreement(items, ["Submitting"], counts, false, { key: "ref", dir: "asc" }, "Not given")[0].rows;
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
    const row = buildAgreement(items, ["Submitting"], split, true, { key: "ref", dir: "asc" }, "Not given")[0].rows[0];
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

  it("reads values rated with no proposal as rated, never as no answers or 0%", () => {
    expect(figureOf(c(0, 0, 0, 0, 10, 10))).toEqual({ rated: 10 });
    expect(figureOf(c(0, 0, 0, 1, 11, 10))).toEqual({ rated: 10 });
    // A proposal shown and only a question: 0%. No proposal shown (rated): 0 rated, never 0%.
    expect(figureOf(c(0, 0, 0, 1))).toEqual({ percent: 0 });
    expect(figureOf(c(0, 0, 0, 1), true)).toEqual({ rated: 0 });
    expect(figureOf(c(0, 0, 0, 1, 5, 4), true)).toEqual({ rated: 4 });
    expect(figureOf(c(0), true)).toBeNull();
    // An item with no proposal has no percentage, so it sorts with the unanswered.
    const blind = buildAgreement(items, [], [{ itemId: "i4", group: null, ...c(0, 0, 0, 1, 5, 4) }], false, { key: "ref", dir: "asc" }, "Not given");
    expect(blind.at(-1)!.rows[0].percent).toBeNull();
    expect(blind.at(-1)!.rated).toBe(true);
    expect(figureOf(c(3, 1))).toEqual({ percent: 75 });
    expect(figureOf(c(0))).toBeNull();
  });

  it("sorts by agreement with the items that have no percentage last, both ways", () => {
    const rows = buildAgreement(items, ["Submitting"], [{ itemId: "i1", group: null, ...c(1, 1) }, { itemId: "i2", group: null, ...c(0, 0, 0, 0, 3, 3) }], false, { key: "ref", dir: "asc" }, "Not given")[0].rows;
    expect(sortRows(rows, { key: "agreement", dir: "asc" }).map((r) => r.id)).toEqual(["i1", "i2"]);
    expect(sortRows(rows, { key: "agreement", dir: "desc" }).map((r) => r.id)).toEqual(["i1", "i2"]);
  });

  it("keeps the people who left the split field empty as a last group, so the groups add up", () => {
    const split = [
      { itemId: "i1", group: "Sales", ...c(2, 1, 0, 0, 3) },
      { itemId: "i1", group: null, ...c(1, 0, 1, 0, 2) },
      { itemId: "i1", group: "Finance", ...c(1, 0, 0, 0, 1) },
    ];
    const row = buildAgreement(items, ["Submitting"], split, true, { key: "ref", dir: "asc" }, "Not given")[0].rows[0];
    expect(row.groups.map((g) => g.group)).toEqual(["Finance", "Sales", "Not given"]);
    const sum = row.groups.reduce((a, g) => a + g.counts.agree + g.counts.change + g.counts.disagree + g.counts.unclear, 0);
    expect(sum).toBe(row.counts.agree + row.counts.change + row.counts.disagree + row.counts.unclear);
  });

  it("compares a group summed over items only with 3 answers and 3 people", () => {
    // One person in Finance answers both items: 2 answers, 1 person; Sales has 3 people.
    const split = [
      { itemId: "i1", group: "Finance", ...c(1, 0, 0, 0, 1) }, { itemId: "i2", group: "Finance", ...c(1, 0, 0, 0, 1) },
      { itemId: "i1", group: "Sales", ...c(2, 1, 0, 0, 3) }, { itemId: "i2", group: "Sales", ...c(3, 0, 0, 0, 3) },
    ];
    const one = [{ itemId: "i1", group: "HR", ...c(1, 0, 0, 0, 1) }, { itemId: "i2", group: "HR", ...c(1, 0, 0, 0, 1) }, { itemId: "i3", group: "HR", ...c(1, 0, 0, 0, 1) }];
    const rows = buildAgreement(items, ["Submitting", "Paying"], [...split, ...one], true, { key: "ref", dir: "asc" }, "Not given").flatMap((a) => a.rows);
    // HR: 3 answers from one person, never compared, and said why.
    expect(groupTotals(rows).map((g) => [g.group, g.counts.agree, g.compared, g.short])).toEqual([["Finance", 2, false, "answers"], ["HR", 3, false, "people"], ["Sales", 5, true, null]]);
    // People who could see an item but answered nothing do not make a group comparable.
    const seen = [{ itemId: "i1", group: "Finance", ...c(1, 0, 0, 0, 3) }, { itemId: "i2", group: "Finance", ...c(1, 0, 0, 0, 3) }, { itemId: "i3", group: "Finance", ...c(1, 0, 0, 0, 3) }];
    const seenRows = buildAgreement(items, ["Submitting", "Paying"], seen, true, { key: "ref", dir: "asc" }, "Not given").flatMap((a) => a.rows);
    expect(groupTotals(seenRows).map((g) => [g.group, g.compared, g.short])).toEqual([["Finance", false, "people"]]);
    // A dropdown option named like the empty group stays its own group.
    const named = buildAgreement(items, ["Submitting"], [{ itemId: "i1", group: "Not given", ...c(1) }, { itemId: "i1", group: null, ...c(1) }], true, { key: "ref", dir: "asc" }, "Not given")[0].rows;
    expect(groupTotals(named).map((g) => [g.group, g.empty])).toEqual([["Not given", false], ["Not given", true]]);
  });
});
