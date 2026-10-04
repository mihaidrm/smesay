// The item detail's logic (stories/E8-5): the counts shown per item and the pill per row.
import { describe, expect, it } from "vitest";
import { detailCountKeys, itemParam, rowPill, showValue } from "./results-detail";

const LABELS = { notStarted: "Not started", inProgress: "In progress" };

describe("detailCountKeys", () => {
  it("shows the four kinds where the item has a proposal shown", () => {
    expect(detailCountKeys("S")).toEqual(["agree", "change", "disagree", "unclear", "notYet"]);
  });
  it("shows Rated and Unclear where the item has none, whatever the instrument shows", () => {
    expect(detailCountKeys(null)).toEqual(["pick", "unclear", "notYet"]);
  });
});

describe("rowPill", () => {
  it("gives the four verdicts their status, Different priority in the pushed back tint", () => {
    expect(rowPill({ kind: "agree", invited: false, submitted: true }, LABELS)).toEqual({ type: "status", status: "agree", label: "Agree" });
    expect(rowPill({ kind: "change", invited: false, submitted: true }, LABELS)).toEqual({ type: "status", status: "pushedBack", label: "Different priority" });
    expect(rowPill({ kind: "disagree", invited: false, submitted: true }, LABELS)).toEqual({ type: "status", status: "disagree", label: "Disagree" });
    expect(rowPill({ kind: "unclear", invited: false, submitted: false }, LABELS)).toEqual({ type: "status", status: "unclear", label: "Unclear" });
  });
  it("gives Rated the neutral pill", () => {
    expect(rowPill({ kind: "pick", invited: false, submitted: true }, LABELS)).toEqual({ type: "neutral", label: "Rated" });
  });
  it("reads Not started, Not answered or In progress without an answer that counts", () => {
    expect(rowPill({ kind: null, invited: true, submitted: false }, LABELS)).toEqual({ type: "neutral", label: "Not started" });
    expect(rowPill({ kind: null, invited: false, submitted: true }, LABELS)).toEqual({ type: "notAnswered" });
    expect(rowPill({ kind: null, invited: false, submitted: false }, LABELS)).toEqual({ type: "neutral", label: "In progress" });
  });
});

describe("showValue", () => {
  it("shows a value only where it differs from the proposal", () => {
    expect(showValue("M", "S")).toBe(true);
    expect(showValue("S", "S")).toBe(false);
    expect(showValue(null, "S")).toBe(false);
  });
  it("shows every value on an item with no proposal", () => {
    expect(showValue("S", null)).toBe(true);
  });
});

describe("itemParam", () => {
  it("keeps an id and drops anything else", () => {
    expect(itemParam("0b6f1c9e-4c1a-4f7e-9d3b-2a1e5c7d9f00")).toBe("0b6f1c9e-4c1a-4f7e-9d3b-2a1e5c7d9f00");
    expect(itemParam("CL-04")).toBeNull();
    expect(itemParam(["0b6f1c9e-4c1a-4f7e-9d3b-2a1e5c7d9f00"])).toBeNull();
    expect(itemParam(undefined)).toBeNull();
  });
});
