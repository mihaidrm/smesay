// The Results filter in the URL (stories/E8-1, acceptance 3 and 7): read against the
// instrument (unknown keys, options and names dropped), written back in a fixed order, the
// include-unsubmitted switch from the URL or the PM's stored choice (default on), described
// for the "Showing" line; the tiles' catalogue, the stored and posted choices, the values.
import { describe, expect, it } from "vitest";
import { clearedFilter, describeFilter, filterActive, filterQuery, nextSort, parseResultsFilter, type FilterContext } from "@/lib/results-filter";
import { agreementPercent, DEFAULT_TILES, parseTileChoice, storedTiles, tabCounts, tileView, type ResultsNumbers } from "@/lib/results-tiles";

const ctx: FilterContext = {
  fields: [
    { key: "name", label: "Name", type: "text", mandatory: true },
    { key: "role", label: "Role", type: "dropdown", mandatory: true, options: ["Sales", "Finance", "HR"] },
  ],
  perspectives: ["Finance", "Sales"],
};
const read = (q: string, stored: boolean | null = null) => parseResultsFilter(Object.fromEntries([...new URLSearchParams(q).keys()].map((k) => [k, new URLSearchParams(q).getAll(k)])), ctx, stored);

describe("the Results filter", () => {
  it("reads only what the instrument has", () => {
    const f = read("f.role=Sales&f.role=Nope&f.role=Sales&f.name=%20okafor%20&f.secret=x&kind=disagree&kind=agree&kind=bogus&comment=1&perspective=Finance&status=inProgress&status=x");
    expect(f).toEqual({ fields: { role: ["Sales"], name: "okafor" }, kinds: ["agree", "disagree"], withComment: true, perspective: "Finance", status: ["inProgress"], includeUnsubmitted: true, sort: null });
    expect(read("perspective=HR&comment=yes").perspective).toBeNull();
    expect(read("comment=yes").withComment).toBe(false);
    expect(read("f.name=" + "x".repeat(150)).fields.name).toHaveLength(100);
    expect(read("f.name=%20%20").fields).toEqual({});
  });

  it("takes the switch from the URL, else the PM's choice, else on", () => {
    expect([read("").includeUnsubmitted, read("", false).includeUnsubmitted, read("unsubmitted=1", false).includeUnsubmitted, read("unsubmitted=0", true).includeUnsubmitted]).toEqual([true, false, true, false]);
  });

  it("writes the same URL for the same filter and keeps the tab", () => {
    const f = read("status=submitted&kind=unclear&f.role=Finance&comment=1");
    expect(filterQuery(f, ctx, { tab: "pushed" })).toBe("tab=pushed&f.role=Finance&kind=unclear&comment=1&status=submitted&unsubmitted=1");
    expect(read(filterQuery(f, ctx))).toEqual(f);
    // The switch is always written, so a shared view reads the same for anyone whatever their
    // stored choice.
    expect(read(filterQuery({ ...f, includeUnsubmitted: false }, ctx), true).includeUnsubmitted).toBe(false);
    expect(read(filterQuery(f, ctx), false).includeUnsubmitted).toBe(true);
  });

  it("reads a sort in a safe shape, writes it back, and flips it on the same column", () => {
    expect(read("sort=submitted&dir=desc").sort).toEqual({ key: "submitted", dir: "desc" });
    expect(read("sort=field.role").sort).toEqual({ key: "field.role", dir: "asc" });
    expect([read("sort=1;drop").sort, read("sort=").sort, read("sort=" + "a".repeat(80)).sort]).toEqual([null, null, null]);
    expect(filterQuery(read("sort=name&dir=desc&f.role=HR"), ctx)).toBe("f.role=HR&unsubmitted=1&sort=name&dir=desc");
    expect([nextSort(null, "name"), nextSort({ key: "name", dir: "asc" }, "name"), nextSort({ key: "name", dir: "desc" }, "name"), nextSort({ key: "name", dir: "asc" }, "status")]).toEqual([{ key: "name", dir: "asc" }, { key: "name", dir: "desc" }, { key: "name", dir: "asc" }, { key: "status", dir: "asc" }]);
    expect(filterActive(read("sort=name"))).toBe(false);
  });

  it("says what narrows, and clearing keeps the switch", () => {
    const f = read("f.role=Sales&f.role=Finance&f.name=ok&kind=change&comment=1&perspective=Sales&status=submitted", false);
    expect(describeFilter(f, ctx)).toBe('Name contains "ok"; Role: Sales, Finance; Different priority; With a reason or comment; Perspective: Sales; Submitted');
    expect(filterActive(f)).toBe(true);
    expect(clearedFilter(f)).toEqual({ fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null });
    expect(filterActive(read("unsubmitted=0"))).toBe(false);
  });
});

const n: ResultsNumbers = { invited: 7, submitted: 5, inProgress: 1, shown: 5, total: 5, agree: 19, change: 7, disagree: 2, unclear: 2, pick: 0, answered: 30, withComment: 11, missing: 1, unansweredItems: 0, fullyAgreed: 1, pushedBackItems: 5, medianMinutes: null, anyAnswer: true, actions: 4 };

describe("the tiles", () => {
  it("keeps a stored choice of known tiles, once each, at most six, else the default six", () => {
    expect(storedTiles(["missing", "agreement", "missing", "bogus"])).toEqual(["missing", "agreement"]);
    expect(storedTiles(["submitted", "agreement", "change", "disagree", "unclear", "missing", "inProgress"])).toHaveLength(6);
    expect([storedTiles(null), storedTiles([]), storedTiles(["bogus"]), storedTiles("agreement")]).toEqual([null, null, null, null]);
    expect(DEFAULT_TILES).toEqual(["submitted", "agreement", "change", "disagree", "unclear", "missing"]);
  });

  it("takes one to six tiles from the chooser, in the catalogue's order", () => {
    expect(parseTileChoice(["medianMinutes", "submitted", "nope"])).toEqual(["submitted", "medianMinutes"]);
    expect(parseTileChoice([])).toEqual({ error: "Pick at least one tile." });
    expect(parseTileChoice(["submitted", "agreement", "change", "disagree", "unclear", "missing", "inProgress"])).toEqual({ error: "Pick up to six tiles." });
  });

  it("shows the sample's numbers as the board does", () => {
    expect(tileView("submitted", n)).toEqual({ id: "submitted", value: "5 of 7", label: "Submitted of invited", tone: "ink" });
    expect(tileView("agreement", n)).toMatchObject({ value: "63%", label: "Agreement, 19 of 30 answers" });
    expect(tileView("agreement", { ...n, agree: 0, answered: 0 }).value).toBe("None yet");
    expect(tileView("medianMinutes", n).value).toBe("None yet");
    expect(tileView("medianMinutes", { ...n, medianMinutes: 42 }).value).toBe("42");
    expect(agreementPercent({ agree: 23, answered: 34 })).toBe(68);
    expect(tabCounts(n)).toEqual({ pushed: 9, questions: 3, actions: 4 });
  });
});
