// The Wrap up's device queue (stories/E7-5): the kept change read back for its response only,
// never the sign-off; removed once the server holds it or a later change of its page, a
// newer change of another window kept; moved onto its page's confirmed save; restored when
// the open page opens only when the server would still take it; the server's replies worked
// out as the cards' are (src/lib/answer-queue.test.ts).
import { describe, expect, it } from "vitest";
import { nextEntry } from "@/lib/answer-queue";
import { EMPTY_WRAP, type WrapValue } from "@/lib/respondent-rules";
import { rebasedWrap, restorableWrap, withoutWrapEntry, withWrapEntry, wrapEntryOf, wrapReplyStep, type WrapEntry } from "@/lib/wrap-queue";

const P = "page-wrap-0001";
const Q = "page-wrap-0002";
const value = (closingAnswer: string, confidence: number | null = 4): WrapValue => ({ ...EMPTY_WRAP, confidence, closingAnswer });
const entry = (draft: WrapValue, base: number, seq: number, page = P, after: { page: string; seq: number }[] = []): WrapEntry => ({ draft, base, page, seq, after });

describe("the Wrap up's device queue", () => {
  it("keeps the change for its response, never the sign-off", () => {
    const kept = entry({ ...value("Fine"), signed: true, missing: { text: "Mileage", area: "Submitting", value: "S" } }, 2, 3);
    const raw = withWrapEntry("r1", kept);
    expect(wrapEntryOf(raw, "r1")).toEqual({ ...kept, draft: { ...kept.draft, signed: false } });
    expect(wrapEntryOf(raw, "r2")).toBeNull();
    expect([wrapEntryOf(null, "r1"), wrapEntryOf("{", "r1"), wrapEntryOf("[]", "r1")]).toEqual([null, null, null]);
    // No version, page or number: not kept (an older format, or written by hand).
    expect(wrapEntryOf(JSON.stringify({ response: "r1", value: { confidence: 4 } }), "r1")).toBeNull();
    // Values off the form's limits are cut back.
    expect(wrapEntryOf(JSON.stringify({ response: "r1", value: { confidence: 9, closingAnswer: 3, missing: { text: "x".repeat(600) } }, base: 0, page: P, seq: 1 }), "r1")?.draft).toEqual({ ...EMPTY_WRAP, missing: { text: "x".repeat(500), area: "", value: "" } });
  });

  it("removes the change once the server holds it, and keeps another window's newer one", () => {
    const raw = withWrapEntry("r1", entry(value("B"), 2, 5));
    expect(withoutWrapEntry(raw, "r1", P, 5)).toBeNull();
    expect(withoutWrapEntry(raw, "r1", P, 6)).toBeNull();
    expect(withoutWrapEntry(raw, "r1", P, 4)).toBe(raw);
    expect(withoutWrapEntry(raw, "r1", Q, 9)).toBe(raw);
    expect(withoutWrapEntry(raw, "r2", P, 5)).toBe(raw);
  });

  it("moves the waiting change onto its page's confirmed save", () => {
    const raw = withWrapEntry("r1", entry(value("B"), 2, 5, P, [{ page: Q, seq: 3 }]));
    expect(wrapEntryOf(rebasedWrap(raw, "r1", P, 7), "r1")).toEqual(entry(value("B"), 7, 5));
    expect(rebasedWrap(raw, "r1", Q, 7)).toBe(raw);
  });

  it("restores a kept change only when the server would still take it", () => {
    const server = (wrap: WrapValue, version: number, writer: string | null, writerSeq: number) => ({ wrap, version, writer, writerSeq });
    const raw = withWrapEntry("r1", entry(value("A", null), 1, 2, Q));
    // The server still holds the version it was made on: it comes back.
    expect(restorableWrap(raw, "r1", server(value("Old"), 1, P, 4))).toEqual({ entry: entry(value("A", null), 1, 2, Q), dropped: false });
    // Its own page's earlier save landed since: it comes back too.
    expect(restorableWrap(raw, "r1", server(value("Earlier"), 2, Q, 1)).entry).not.toBeNull();
    // The same values as the server's (the save landed): nothing to send.
    expect(restorableWrap(raw, "r1", server(value("A", null), 2, Q, 2))).toEqual({ entry: null, dropped: false });
    // Another device wrote and submitted since: the old change is dropped, and the page says so.
    expect(restorableWrap(raw, "r1", server(value("B"), 4, "page-phone-0001", 3))).toEqual({ entry: null, dropped: true });
    expect(restorableWrap(raw, "r2", server(value("B"), 4, P, 3))).toEqual({ entry: null, dropped: false });
  });

  it("puts a change made on a kept one on top of it", () => {
    const kept = entry(value("A"), 1, 2, Q);
    expect(nextEntry(kept, value("AB"), 4, P, 1)).toEqual(entry(value("AB"), 1, 1, P, [{ page: Q, seq: 2 }]));
    expect(nextEntry(undefined, value("AB"), 4, P, 1)).toEqual(entry(value("AB"), 4, 1));
  });

  it("works out the server's replies", () => {
    const sent = entry(value("A"), 3, 4);
    // Saved, nothing newer waiting: the change leaves the queue.
    expect(wrapReplyStep(200, { version: 4 }, sent, sent, P)).toMatchObject({ outcome: "saved", version: 4, done: true, held: value("A"), changedElsewhere: false, failed: false });
    // Saved while a newer change waits: it goes on top of the confirmed save.
    const newer = entry(value("AB"), 3, 5);
    expect(wrapReplyStep(200, { version: 4 }, sent, newer, P)).toMatchObject({ rebase: 4, done: false, held: value("A") });
    // Stale with a write of this page (a copy that landed first): the page's own.
    expect(wrapReplyStep(409, { error: "stale", version: 5, writer: P, writerSeq: 4, wrap: value("A") }, sent, sent, P)).toMatchObject({ outcome: "stale", done: true, changedElsewhere: false });
    // Stale with the same values (a duplicate after a time-out): the page's own.
    expect(wrapReplyStep(409, { error: "stale", version: 5, writer: Q, writerSeq: 1, wrap: value("A") }, sent, sent, P)).toMatchObject({ done: true, changedElsewhere: false });
    // Stale with another window's: the stored one shows, and the newer change goes with it.
    expect(wrapReplyStep(409, { error: "stale", version: 6, writer: Q, writerSeq: 2, wrap: value("B") }, sent, newer, P)).toMatchObject({ version: 6, done: true, held: value("B"), changedElsewhere: true, failed: false });
    // A kept change of another page that landed twice: its own.
    const kept = entry(value("K"), 1, 2, Q);
    expect(wrapReplyStep(409, { error: "stale", version: 2, writer: Q, writerSeq: 2, wrap: value("K") }, kept, kept, P)).toMatchObject({ changedElsewhere: false });
    // Refused: the sentence, unless a newer change already waits.
    expect(wrapReplyStep(422, { error: "Too long." }, sent, sent, P)).toMatchObject({ outcome: "refused", done: true, error: "Too long.", failed: false });
    expect(wrapReplyStep(422, { error: "Too long." }, sent, newer, P)).toMatchObject({ done: false, error: null });
    // Anything else retries while a change waits.
    expect(wrapReplyStep(500, {}, sent, sent, P)).toMatchObject({ outcome: "retry", failed: true });
    expect(wrapReplyStep(500, {}, sent, null, P)).toMatchObject({ failed: null });
    expect(wrapReplyStep(410, {}, sent, sent, P).outcome).toBe("gone");
    expect(wrapReplyStep(409, { error: "notStarted" }, sent, sent, P).outcome).toBe("notStarted");
  });
});
