// textFor() and its helpers (stories/E4-3, acceptance 2 and 4): a suggested or rejected item
// renders its original; only an accepted one its reader version; a reader version equal to
// the original is nothing to accept and is not counted.
import { describe, expect, it } from "vitest";
import { hasReaderVersion, readerCounts, readerIsOriginal, textFor } from "./item-text";

const original = "OCR receipt capture via mobile (auto-fill amt/date/vendor).";
const reader = "Photograph a receipt and the amount, date and merchant are filled in.";

describe("textFor", () => {
  it("shows the original unless the reader version was accepted", () => {
    expect(textFor({ originalText: original, readerText: reader, readerStatus: "suggested" })).toBe(original);
    expect(textFor({ originalText: original, readerText: reader, readerStatus: "rejected" })).toBe(original);
    expect(textFor({ originalText: original, readerText: reader, readerStatus: "accepted" })).toBe(reader);
    expect(textFor({ originalText: original, readerText: null, readerStatus: null })).toBe(original);
  });
  it("treats a reader version equal to the original, give or take whitespace, as nothing to accept", () => {
    expect(readerIsOriginal({ originalText: original, readerText: `  ${original.replace(" ", "\n ")} `, readerStatus: "suggested" })).toBe(true);
    expect(hasReaderVersion({ originalText: original, readerText: original, readerStatus: "suggested" })).toBe(false);
    expect(hasReaderVersion({ originalText: original, readerText: reader, readerStatus: "suggested" })).toBe(true);
    expect(hasReaderVersion({ originalText: original, readerText: null, readerStatus: null })).toBe(false);
    // A blank version is no version, and never what an item shows.
    expect(hasReaderVersion({ originalText: original, readerText: "  ", readerStatus: "suggested" })).toBe(false);
    expect(textFor({ originalText: original, readerText: " ", readerStatus: "accepted" })).toBe(original);
  });
  it("counts accepted of those worth a decision", () => {
    expect(readerCounts([
      { originalText: original, readerText: reader, readerStatus: "accepted" },
      { originalText: original, readerText: reader, readerStatus: "suggested" },
      { originalText: original, readerText: original, readerStatus: "suggested" },
      { originalText: original, readerText: null, readerStatus: null },
    ])).toEqual({ accepted: 1, total: 2 });
  });
});
