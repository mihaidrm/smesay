// The device queue's rules (src/lib/answer-queue.ts, stories/E7-3).
import { describe, expect, it } from "vitest";
import { delayFor, nextEntry, outcomeOf, ownWrite, rebased, replyStep, restorable, SAVE_DELAY_MS, sameAnswer, withEntries, withEntry, withoutEntry, withoutResponse } from "@/lib/answer-queue";
import type { AnswerState } from "@/lib/respondent-rules";

const draft = (picked: string, reason = "", comment = "") => ({ picked, reason, comment });
const ids = new Set(["a", "b", "c"]);
const P = "page-one-0001";
const Q = "page-two-0002";
const entry = (d: ReturnType<typeof draft>, base: number, seq: number, page = P, after: { page: string; seq: number }[] = []) => ({ draft: d, base, page, seq, after });
const agree = (value: string, comment: string | null = null): AnswerState => ({ kind: "agree", value, reason: null, comment });
const change = (value: string, reason: string | null): AnswerState => ({ kind: "change", value, reason, comment: null });

describe("the device queue", () => {
  it("brings back every entry that differs from the server's answer, with its version, page and number", () => {
    let raw = withEntry(null, "r1", "a", entry(draft("S", "Later"), 2, 5));
    raw = withEntry(raw, "r1", "b", entry(draft("M"), 1, 2));
    raw = withEntry(raw, "r1", "c", entry(draft("C"), 0, 3, Q));
    // b: an earlier send landed and the server says the same, so it is left out. a and c go
    // back to the server as they were queued, and its rule decides (the respondent test).
    const server = { a: change("S", null), b: agree("M"), c: agree("S") };
    expect(restorable(raw, "r1", ids, server)).toEqual({ a: entry(draft("S", "Later"), 2, 5), c: entry(draft("C"), 0, 3, Q) });
    // An item the server has no answer for comes back too.
    expect(Object.keys(restorable(raw, "r1", ids, {})).sort()).toEqual(["a", "b", "c"]);
    // Another response's queue (a cleared cookie, a shared device) brings back nothing.
    expect(restorable(raw, "r2", ids, server)).toEqual({});
    // An item no longer on the page is left out.
    expect(Object.keys(restorable(raw, "r1", new Set(["a"]), server))).toEqual(["a"]);
    // The store is written back with what the page took.
    expect(restorable(withEntries("r1", restorable(raw, "r1", ids, server)), "r1", ids, {})).toEqual(restorable(raw, "r1", ids, server));
    expect(withEntries("r1", {})).toBeNull();
  });

  it("drops malformed storage and versions, pages or numbers outside the range", () => {
    expect(restorable("{", "r1", ids, {})).toEqual({});
    expect(restorable("[]", "r1", ids, {})).toEqual({});
    const bad = { a: { picked: 5, base: 0, page: P, seq: 1 }, b: { picked: "M", base: -1, page: P, seq: 1 }, c: { picked: "M", base: 0.5, page: P, seq: 1 } };
    expect(restorable(JSON.stringify({ response: "r1", entries: bad }), "r1", ids, {})).toEqual({});
    const worse = { a: { picked: "M", base: 2_147_483_648, page: P, seq: 1 }, b: { picked: "M", base: 0, page: "x", seq: 1 }, c: { picked: "M", base: 0, page: P, seq: 0 } };
    expect(restorable(JSON.stringify({ response: "r1", entries: worse }), "r1", ids, {})).toEqual({});
    // An entry of the edit-time format (no page, no number) is not taken.
    expect(restorable(JSON.stringify({ response: "r1", entries: { a: { picked: "M", reason: "", comment: "", at: 1_790_000_000_000 } } }), "r1", ids, {})).toEqual({});
    expect(restorable(JSON.stringify({ a: { picked: "M" } }), "r1", ids, {})).toEqual({});
  });

  it("keeps a second window's entries and replaces an item's entry with the newest change", () => {
    const one = withEntry(null, "r1", "a", entry(draft("M"), 0, 1));
    const two = withEntry(one, "r1", "b", entry(draft("S", "Why"), 0, 1, Q));
    expect(Object.keys(restorable(two, "r1", ids, {})).sort()).toEqual(["a", "b"]);
    const newer = withEntry(two, "r1", "a", entry(draft("C"), 0, 2));
    expect(restorable(newer, "r1", ids, {}).a).toEqual(entry(draft("C"), 0, 2));
    // A queue of another response is replaced, not merged.
    expect(Object.keys(restorable(withEntry(two, "r2", "c", entry(draft("M"), 0, 1)), "r2", ids, {}))).toEqual(["c"]);
  });

  it("removes an entry once the server holds that save or a later one of the same page", () => {
    let raw = withEntry(null, "r1", "a", entry(draft("M"), 0, 4));
    raw = withEntry(raw, "r1", "b", entry(draft("S", "x"), 0, 1, Q));
    // An earlier save of the page, or another page's save, leaves the entry.
    expect(withoutEntry(raw, "r1", "a", P, 3)).toBe(raw);
    expect(withoutEntry(raw, "r1", "a", Q, 9)).toBe(raw);
    const left = withoutEntry(raw, "r1", "a", P, 4);
    expect(Object.keys(restorable(left, "r1", ids, {}))).toEqual(["b"]);
    expect(withoutEntry(left, "r1", "b", Q, 1)).toBeNull();
    // Another response's queue is left alone.
    expect(withoutEntry(raw, "r2", "a", P, 9)).toBe(raw);
  });

  it("moves a waiting change on top of the page's own earlier save", () => {
    const raw = withEntry(null, "r1", "a", entry(draft("S", "Later"), 0, 2));
    expect(restorable(rebased(raw, "r1", "a", P, 1), "r1", ids, {}).a?.base).toBe(1);
    // Not this page's entry, or another response's queue: unchanged.
    expect(rebased(raw, "r1", "a", Q, 1)).toBe(raw);
    expect(rebased(raw, "r2", "a", P, 1)).toBe(raw);
  });

  it("removes only this response's queue on a reset", () => {
    const raw = withEntry(null, "r1", "a", entry(draft("M"), 0, 1));
    expect(withoutResponse(raw, "r1")).toBeNull();
    expect(withoutResponse(raw, "r2")).toBe(raw);
  });

  it("keeps a change within the second", () => {
    expect(delayFor(1000, 1000)).toBe(SAVE_DELAY_MS);
    expect(delayFor(1000, 1600)).toBe(300);
    expect(delayFor(1000, 2000)).toBe(0);
  });

  it("tells this page's own write from another window's", () => {
    const sent = (page: string, seq: number, d = draft("M")) => ({ page, seq, draft: d });
    // Written by this page: its own, whichever save of it landed (a kept change it sent included).
    expect([ownWrite({ writer: P, writerSeq: 3, answer: change("S", "Later") }, sent(P, 3), P), ownWrite({ writer: P, writerSeq: 1, answer: change("S", "Later") }, sent(Q, 5), P)]).toEqual([true, true]);
    // A kept change of page Q: own only when exactly that save of Q is stored; a later save of
    // Q is that tab's newer change.
    expect([ownWrite({ writer: Q, writerSeq: 5, answer: change("S", "Later") }, sent(Q, 5), P), ownWrite({ writer: Q, writerSeq: 6, answer: change("S", "Later") }, sent(Q, 5), P)]).toEqual([true, false]);
    // Another page: not own, unless the stored answer says the same.
    expect([ownWrite({ writer: Q, writerSeq: 1, answer: change("S", "Later") }, sent(P, 4), P), ownWrite({ writer: Q, writerSeq: 1, answer: change("S", "Later") }, sent(P, 4, draft("S", " Later ")), P)]).toEqual([false, true]);
    // The same: the pick and the text the server keeps for the kind (a comment on a Change is dropped).
    expect([sameAnswer(change("S", "Later"), draft("S", "Later", "ignored")), sameAnswer(agree("M", "ok"), draft("M", "dropped", "ok")), sameAnswer(agree("M"), draft("C"))]).toEqual([true, true, false]);
  });

  it("keeps a change made on top of another page's waiting change on that change's version", () => {
    // Nothing waits, or this page's own change waits: the version the page knows.
    expect(nextEntry(undefined, draft("M"), 4, Q, 1)).toEqual(entry(draft("M"), 4, 1, Q));
    expect(nextEntry(entry(draft("C"), 2, 3, Q), draft("M"), 4, Q, 4)).toEqual(entry(draft("M"), 4, 4, Q));
    // A change kept from an earlier visit (page P, made on version 2) still waits: the edit
    // keeps version 2 and names it, so it lands only where that change would have.
    const kept = entry(draft("S", "Later"), 2, 5, P, [{ page: "page-old-0000", seq: 7 }]);
    expect(nextEntry(kept, draft("S", "Later on"), 4, Q, 1)).toEqual(entry(draft("S", "Later on"), 2, 1, Q, [{ page: "page-old-0000", seq: 7 }, { page: P, seq: 5 }]));
    // A second edit of the page while it still waits keeps the same version and names.
    const first = nextEntry(kept, draft("S", "Later on"), 4, Q, 1);
    expect(nextEntry(first, draft("S", "Later on, maybe"), 4, Q, 2)).toEqual(entry(draft("S", "Later on, maybe"), 2, 2, Q, first.after));
    // The names are the newest eight.
    const long = entry(draft("M"), 1, 9, P, Array.from({ length: 8 }, (_, i) => ({ page: `page-old-000${i}`, seq: 1 })));
    expect(nextEntry(long, draft("C"), 4, Q, 1).after).toHaveLength(8);
    // Stored and read back with its names.
    expect(restorable(withEntry(null, "r1", "a", first), "r1", ids, {}).a).toEqual(first);
    expect(restorable(rebased(withEntry(null, "r1", "a", first), "r1", "a", Q, 6), "r1", ids, {}).a).toEqual({ ...first, base: 6, after: [] });
  });

  it("works out what each reply does to the item's queue", () => {
    const sent = entry(draft("S", "Later"), 2, 4);
    const newer = entry(draft("S", "Later on"), 2, 5);
    const stored = { kind: "change" as const, value: "S", reason: "Later", comment: null };
    // Saved, nothing newer: the change leaves the queue, the card reads Saved.
    expect(replyStep(200, { version: 3, writer: P, writerSeq: 4 }, sent, sent, P)).toEqual({ outcome: "saved", version: 3, rebase: null, drop: { page: P, seq: 4 }, saved: true, changedElsewhere: false, error: null, failed: false });
    // Saved with a newer change waiting: it goes on top of version 3 and stays, with its own
    // failed mark (it has not been answered).
    expect(replyStep(200, { version: 3, writer: P, writerSeq: 4 }, sent, newer, P)).toMatchObject({ rebase: 3, drop: null, saved: false, failed: null });
    // Saved after another copy settled it (a keepalive answered first): nothing waits.
    expect(replyStep(200, { version: 3 }, sent, undefined, P)).toMatchObject({ drop: { page: P, seq: 4 }, saved: true });
    // Stale, the page's own (written by this save or a later one of the page, or the same answer).
    expect(replyStep(409, { error: "stale", version: 4, writer: P, writerSeq: 5, answer: stored }, sent, newer, P)).toMatchObject({ outcome: "stale", version: 4, rebase: 4, drop: null, changedElsewhere: false });
    expect(replyStep(409, { error: "stale", version: 4, writer: Q, writerSeq: 1, answer: stored }, sent, sent, P)).toMatchObject({ drop: { page: P, seq: 4 }, saved: true, changedElsewhere: false });
    // Stale from another window: the newer change made on the old answer goes too, with the sentence.
    const theirs = { kind: "agree" as const, value: "M", reason: null, comment: null };
    expect(replyStep(409, { error: "stale", version: 4, writer: Q, writerSeq: 1, answer: theirs }, sent, newer, P)).toEqual({ outcome: "stale", version: 4, rebase: null, drop: { page: P, seq: 5 }, saved: true, changedElsewhere: true, error: null, failed: false });
    // A kept change of page Q sent by this page P: a later save of Q (Q is another tab, still
    // open) is not this page's, so the edit waiting on top goes with the sentence; a save of P
    // (this page's keepalive of that edit landed first) is its own, and the edit goes on top.
    const kept = entry(draft("S", "Should"), 2, 5, Q);
    const edit = entry(draft("C", "Could"), 2, 2, P, [{ page: Q, seq: 5 }]);
    expect(replyStep(409, { error: "stale", version: 5, writer: Q, writerSeq: 6, answer: theirs }, kept, edit, P)).toMatchObject({ rebase: null, drop: { page: P, seq: 2 }, changedElsewhere: true });
    expect(replyStep(409, { error: "stale", version: 4, writer: P, writerSeq: 1, answer: theirs }, kept, edit, P)).toMatchObject({ rebase: 4, drop: null, changedElsewhere: false });
    // A 422 drops the change it refused, not a newer one.
    expect(replyStep(422, { error: "Say why." }, sent, sent, P)).toMatchObject({ outcome: "refused", drop: { page: P, seq: 4 }, error: "Say why.", failed: false });
    expect(replyStep(422, { error: "Say why." }, sent, newer, P)).toMatchObject({ drop: null, error: null, failed: null });
    // A retry marks the item failed only while a change still waits.
    expect([replyStep(503, {}, sent, sent, P).failed, replyStep(503, {}, sent, newer, P).failed, replyStep(503, {}, sent, undefined, P).failed]).toEqual([true, true, null]);
    // A version that is not a whole number in range is not remembered.
    expect(replyStep(200, { version: "3" }, sent, sent, P).version).toBeNull();
    expect([replyStep(410, { error: "revoked" }, sent, sent, P).outcome, replyStep(409, { error: "x" }, sent, sent, P).outcome]).toEqual(["gone", "notStarted"]);
  });

  it("retries everything that is not a final answer", () => {
    expect([outcomeOf(200, undefined), outcomeOf(409, "stale"), outcomeOf(410, "revoked"), outcomeOf(404, "unknown"), outcomeOf(403, "sample"), outcomeOf(409, "notOpen")]).toEqual(["saved", "stale", "gone", "gone", "gone", "gone"]);
    expect([outcomeOf(409, "Your details were not found on this device."), outcomeOf(422, "bad")]).toEqual(["notStarted", "refused"]);
    expect([outcomeOf(500, undefined), outcomeOf(503, undefined), outcomeOf(429, undefined), outcomeOf(408, undefined), outcomeOf(405, undefined), outcomeOf(400, "x")]).toEqual(["retry", "retry", "retry", "retry", "retry", "retry"]);
  });
});
