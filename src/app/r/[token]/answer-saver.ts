"use client";
// The card answers' saver (stories/E7-2 and E7-3). A change waits 400 ms for the next one
// (typing), and never more than 900 ms after the first change still waiting, then goes to
// PUT /r/[token]/answers, so it is sent within a second; focus leaving a control sends what
// waits at once. One request per item is in flight at a time and a newer change waits for
// it; a request with no answer in 10 seconds is given up
// (developer.mozilla.org/docs/Web/API/AbortSignal/timeout_static). When the page is hidden
// or closed, every unconfirmed answer goes out once more with keepalive so the request
// outlives the tab (developer.mozilla.org/docs/Web/API/RequestInit, keepalive;
// developer.mozilla.org/docs/Web/API/Window/pagehide_event;
// developer.mozilla.org/docs/Web/API/Document/visibilitychange_event), the ones already in
// flight included, since a plain request is cancelled when the page goes; when the page
// shows again, what is still unconfirmed goes out.
//
// Every save carries the answer's version it was made on (base), the id of the page that made
// it (a random id per page load: developer.mozilla.org/docs/Web/API/Crypto/randomUUID) and
// that page's number for the save (seq), the saves of other pages it was made on top of
// (after), and the response the page answers for. A save is this page's, or one the device
// kept from an earlier visit, sent as it was queued. The server takes it when the stored
// version is still the base, when the same page wrote last with a lower number, or when a
// page it names in after wrote last with that save or an earlier one; otherwise it answers
// "stale" with the stored answer (src/lib/answer-queue.ts). A stale reply that is the page's
// own (ownWrite) changes nothing on the card; any other came from another window or device,
// and the card shows the stored answer with a sentence. No clock decides.
//
// Every change the server has not confirmed stays in `pending`, in memory and in
// localStorage under smesay-answers:[token] (developer.mozilla.org/docs/Web/API/Window/
// localStorage), tied to the response it belongs to, until the server holds it; when the page
// opens again it sends what it finds there that differs from the server's answer, with the
// version, page and number it was queued with, and the server's rule decides; the card shows
// the sentence when another window or device changed the answer since. A change made on a
// card while such a change waits keeps its version and names it (nextEntry), so it lands
// only where that change would have. A request
// that cannot reach the server marks the page offline: the banner, "Not saved" in the header
// and "Not saved yet" on complete cards (E7-3, acceptance 3); every 5 seconds, or at once on
// the window's online event (developer.mozilla.org/docs/Web/API/Window/online_event), the
// state route (E6-4) is asked, and when it answers every pending answer goes out. Any other
// answer that is not final (5xx, a rate limit, an unexpected code) retries the same way with
// "Not saved" and no connection banner. "Not saved" stays until every failed answer has gone
// through. A browser that keeps no localStorage (storage blocked: the access throws) still
// works in one sitting; the page says so once (acceptance 4).
//
// A link that stopped being open (410, 404, 403, a 409 not open yet) reloads the page, which
// then shows the link's state; a response not started, or not the one the page answers for,
// returns the respondent to About you (`reset` empties this response's queue and marks every
// card not saved; after Start the page binds the new response and sends the drafts again,
// `bind` and `resend`); a reply for a response the page no longer answers for is ignored; an
// answer the server refused (422, a stale page) shows the server's sentence on its card and
// is dropped from the queue.
//
// `done` holds, per item, whether the server's answer is complete, as the server last said
// (the answers route's `complete`, also on a stale reply), taken only from a reply whose
// version is at least the one already applied (doneFrom); the chapter row and the Wrap up
// count from it (E7-4, technical notes).
import { isPreviewToken } from "@/lib/preview-prefix";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CardDraft } from "@/components/respondent/item-card";
import { delayFor, doneFrom, nextEntry, settleState, queueKey, rebased, replyStep, restorable, RETRY_MS, SAVE_TIMEOUT_MS, withEntries, withEntry, withoutEntry, withoutResponse, type QueueEntry, type ReplyBody } from "@/lib/answer-queue";
import { SAMPLE_TOKEN } from "@/lib/sample-copy";
import { RESPONDENT_ERRORS, type AnswerState, type SinceReply } from "@/lib/respondent-rules";

export type SaverEvents = {
  onGone: () => void;
  onNotStarted: () => void;
  // The unconfirmed answers found on this device when the page opened, for the cards.
  onRestore: (drafts: Record<string, CardDraft>) => void;
  // Another window or device changed the answer; the card shows the stored one.
  onStale: (itemId: string, answer: AnswerState) => void;
  // The server took an answer for this device's response (the cookie works).
  // A save the server took or answered stale for, with what it says of the response's latest
  // Submit and the changes since (E7-6).
  onSaved: (reply: SinceReply) => void;
};

let probed: { storage: Storage | null } | null = null;
function deviceStorage(): Storage | null {
  if (probed) return probed.storage;
  try {
    const s = window.localStorage;
    s.setItem("smesay-probe", "1");
    s.removeItem("smesay-probe");
    probed = { storage: s };
  } catch {
    probed = { storage: null };
  }
  return probed.storage;
}
// Whether this browser keeps localStorage, read after hydration (the server says it does):
// useSyncExternalStore with a server snapshot (react.dev/reference/react/useSyncExternalStore).
const noSubscribe = () => () => {};
const storageMissing = () => deviceStorage() === null;
const noStorageProbe = () => false;
export const newPageId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `page-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`);


export function useAnswerSaver(token: string, responseId: string | null, enabled: boolean, itemIds: string[], initialVersions: Record<string, number>, initialAnswers: Record<string, AnswerState>, initialSaved: Record<string, boolean>, initialDone: Record<string, boolean>, events: SaverEvents) {
  const [saved, setSaved] = useState<Record<string, boolean>>(initialSaved);
  const [done, setDone] = useState<Record<string, boolean>>(initialDone);
  const doneAt = useRef(new Map<string, number>(Object.entries(initialVersions)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [offline, setOffline] = useState(false);
  const [failing, setFailing] = useState(false);
  // The sample keeps its answers in session storage and probes nothing here (stories/E12-4).
  const storageOff = useSyncExternalStore(noSubscribe, token === SAMPLE_TOKEN ? noStorageProbe : storageMissing, () => false);
  const page = useRef<string>("");
  const seq = useRef(0);
  const pending = useRef(new Map<string, QueueEntry>());
  // The server's version of each answer as this page last heard it.
  const known = useRef(new Map<string, number>(Object.entries(initialVersions)));
  // The entry each item has in flight, and the one each item sent with keepalive on hide.
  const inflight = useRef(new Map<string, QueueEntry>());
  const hideSent = useRef(new Map<string, string>());
  const failed = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const firstAt = useRef(new Map<string, number>());
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  // How many replies refused a card's answer or showed another window's (for settle).
  const upsets = useRef(0);
  const down = useRef(false);
  const alive = useRef(true);
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);
  const responseRef = useRef(responseId);
  useEffect(() => { responseRef.current = responseId; }, [responseId]);
  const key = queueKey(token);
  const pageId = () => (page.current ||= newPageId());

  // Read, change and write the stored queue; storage that is missing, full or withdrawn
  // mid-visit leaves the answers in memory.
  const update = useCallback((change: (raw: string | null) => string | null) => {
    const s = deviceStorage();
    if (!s) return;
    try {
      const next = change(s.getItem(key));
      if (next === null) s.removeItem(key);
      else s.setItem(key, next);
    } catch {
      // The answers stay in memory.
    }
  }, [key]);

  const markFailed = useCallback((itemId: string, on: boolean) => {
    if (on) failed.current.add(itemId);
    else failed.current.delete(itemId);
    setFailing(failed.current.size > 0);
  }, []);

  const sendRef = useRef<(itemId: string, keepalive?: boolean) => Promise<void>>(async () => {});
  const flushAll = useCallback((keepalive = false) => {
    for (const itemId of [...pending.current.keys()]) void sendRef.current(itemId, keepalive);
  }, []);

  const checkRef = useRef<() => Promise<void>>(async () => {});
  const check = useCallback(async () => {
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    if (!alive.current) return;
    try {
      const response = await fetch(`/r/${encodeURIComponent(token)}/state`, { cache: "no-store" });
      if (response.status === 410 || response.status === 404) { eventsRef.current.onGone(); return; }
      if (response.ok) {
        // The connection is back; "Not saved" stays until the waiting answers go through.
        down.current = false;
        setOffline(false);
        flushAll();
        return;
      }
    } catch {
      // Still offline.
    }
    if (alive.current) retry.current = setTimeout(() => void checkRef.current(), RETRY_MS);
  }, [token, flushAll]);
  useEffect(() => { checkRef.current = check; }, [check]);

  const scheduleRetry = useCallback(() => {
    if (!retry.current && alive.current) retry.current = setTimeout(() => void checkRef.current(), RETRY_MS);
  }, []);

  const send = useCallback(async (itemId: string, keepalive = false) => {
    const timer = timers.current.get(itemId);
    if (timer) { clearTimeout(timer); timers.current.delete(itemId); }
    const entry = pending.current.get(itemId);
    const response = responseRef.current;
    if (!entry || !response) return;
    if (entry.draft.picked === null) { pending.current.delete(itemId); return; }
    if (keepalive) {
      // pagehide and visibilitychange both fire when a tab closes: one keepalive copy each.
      const id = `${entry.page}:${entry.seq}`;
      if (hideSent.current.get(itemId) === id) return;
      hideSent.current.set(itemId, id);
    } else {
      // A keepalive send does not wait and does not hold the item's turn.
      if (inflight.current.has(itemId) || down.current) return;
      inflight.current.set(itemId, entry);
      firstAt.current.delete(itemId);
    }
    const settle = () => { if (!keepalive && inflight.current.get(itemId) === entry) inflight.current.delete(itemId); };
    try {
      const reply = await fetch(`/r/${encodeURIComponent(token)}/answers`, { method: "PUT", keepalive, signal: keepalive ? undefined : AbortSignal.timeout(SAVE_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, picked: entry.draft.picked, reason: entry.draft.reason, comment: entry.draft.comment, base: entry.base, page: entry.page, seq: entry.seq, after: entry.after, response }) });
      settle();
      // A reply for a response the page no longer answers for (a reset or a Start since)
      // changes nothing.
      if (responseRef.current !== response || !alive.current) return;
      const body = (await reply.json().catch(() => ({}))) as ReplyBody;
      const current = pending.current.get(itemId);
      const step = replyStep(reply.status, body, entry, current, pageId());
      if (step.outcome === "gone") { eventsRef.current.onGone(); return; }
      if (step.outcome === "notStarted") { eventsRef.current.onNotStarted(); return; }
      if (step.version !== null) known.current.set(itemId, Math.max(known.current.get(itemId) ?? 0, step.version));
      const taken = doneFrom(doneAt.current.get(itemId), step.version, body.complete);
      if (taken) {
        doneAt.current.set(itemId, taken.version);
        setDone((d) => ({ ...d, [itemId]: taken.complete }));
      }
      if (step.failed !== null) markFailed(itemId, step.failed);
      if (step.outcome === "saved" || step.outcome === "stale") eventsRef.current.onSaved(body);
      if (step.rebase !== null && current) {
        // A newer change waits: it goes on top of the page's own confirmed save.
        const base = step.rebase;
        pending.current.set(itemId, { ...current, base, after: [] });
        update((raw) => rebased(raw, response, itemId, current.page, base));
      }
      if (step.drop) {
        const drop = step.drop;
        const waiting = timers.current.get(itemId);
        if (waiting) { clearTimeout(waiting); timers.current.delete(itemId); }
        firstAt.current.delete(itemId);
        pending.current.delete(itemId);
        update((raw) => withoutEntry(raw, response, itemId, drop.page, drop.seq));
      }
      if (step.saved) setSaved((s) => ({ ...s, [itemId]: true }));
      if (step.changedElsewhere || step.error) upsets.current += 1;
      if (step.changedElsewhere) {
        if (body.answer) eventsRef.current.onStale(itemId, body.answer);
        setErrors((e) => ({ ...e, [itemId]: RESPONDENT_ERRORS.changedElsewhere }));
      }
      if (step.error) { const error = step.error; setErrors((e) => ({ ...e, [itemId]: error })); }
      if (step.failed) scheduleRetry();
    } catch {
      // No connection, the time limit, or a keepalive the browser would not send. Only a
      // change that still waits, for the response the page answers for, counts as failed.
      settle();
      if (!alive.current || responseRef.current !== response || !pending.current.has(itemId)) return;
      if (!keepalive) { down.current = true; setOffline(true); }
      markFailed(itemId, true);
      scheduleRetry();
    } finally {
      // A change made while this one was in flight goes out now, unless its timer still runs.
      const next = pending.current.get(itemId);
      if (alive.current && !keepalive && next && next !== entry && !inflight.current.has(itemId) && !timers.current.has(itemId)) void sendRef.current(itemId);
    }
  }, [token, update, scheduleRetry, markFailed]);
  useEffect(() => { sendRef.current = send; }, [send]);

  const queue = useCallback((itemId: string, draft: CardDraft) => {
    seq.current += 1;
    const entry = nextEntry(pending.current.get(itemId), draft, known.current.get(itemId) ?? 0, pageId(), seq.current);
    pending.current.set(itemId, entry);
    const response = responseRef.current;
    if (response) update((raw) => withEntry(raw, response, itemId, entry));
    setSaved((s) => ({ ...s, [itemId]: false }));
    setErrors((e) => { if (!(itemId in e)) return e; const next = { ...e }; delete next[itemId]; return next; });
    const now = Date.now();
    if (!firstAt.current.has(itemId)) firstAt.current.set(itemId, now);
    const timer = timers.current.get(itemId);
    if (timer) clearTimeout(timer);
    timers.current.set(itemId, setTimeout(() => void sendRef.current(itemId), delayFor(firstAt.current.get(itemId) ?? now, now)));
  }, [update]);

  // Send what is waiting now: on a screen change and when a control loses focus. Waiting
  // means a timer not yet run; a sent answer is not sent twice.
  const flush = useCallback(() => {
    for (const itemId of [...timers.current.keys()]) void sendRef.current(itemId);
  }, []);

  // The server has no response for this device (a cleared cookie): nothing on the page is
  // saved any more, and this response's queue belongs to it. The page answers for no
  // response until Start binds the new one at once (before the next render) and sends the
  // drafts again; replies for the lost response change nothing. Binding a response other
  // than the one the page answers for also forgets what the page knew of the old one.
  const forget = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    pending.current.clear();
    firstAt.current.clear();
    inflight.current.clear();
    hideSent.current.clear();
    known.current.clear();
    failed.current.clear();
    doneAt.current.clear();
    setFailing(false);
  }, []);
  const reset = useCallback(() => {
    forget();
    const lost = responseRef.current;
    if (lost) update((raw) => withoutResponse(raw, lost));
    responseRef.current = null;
    setSaved({});
    setDone({});
  }, [forget, update]);
  const bind = useCallback((id: string) => {
    if (responseRef.current !== null && responseRef.current !== id) forget();
    responseRef.current = id;
  }, [forget]);
  const resend = useCallback((drafts: Record<string, CardDraft>) => {
    for (const [itemId, draft] of Object.entries(drafts)) if (draft.picked !== null) queue(itemId, draft);
  }, [queue]);

  // Open: the answers this device did not get to the server last time come back on their
  // cards and are sent with the version, page and number they were queued with, so the
  // server's rule decides (src/lib/answer-queue.ts): one made on the version it still holds,
  // or after that page's own earlier save, lands; one another window or device has replaced
  // since comes back stale, and the card shows the stored answer with the sentence. They
  // reach the cards one render after the page mounts, in a microtask (developer.mozilla.org/
  // docs/Web/API/Window/queueMicrotask): the read is of an outside store the server render
  // cannot know. Only the response the page opened with has a queue to read: after a Start
  // the drafts on the cards are what goes.
  const ids = itemIds.join("|");
  const initial = useRef({ response: responseId, answers: initialAnswers, done: false });
  useEffect(() => {
    if (!enabled || !responseId || responseId !== initial.current.response || initial.current.done) return;
    initial.current.done = true;
    const s = deviceStorage();
    if (!s) return;
    let raw: string | null = null;
    try { raw = s.getItem(key); } catch { return; }
    const back = Object.entries(restorable(raw, responseId, new Set(ids.split("|")), initial.current.answers)).filter(([id]) => !pending.current.has(id));
    for (const [id, entry] of back) pending.current.set(id, entry);
    // The store keeps what this page took; an entry the server already matches goes.
    update(() => withEntries(responseId, Object.fromEntries(pending.current)));
    if (back.length === 0) return;
    queueMicrotask(() => {
      eventsRef.current.onRestore(Object.fromEntries(back.map(([id, entry]) => [id, entry.draft])));
      setSaved((prev) => ({ ...prev, ...Object.fromEntries(back.map(([id]) => [id, false])) }));
      flushAll();
    });
  }, [enabled, responseId, key, ids, update, flushAll]);

  useEffect(() => {
    const onHide = () => flushAll(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") { flushAll(true); return; }
      // Shown again: a new hide may send again, and what is still unconfirmed goes out now.
      hideSent.current.clear();
      if (!down.current) flushAll();
    };
    const onFocusOut = () => flush();
    // The builder's preview (src/lib/preview-prefix.ts) has no state to check.
    // Nor has the visitors' sample (stories/E12-4): it never calls the server.
    const onOnline = () => { if (!isPreviewToken(token) && token !== SAMPLE_TOKEN) void check(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("online", onOnline);
    };
  }, [flush, flushAll, check, token]);

  // Mount, and again after the extra setup and cleanup React runs in development
  // (react.dev/reference/react/StrictMode): a change made before this ran (an edit the page
  // took while it was still hydrating) lost its timer to the cleanup, so it goes now.
  useEffect(() => {
    alive.current = true;
    const pendingTimers = timers.current;
    for (const itemId of pending.current.keys()) if (!pendingTimers.has(itemId)) void sendRef.current(itemId);
    return () => {
      alive.current = false;
      if (retry.current) { clearTimeout(retry.current); retry.current = null; }
      for (const timer of pendingTimers.values()) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, []);

  // Submit (E7-5) waits for every change on the cards (settleState): "ok" once none waits;
  // "failed" when one fails, the page is offline or 10 seconds pass; "check" when a card's
  // answer was refused or changed elsewhere meanwhile, or the response changed.
  const settle = useCallback(async (): Promise<"ok" | "failed" | "check"> => {
    flush();
    const until = Date.now() + SAVE_TIMEOUT_MS;
    const response = responseRef.current;
    const upsetAt = upsets.current;
    for (;;) {
      const state = settleState({ waiting: pending.current.size, failed: failed.current.size, down: down.current, alive: alive.current, late: Date.now() > until, upset: upsets.current !== upsetAt, moved: responseRef.current !== response });
      if (state !== "wait") return state;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [flush]);

  return { saved, done, settle, errors, offline, unsaved: offline || failing, storageOff, queue, flush, reset, bind, resend };
}
