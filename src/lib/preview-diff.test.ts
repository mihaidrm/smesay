import { describe, expect, it } from "vitest";
import type { RespondentItem } from "@/lib/respondent-rules";
import { changedParts, changesLine, diffPreview, focusOf, type PreviewSnapshot } from "./preview-diff";

const item = (n: number, over: Partial<RespondentItem> = {}): RespondentItem => ({ id: `i${n}`, reference: `CL-0${n}`, title: `Item ${n}`, details: null, area: n <= 2 ? "Submitting" : "Approving", proposed: "M", perspectives: [], ...over });
const base = (): PreviewSnapshot => ({
  instrument: { title: "Expense tool", intro: null, fields: [{ key: "name", label: "Name", type: "text", mandatory: true }], perspectives: [], method: "moscow", labels: null, showProposed: true, layout: "chapters", reasonRule: "differs" },
  items: [item(1), item(2), item(3)],
  areas: [{ name: "Submitting", intro: null }, { name: "Approving", intro: null }],
  closing: { confidence: true, missingForm: true, signOffText: "" },
  closesAt: null,
});
const items = base().items;

describe("diffPreview", () => {
  it("is null when nothing changed", () => {
    expect(diffPreview(base(), base())).toBeNull();
  });
  it("sees the cards: wording, proposal, area, perspectives, new and removed", () => {
    const next = base();
    next.items = [item(1, { title: "Receipts by phone" }), item(2, { proposed: "S" }), item(4), item(5, { area: "Submitting" })];
    const prev = base();
    prev.items = [item(1), item(2), item(3), item(5, { area: "Approving", perspectives: ["Finance"] })];
    expect(diffPreview(prev, next)).toMatchObject({ wording: ["i1"], proposals: ["i2"], added: ["i4"], moved: ["i5"], tags: ["i5"], removed: 1, rating: false, sections: false, about: false, closing: false, note: false });
  });
  it("sees the instrument: the rating row, the chapter row, About you, the Wrap up, the date", () => {
    const next = base();
    next.instrument = { ...next.instrument, method: "fit", intro: "Six things.", layout: "page" };
    next.closing = { ...next.closing, missingForm: false };
    next.closesAt = "2026-11-01T00:00:00.000Z";
    expect(diffPreview(base(), next)).toMatchObject({ rating: true, sections: true, about: true, closing: true, note: true, wording: [] });
    const areas = base();
    areas.areas = [{ name: "Approving", intro: null }, { name: "Submitting", intro: null }];
    expect(diffPreview(base(), areas)).toMatchObject({ sections: true, rating: false });
    const method = base();
    method.instrument = { ...method.instrument, method: "fit" };
    method.items = [item(1, { proposed: null }), item(2, { proposed: null }), item(3)];
    expect(diffPreview(base(), method)).toMatchObject({ rating: true, proposals: [] });
    const labels = base();
    labels.instrument = { ...labels.instrument, labels: { M: "Essential" } as never };
    expect(diffPreview(base(), labels)).toMatchObject({ rating: true });
  });
});

describe("changedParts and changesLine", () => {
  const c = (over: Partial<ReturnType<typeof diffPreview>> = {}) => ({ wording: [], proposals: [], added: [], moved: [], tags: [], removed: 0, rating: false, sections: false, about: false, closing: false, note: false, ...over }) as NonNullable<ReturnType<typeof diffPreview>>;
  it("names up to three cards by their references and counts the rest", () => {
    expect(changedParts(c({ wording: ["i1", "i3"] }), items)).toEqual(["the wording on CL-01 and CL-03"]);
    expect(changedParts(c({ wording: ["i1", "i2", "i3", "i3"] }), items)).toEqual(["the wording on 4 cards"]);
    expect(changedParts(c({ added: ["i9"] }), items)).toEqual(["1 new card"]);
    expect(changedParts(c({ added: ["i1"] }), items)).toEqual(["a new card (CL-01)"]);
    expect(changedParts(c({ proposals: ["i2"], removed: 2 }), items)).toEqual(["2 cards removed", "the proposal on CL-02"]);
  });
  it("writes one sentence in the order respondents meet the parts", () => {
    expect(changesLine(c({ wording: ["i1"], rating: true, sections: true, about: true, closing: true, note: true }), items)).toBe("Your last save changed the wording on CL-01, the rating row, the chapter row, About you, the Wrap up and the closing date.");
    expect(changesLine(c({ rating: true }), items)).toBe("Your last save changed the rating row.");
    expect(changesLine(c({ moved: ["i3"], tags: ["i3"] }), items)).toBe("Your last save changed the section of CL-03 and who sees CL-03.");
  });
});

describe("focusOf", () => {
  const chapters = [{ items: [{ id: "i1" }, { id: "i2" }] }, { items: [{ id: "i3" }] }];
  const c = { wording: ["i3"], proposals: [], added: [], moved: [], tags: [], removed: 0, rating: true, sections: false, about: false, closing: false, note: false };
  it("finds the first changed card by chapter and place, or overall on the single page", () => {
    expect(focusOf(c, chapters, "chapters")).toEqual({ index: 1, item: 0 });
    expect(focusOf(c, chapters, "page")).toEqual({ index: 0, item: 2 });
    expect(focusOf({ ...c, wording: [] }, chapters, "chapters")).toBeNull();
  });
});
