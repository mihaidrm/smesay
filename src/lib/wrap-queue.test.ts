// The Wrap up's device queue (stories/E7-5): the kept change read back for its response only,
// never the sign-off; removed once the server holds it or a later change of its page, a
// newer change of another window kept; moved onto its page's confirmed save; restored when
// the open page opens only when the server would still take it; the server's replies worked
// out as the cards' are (src/lib/answer-queue.test.ts), a reply about an older version left
// out; which changes go in the queue; Wrap ups compared as the server stores them.
import { describe, expect, it } from "vitest";
import { nextEntry } from "@/lib/answer-queue";
import { EMPTY_WRAP, sameWrap, type WrapValue } from "@/lib/respondent-rules";
import { answered, rebasedWrap, restorableWrap, sendsNext, withoutWrapEntry, withWrapEntry, wrapChange, wrapEntryOf, wrapReplyStep, type WrapEntry } from "@/lib/wrap-queue";

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
    expect(wrapReplyStep(200, { version: 4 }, sent, sent, P, 0)).toMatchObject({ outcome: "saved", version: 4, done: true, held: value("A"), changedElsewhere: false, failed: false });
    // Saved while a newer change waits: it goes on top of the confirmed save.
    const newer = entry(value("AB"), 3, 5);
    expect(wrapReplyStep(200, { version: 4 }, sent, newer, P, 0)).toMatchObject({ rebase: 4, done: false, held: value("A") });
    // Stale with a write of this page (a copy that landed first): the page's own.
    expect(wrapReplyStep(409, { error: "stale", version: 5, writer: P, writerSeq: 4, wrap: value("A") }, sent, sent, P, 0)).toMatchObject({ outcome: "stale", done: true, changedElsewhere: false });
    // Stale with the same values (a duplicate after a time-out): the page's own.
    expect(wrapReplyStep(409, { error: "stale", version: 5, writer: Q, writerSeq: 1, wrap: value("A") }, sent, sent, P, 0)).toMatchObject({ done: true, changedElsewhere: false });
    // Stale with another window's: the stored one shows, and the newer change goes with it.
    expect(wrapReplyStep(409, { error: "stale", version: 6, writer: Q, writerSeq: 2, wrap: value("B") }, sent, newer, P, 0)).toMatchObject({ version: 6, done: true, held: value("B"), changedElsewhere: true, failed: false });
    // A kept change of another page that landed twice: its own.
    const kept = entry(value("K"), 1, 2, Q);
    expect(wrapReplyStep(409, { error: "stale", version: 2, writer: Q, writerSeq: 2, wrap: value("K") }, kept, kept, P, 0)).toMatchObject({ changedElsewhere: false });
    // Refused: the sentence, unless a newer change already waits.
    expect(wrapReplyStep(422, { error: "Too long." }, sent, sent, P, 0)).toMatchObject({ outcome: "refused", done: true, error: "Too long.", failed: false });
    expect(wrapReplyStep(422, { error: "Too long." }, sent, newer, P, 0)).toMatchObject({ done: false, error: null });
    // Anything else retries while a change waits.
    expect(wrapReplyStep(500, {}, sent, sent, P, 0)).toMatchObject({ outcome: "retry", failed: true });
    expect(wrapReplyStep(500, {}, sent, null, P, 0)).toMatchObject({ failed: null });
    expect(wrapReplyStep(410, {}, sent, sent, P, 0).outcome).toBe("gone");
    expect(wrapReplyStep(409, { error: "notStarted" }, sent, sent, P, 0).outcome).toBe("notStarted");
  });

  it("compares Wrap ups as the server stores them", () => {
    expect(sameWrap(value("Export to CSV "), value("Export to CSV"))).toBe(true);
    expect(sameWrap({ ...EMPTY_WRAP, missing: { text: " ", area: "Submitting", value: "S" } }, EMPTY_WRAP)).toBe(true);
    expect(sameWrap({ ...EMPTY_WRAP, missing: { text: "Mileage", area: "Submitting", value: "" } }, { ...EMPTY_WRAP, missing: { text: "Mileage ", area: "", value: "" } })).toBe(false);
    expect(sameWrap(value("A", 3), value("A", 4))).toBe(false);
    // A kept change that landed trimmed (its keepalive) is not "changed elsewhere".
    const raw = withWrapEntry("r1", entry(value("Export to CSV "), 1, 2, Q));
    expect(restorableWrap(raw, "r1", { wrap: value("Export to CSV"), version: 2, writer: Q, writerSeq: 2 })).toEqual({ entry: null, dropped: false });
  });

  it("queues a change unless it says what waits, or with none waiting what the server holds or last refused", () => {
    const held = value("Held");
    expect(wrapChange(null, { ...held, signed: true }, held, null)).toBe("skip");
    expect(wrapChange(null, value("New"), held, null)).toBe("queue");
    // A change back to what the server holds while another waits goes too: the one waiting
    // may have landed without its answer.
    expect(wrapChange(entry(value("Mileage"), 1, 3), held, held, null)).toBe("queue");
    expect(wrapChange(entry(value("Mileage"), 1, 3), value("Mileage"), held, null)).toBe("skip");
    // Ticking the sign-off on a value the server refused does not send it again.
    expect(wrapChange(null, { ...value("Too long"), signed: true }, held, value("Too long"))).toBe("skip");
    expect(wrapChange(null, value("Shorter"), held, value("Too long"))).toBe("queue");
  });

  it("leaves out a reply about an older version than the page has seen", () => {
    const sent = entry(value("Fine"), 1, 1);
    const newer = entry(value("Fine, thanks"), 2, 2);
    // A keepalive copy's answer, handled after the page saw version 3: nothing changes.
    expect(wrapReplyStep(200, { version: 2 }, sent, newer, P, 3)).toMatchObject({ outcome: "saved", held: null, rebase: null, done: false, changedElsewhere: false });
    expect(wrapReplyStep(409, { error: "stale", version: 2, writer: Q, writerSeq: 1, wrap: value("Other") }, sent, null, P, 3)).toMatchObject({ held: null, changedElsewhere: false });
    expect(wrapReplyStep(200, { version: 3 }, newer, newer, P, 3)).toMatchObject({ held: value("Fine, thanks"), done: true });
  });

  it("sends the next change at once only when nothing else holds it, and drops a retry once answered", () => {
    const sent = entry(value("A"), 1, 1);
    const next = entry(value("AB"), 1, 2);
    const free = { inflight: false, timer: false, retry: false };
    expect(sendsNext(next, sent, free)).toBe(true);
    expect(sendsNext({ ...sent }, sent, free)).toBe(false);
    expect(sendsNext(null, sent, free)).toBe(false);
    expect([sendsNext(next, sent, { ...free, inflight: true }), sendsNext(next, sent, { ...free, timer: true }), sendsNext(next, sent, { ...free, retry: true })]).toEqual([false, false, false]);
    // Saved with a newer change waiting (rebased), saved, refused: answered; a failure is not.
    expect(answered(wrapReplyStep(200, { version: 4 }, sent, next, P, 3))).toBe(true);
    expect(answered(wrapReplyStep(200, { version: 4 }, sent, sent, P, 3))).toBe(true);
    expect(answered(wrapReplyStep(422, { error: "No." }, sent, sent, P, 0))).toBe(true);
    // Refused while a newer change waits: answered too, so the newer one goes at once.
    expect(answered(wrapReplyStep(422, { error: "No." }, sent, next, P, 0))).toBe(true);
    expect(answered(wrapReplyStep(500, {}, sent, sent, P, 0))).toBe(false);
    // A reply with no readable version still settles the change (as the cards' does).
    expect(wrapReplyStep(200, {}, sent, sent, P, 3)).toMatchObject({ done: true, failed: false });
  });
});
