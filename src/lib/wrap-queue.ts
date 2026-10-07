// The Wrap up's device queue (stories/E7-5), kept apart from the React hook in
// src/app/r/[token]/wrap-saver.ts so it has unit tests (decision 0004). The cards' rules
// (src/lib/answer-queue.ts) applied to the one Wrap up of a response: every write says which
// version of the Wrap up it was made on (base), which page sends it (page) and its number on
// that page (seq), and the saves of other pages it was made on top of (after); the server
// takes it by the same rule (wrapTakes, src/lib/respondent-rules.ts) or answers "stale" with
// the stored Wrap up. No browser API here.
//
// The stored value under smesay-wrap:[token] is JSON { response, value: { confidence,
// closingAnswer, missing }, base, page, seq, after? }: the newest change of this device the
// server has not confirmed, tied to the response it belongs to.
import { outcomeOf, type Entry, type Outcome } from "@/lib/answer-queue";
import { MISSING_MAX, parseAfter, REASON_MAX, sameWrap, validCount, validPage, wrapTakes, type WrapSync, type WrapValue } from "@/lib/respondent-rules";

export type WrapEntry = Entry<WrapValue>;

const text = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");

// The kept change of this response, well formed, or null.
export function wrapEntryOf(raw: string | null, responseId: string): WrapEntry | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { response?: unknown; value?: { confidence?: unknown; closingAnswer?: unknown; missing?: { text?: unknown } }; base?: unknown; page?: unknown; seq?: unknown; after?: unknown };
    if (!v || typeof v !== "object" || v.response !== responseId || !v.value || typeof v.value !== "object") return null;
    const after = parseAfter(v.after);
    if (!validCount(v.base) || !validPage(v.page) || !validCount(v.seq, 1) || !after) return null;
    const { confidence, closingAnswer, missing } = v.value;
    const draft: WrapValue = {
      confidence: typeof confidence === "number" && Number.isInteger(confidence) && confidence >= 1 && confidence <= 5 ? confidence : null,
      signed: false,
      closingAnswer: text(closingAnswer, REASON_MAX),
      missing: { text: text(missing?.text, MISSING_MAX) },
    };
    return { draft, base: v.base, page: v.page, seq: v.seq, after };
  } catch {
    return null;
  }
}

// The stored string holding this change (the newest on this device replaces what is there).
// The sign-off is never kept.
export const withWrapEntry = (responseId: string, entry: WrapEntry): string =>
  JSON.stringify({ response: responseId, value: { confidence: entry.draft.confidence, closingAnswer: entry.draft.closingAnswer, missing: entry.draft.missing }, base: entry.base, page: entry.page, seq: entry.seq, ...(entry.after.length > 0 ? { after: entry.after } : {}) });

// The stored string once the server holds this page's change `seq` or a later one: removed
// when it is that change or an earlier one of the same page; another window's newer change
// stays.
export function withoutWrapEntry(raw: string | null, responseId: string, page: string, seq: number): string | null {
  const kept = wrapEntryOf(raw, responseId);
  if (!kept) return raw;
  return kept.page === page && kept.seq <= seq ? null : raw;
}

// The stored string with the waiting change moved onto the version its page's earlier save
// created (the saves it was made on top of settled).
export function rebasedWrap(raw: string | null, responseId: string, page: string, base: number): string | null {
  const kept = wrapEntryOf(raw, responseId);
  if (!kept || kept.page !== page) return raw;
  return withWrapEntry(responseId, { ...kept, base, after: [] });
}

// The kept change when the page opens: one that says something other than the server's Wrap
// up and that the server would still take (the server holds nothing newer than it). `dropped`
// says a kept change was left out because the Wrap up changed since elsewhere.
export function restorableWrap(raw: string | null, responseId: string, server: { wrap: WrapValue } & WrapSync): { entry: WrapEntry | null; dropped: boolean } {
  const kept = wrapEntryOf(raw, responseId);
  if (!kept || sameWrap(kept.draft, server.wrap)) return { entry: null, dropped: false };
  return wrapTakes(server, kept) ? { entry: kept, dropped: false } : { entry: null, dropped: true };
}

// What the page does with the server's answer to a write (the cards' replyStep for the one
// Wrap up). `sent` is the change the request carried; `current` the change waiting now (the
// same, a newer one, or none).
export type WrapReplyBody = { error?: string; version?: unknown; writer?: unknown; writerSeq?: unknown; wrap?: WrapValue; changedSince?: unknown; submittedAt?: unknown };
export type WrapStep = {
  outcome: Outcome;
  // The server's version to remember (the page keeps the highest).
  version: number | null;
  // The newer waiting change goes on top of this page's confirmed save: its new base.
  rebase: number | null;
  // The waiting change leaves the queue.
  done: boolean;
  // What the server holds now, when the reply says.
  held: WrapValue | null;
  // Another window or device changed the Wrap up: the page shows the stored one.
  changedElsewhere: boolean;
  // The server's sentence (a 422).
  error: string | null;
  // Mark the Wrap up failed (true, it retries), clear it (false), or leave it (null).
  failed: boolean | null;
};
// Whether a reply is about the version the page knows or a later one (a reply with no
// readable version counts): an older one says nothing new.
export const freshReply = (version: number | null, known: number): boolean => version === null || version >= known;
export const sameEntry = (a: WrapEntry | null, b: WrapEntry) => a !== null && a.page === b.page && a.seq === b.seq;
const same = sameEntry;

// After a reply, whether a retry still set for an earlier failure goes: the server answered,
// so the change is settled, or refused, or the newer one is rebased and goes now.
export const answered = (step: WrapStep): boolean => step.failed === false || step.rebase !== null || step.outcome === "refused";
// Whether the change waiting goes at once when a request ends: another change than the one
// sent, with nothing in flight, no timer of its own and no retry waiting after a failure.
export const sendsNext = (next: WrapEntry | null, sent: WrapEntry, s: { inflight: boolean; timer: boolean; retry: boolean }): boolean =>
  next !== null && !sameEntry(next, sent) && !s.inflight && !s.timer && !s.retry;

// Whether a change of the form goes in the queue: not when it says what the change waiting
// already says, nor, with none waiting, what the server holds or what it last refused (a
// sign-off tick on a refused value sends it no second time). A change back to what the server
// holds while another waits is queued too: that one may have landed unanswered.
export function wrapChange(prev: WrapEntry | null, value: WrapValue, held: WrapValue, refused: WrapValue | null): "skip" | "queue" {
  if (prev) return sameWrap(prev.draft, value) ? "skip" : "queue";
  return sameWrap(held, value) || (refused !== null && sameWrap(refused, value)) ? "skip" : "queue";
}
// `known` is the highest version the page has seen: a reply about an older one (a keepalive
// copy answered after later saves) changes nothing.
export function wrapReplyStep(status: number, body: WrapReplyBody, sent: WrapEntry, current: WrapEntry | null, self: string, known: number): WrapStep {
  const outcome = outcomeOf(status, body.error);
  const step: WrapStep = { outcome, version: null, rebase: null, done: false, held: null, changedElsewhere: false, error: null, failed: null };
  if (outcome === "saved" || outcome === "stale") {
    step.version = validCount(body.version) ? body.version : null;
    if (!freshReply(step.version, known)) return step;
    const stored = outcome === "saved" ? sent.draft : (body.wrap ?? null);
    const writer = typeof body.writer === "string" ? body.writer : null;
    // The page's own: the server took it, or holds a write of this page, or exactly that
    // save (a kept change that landed twice), or what it said (a copy after a time-out).
    const own = outcome === "saved" || writer === self || (writer === sent.page && body.writerSeq === sent.seq) || (stored !== null && sameWrap(stored, sent.draft));
    step.held = stored;
    if (own && current && !same(current, sent)) {
      step.rebase = step.version;
      return step;
    }
    step.failed = false;
    // Not the page's own: a newer change of the page was made on the old Wrap up too, so it
    // goes with it.
    step.done = true;
    step.changedElsewhere = !own;
    return step;
  }
  if (outcome === "refused") {
    if (current && same(current, sent)) {
      step.done = true;
      step.error = body.error ?? null;
      step.failed = false;
    }
    return step;
  }
  if (outcome === "retry" && current) step.failed = true;
  return step;
}
