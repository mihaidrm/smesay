// The device queue's rules (stories/E7-3), kept apart from the React hook in
// src/app/r/[token]/answer-saver.ts so they have unit tests (decision 0004). No browser API
// here: the hook reads and writes localStorage and passes the strings in and out.
//
// Every stored answer has a version the server counts up on each write (answer.version), and
// remembers which open page wrote it last and that page's count of its own saves (writer,
// writer_seq). A save says which version it was made on (base), which page sends it (page, a
// random id per page load) and its number on that page (seq). The server takes it when the
// stored version is still the base, or when the last write came from the same page with a
// lower number (two saves of one page arriving out of order), or when the change names the
// last write as one it was made on top of (after: another page's save the server had not
// answered for when the change was made, such as a change the device kept from an earlier
// visit; that save or an earlier one of the same page); otherwise it answers "stale" with the
// stored answer (src/db/queries/answers.ts). No clock decides anything.
//
// The stored value under smesay-answers:[token] is JSON { response, entries }: the response
// the answers belong to (a cleared cookie starts a new one, and an old queue must never land
// in it), and per item the draft with the version it was made on and the page and number
// that queued it. A page that opens sends what it finds with that same version, page and
// number, so the server's rule decides, as it would have for the page that queued it: the
// page's own earlier save lets it land, another window's or device's save since does not.
import type { CardDraft } from "@/components/respondent/item-card";
import { AFTER_MAX, COUNT_MAX, needsReason, parseAfter, pickedOf, validCount, validPage, type AnswerState, type SaveRef } from "@/lib/respondent-rules";

export const SAVE_DELAY_MS = 400;
// A change is sent at most this long after the first change still waiting, even while the
// respondent keeps typing (CLAUDE.md, respondent side: within one second).
export const SAVE_MAX_MS = 900;
export const SAVE_TIMEOUT_MS = 10_000;
export const RETRY_MS = 5000;
export { COUNT_MAX };
export const queueKey = (token: string) => `smesay-answers:${token}`;

export type QueueEntry = { draft: CardDraft; base: number; page: string; seq: number; after: SaveRef[] };
type StoredEntry = { picked: string; reason: string; comment: string; base: number; page: string; seq: number; after?: unknown };
type Stored = { response: string; entries: Record<string, StoredEntry> };

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const { response, entries } = value as { response?: unknown; entries?: unknown };
    if (typeof response !== "string" || !entries || typeof entries !== "object" || Array.isArray(entries)) return null;
    return { response, entries: entries as Stored["entries"] };
  } catch {
    return null;
  }
}

// Whether a stored answer already says what a draft says: the same pick, and the reason or
// the comment the server keeps for that kind (src/lib/respondent-rules.ts answerFor).
export function sameAnswer(stored: AnswerState, draft: CardDraft): boolean {
  if (pickedOf(stored) !== draft.picked) return false;
  const reason = needsReason(stored.kind) ? draft.reason.trim() : "";
  const comment = needsReason(stored.kind) ? "" : draft.comment.trim();
  return (stored.reason ?? "") === reason && (stored.comment ?? "") === comment;
}

// The device's stored queue when the page opens: every well-formed entry of this response
// for an item on the page that says something other than the server's answer, with the
// version, page and number it was queued with. An entry the server already matches (an
// earlier send landed) is left out, and so are entries of another response, of items not on
// the page, or not well formed; the page writes back only what it takes (withEntries).
export function restorable(raw: string | null, responseId: string, itemIds: Set<string>, server: Record<string, AnswerState>): Record<string, QueueEntry> {
  const out: Record<string, QueueEntry> = {};
  const stored = parse(raw);
  if (!stored || stored.response !== responseId) return out;
  for (const [id, e] of Object.entries(stored.entries)) {
    if (!itemIds.has(id) || !e || typeof e !== "object") continue;
    const after = parseAfter(e.after);
    if (typeof e.picked !== "string" || !validCount(e.base) || !validPage(e.page) || !validCount(e.seq, 1) || !after) continue;
    const draft = { picked: e.picked, reason: typeof e.reason === "string" ? e.reason : "", comment: typeof e.comment === "string" ? e.comment : "" };
    if (server[id] && sameAnswer(server[id], draft)) continue;
    out[id] = { draft, base: e.base, page: e.page, seq: e.seq, after };
  }
  return out;
}

// The stored string holding exactly these entries of one response (null when there are none).
export function withEntries(responseId: string, entries: Record<string, QueueEntry>): string | null {
  let next: string | null = null;
  for (const [id, entry] of Object.entries(entries)) next = withEntry(next, responseId, id, entry);
  return next;
}

// The stored string with one item's entry written (each edit on this device is the newest
// one for it, so it replaces what is there). A queue of another response is replaced.
export function withEntry(raw: string | null, responseId: string, itemId: string, entry: QueueEntry): string {
  const stored = parse(raw);
  const entries = stored && stored.response === responseId ? { ...stored.entries } : {};
  entries[itemId] = { picked: entry.draft.picked ?? "", reason: entry.draft.reason, comment: entry.draft.comment, base: entry.base, page: entry.page, seq: entry.seq, ...(entry.after.length > 0 ? { after: entry.after } : {}) };
  return JSON.stringify({ response: responseId, entries });
}

// The stored string with an item's entry removed once the server holds it or a later save of
// the same page; another window's entry for the item stays. null when nothing is left.
export function withoutEntry(raw: string | null, responseId: string, itemId: string, page: string, seq: number): string | null {
  const stored = parse(raw);
  if (!stored || stored.response !== responseId) return raw;
  const entries = { ...stored.entries };
  const kept = entries[itemId];
  if (kept && kept.page === page && kept.seq <= seq) delete entries[itemId];
  return Object.keys(entries).length === 0 ? null : JSON.stringify({ response: responseId, entries });
}

// The stored string with the newer waiting entry's base moved to the version its own earlier
// save created (and the saves it was made on top of settled), so a reload sends it on top of
// that save instead of calling it a conflict.
export function rebased(raw: string | null, responseId: string, itemId: string, page: string, base: number): string | null {
  const stored = parse(raw);
  if (!stored || stored.response !== responseId) return raw;
  const kept = stored.entries[itemId];
  if (!kept || kept.page !== page) return raw;
  const { after: _settled, ...rest } = kept;
  void _settled;
  return JSON.stringify({ response: responseId, entries: { ...stored.entries, [itemId]: { ...rest, base } } });
}

// A new change of an item while another change of it waits (stories/E7-3). One of this
// page's own takes the version the page knows: the server's rule covers the page's earlier
// saves. One of another page that the server has not answered for (a change the device kept
// from an earlier visit) is the version this change is really made on: the new change keeps
// that change's base and names it, with the saves that change named, among the saves it was
// made on top of (the newest AFTER_MAX).
export function nextEntry(prev: QueueEntry | undefined, draft: CardDraft, known: number, page: string, seq: number): QueueEntry {
  if (!prev || (prev.page === page && prev.after.length === 0)) return { draft, base: known, page, seq, after: [] };
  if (prev.page === page) return { draft, base: prev.base, page, seq, after: prev.after };
  const after = [...prev.after.filter((a) => a.page !== prev.page), { page: prev.page, seq: prev.seq }].slice(-AFTER_MAX);
  return { draft, base: prev.base, page, seq, after };
}

// The stored string without this response's queue (a lost response: reset). Another
// response's queue, kept by another window, stays.
export const withoutResponse = (raw: string | null, responseId: string): string | null => (parse(raw)?.response === responseId ? null : raw);

// How long a new change waits: SAVE_DELAY_MS of quiet, but never past SAVE_MAX_MS after the
// first change still waiting.
export const delayFor = (firstAt: number, now: number): number => Math.max(0, Math.min(SAVE_DELAY_MS, firstAt + SAVE_MAX_MS - now));

// What the page does with the server's answer to a save. saved: the server holds it. stale:
// the server holds something else; the page decides whether it is its own. gone: the link
// stopped being open; the page reloads onto its state. notStarted: no response for this
// device, or not the one the page answers for. refused: the server will never take this
// answer (422); its sentence goes on the card. retry: anything else (5xx, a rate limit, a
// timeout status, an unexpected code); the answer stays queued.
export type Outcome = "saved" | "stale" | "gone" | "notStarted" | "refused" | "retry";
export function outcomeOf(status: number, error: string | undefined): Outcome {
  if (status >= 200 && status < 300) return "saved";
  if (status === 409 && error === "stale") return "stale";
  if (status === 410 || status === 404 || status === 403 || (status === 409 && error === "notOpen")) return "gone";
  if (status === 409) return "notStarted";
  if (status === 422) return "refused";
  return "retry";
}

// A stale reply is this page's own when the stored answer was written by this page with this
// save or a later one, or already says what the save said (a send of an earlier page load,
// a duplicate after a timeout). Otherwise another window or device changed it.
export function ownWrite(stored: { writer: string | null; writerSeq: number; answer: AnswerState }, page: string, seq: number, draft: CardDraft): boolean {
  return (stored.writer === page && stored.writerSeq >= seq) || sameAnswer(stored.answer, draft);
}

// What the server's reply to one save does to the item's queue (stories/E7-3), worked out
// apart from the hook so it has unit tests. `sent` is the entry the request carried;
// `current` is the item's entry waiting now: the same one, a newer change, or none (another
// copy of the save was answered first). Entries are told apart by page and number.
export type ReplyBody = { error?: string; version?: unknown; writer?: unknown; writerSeq?: unknown; answer?: AnswerState };
export type ReplyStep = {
  outcome: Outcome;
  // The server's version to remember for the item (the page keeps the highest).
  version: number | null;
  // The newer waiting change goes on top of this page's confirmed save: its new base.
  rebase: number | null;
  // The item's waiting change leaves the queue, and the storage entry to remove with it.
  drop: { page: string; seq: number } | null;
  // The card reads Saved.
  saved: boolean;
  // Another window or device changed the answer: the card shows the stored one with the sentence.
  changedElsewhere: boolean;
  // The server's sentence for the card (a 422).
  error: string | null;
  // Mark the item failed (true, it retries), clear it (false), or leave it (null).
  failed: boolean | null;
};
const sameEntry = (a: QueueEntry | undefined, b: QueueEntry) => a !== undefined && a.page === b.page && a.seq === b.seq;
export function replyStep(status: number, body: ReplyBody, sent: QueueEntry, current: QueueEntry | undefined): ReplyStep {
  const outcome = outcomeOf(status, body.error);
  const step: ReplyStep = { outcome, version: null, rebase: null, drop: null, saved: false, changedElsewhere: false, error: null, failed: null };
  if (outcome === "saved" || outcome === "stale") {
    const version = validCount(body.version) ? body.version : null;
    const own = outcome === "saved" || (body.answer !== undefined && ownWrite({ writer: typeof body.writer === "string" ? body.writer : null, writerSeq: validCount(body.writerSeq) ? body.writerSeq : 0, answer: body.answer }, sent.page, sent.seq, sent.draft));
    step.version = version;
    if (own && current && !sameEntry(current, sent)) {
      // The newer change keeps its own failed mark: it has not been answered yet.
      step.rebase = version;
      return step;
    }
    step.failed = false;
    // Not the page's own: a newer change of the page was made on the old answer too, so it
    // goes with it.
    const waiting = current ?? sent;
    step.drop = { page: waiting.page, seq: waiting.seq };
    step.saved = true;
    step.changedElsewhere = !own;
    return step;
  }
  if (outcome === "refused") {
    if (sameEntry(current, sent)) {
      step.drop = { page: sent.page, seq: sent.seq };
      step.error = body.error ?? null;
      step.failed = false;
    }
    return step;
  }
  // A retry only matters while the change still waits: a copy answered first settled it.
  if (outcome === "retry" && current) step.failed = true;
  return step;
}
