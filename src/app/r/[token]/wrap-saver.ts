"use client";
// The Wrap up's saver (stories/E7-5): the missing item, the closing answer and confidence go
// to PUT /r/[token]/wrap as the respondent writes them, within a second like the cards
// (answer-saver.ts; the same timing: src/lib/answer-queue.ts delayFor), one request at a time,
// the newest values each time (they replace the stored ones whole). Ticking the sign-off
// sends nothing: it is never saved, only posted with Submit. With no change waiting, a change
// that says what the server holds, or what it last refused, sends nothing either; with one
// waiting it goes, since the waiting one may have landed unanswered (wrapChange).
//
// Every write carries the Wrap up's version it was made on, this page's id and its number for
// the write, and the saves of other pages it was made on top of; the server takes it by the
// cards' rule or answers "stale" with the stored Wrap up (src/lib/wrap-queue.ts). A stale
// reply that is the page's own changes nothing on screen; any other came from another window
// or device, and the page shows the stored Wrap up with a sentence (`notice`). No clock
// decides, so an old change kept on a device never replaces a newer one.
//
// The change the server has not confirmed is kept on the device under smesay-wrap:[token],
// tied to the response, until the server holds it; a page that opens shows it and sends it
// with the version, page and number it was kept with, when the server holds nothing newer
// (restorableWrap), and otherwise drops it and says so. When the page is hidden or closed the
// waiting change goes out once more with keepalive (developer.mozilla.org/docs/Web/API/
// RequestInit, keepalive; developer.mozilla.org/docs/Web/API/Window/pagehide_event). A
// request that fails retries every 5 seconds with "Not saved" in the header; a link that
// stopped being open reloads the page; a response not this device's returns the respondent to
// About you; a refusal (422) shows its sentence. Submit first waits for what waits (`settle`:
// sent at once, nothing dropped, so a Submit that fails loses nothing), then posts with the
// version the page holds (`claim`).
import { useCallback, useEffect, useRef, useState } from "react";
import { delayFor, nextEntry, RETRY_MS, SAVE_TIMEOUT_MS, settleState } from "@/lib/answer-queue";
import { EMPTY_WRAP, RESPONDENT_ERRORS, wrapKey, type SaveRef, type SinceReply, type WrapSync, type WrapValue } from "@/lib/respondent-rules";
import { answered, freshReply, rebasedWrap, restorableWrap, sendsNext, withoutWrapEntry, withWrapEntry, wrapChange, wrapEntryOf, wrapReplyStep, type WrapEntry, type WrapReplyBody } from "@/lib/wrap-queue";
import { newPageId } from "./answer-saver";

export type WrapSaverEvents = {
  onGone: () => void;
  onNotStarted: () => void;
  // The kept change the page opened with, and the stored Wrap up another window or device
  // wrote: the page shows them.
  onRestore: (value: WrapValue) => void;
  onStale: (value: WrapValue) => void;
  // A save the server answered (taken or stale), with what it says of the response's latest
  // Submit and the changes since (E7-6).
  onSaved?: (reply: SinceReply) => void;
};

const bodyOf = (response: string, entry: WrapEntry) => {
  const v = entry.draft;
  const missing = v.missing.text.trim() ? { text: v.missing.text } : null;
  return JSON.stringify({ response, confidence: v.confidence, closingAnswer: v.closingAnswer, missing, base: entry.base, page: entry.page, seq: entry.seq, after: entry.after });
};

export function useWrapSaver(token: string, responseId: string | null, server: { wrap: WrapValue } & WrapSync, events: WrapSaverEvents) {
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const key = wrapKey(token);
  // What the server holds and its version, as far as this page knows.
  const held = useRef(server.wrap);
  const known = useRef(server.version);
  // The newest change the server has not confirmed, and the one in flight.
  const current = useRef<WrapEntry | null>(null);
  const inflight = useRef<WrapEntry | null>(null);
  const hideSent = useRef<string | null>(null);
  const seq = useRef(0);
  const page = useRef<string | null>(null);
  const pageId = useCallback(() => (page.current ||= newPageId()), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstAt = useRef<number | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failing = useRef(false);
  // How many replies refused the Wrap up or showed another window's (for settle), the last
  // sentence they gave, and the value last refused.
  const upsets = useRef(0);
  const problem = useRef<string | null>(null);
  const refused = useRef<WrapValue | null>(null);
  const alive = useRef(true);
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);
  const responseRef = useRef(responseId);
  useEffect(() => { responseRef.current = responseId; }, [responseId]);
  const sendRef = useRef<(keepalive?: boolean) => Promise<void>>(async () => {});

  const update = useCallback((change: (raw: string | null) => string | null) => {
    try {
      const store = window.localStorage;
      const next = change(store.getItem(key));
      if (next === null) store.removeItem(key);
      else store.setItem(key, next);
    } catch { /* Kept in the page only. */ }
  }, [key]);
  const markFailed = useCallback((on: boolean) => { failing.current = on; setFailed(on); }, []);
  const scheduleRetry = useCallback(() => { if (!retry.current) retry.current = setTimeout(() => { retry.current = null; void sendRef.current(); }, RETRY_MS); }, []);
  const clearTimer = useCallback(() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }, []);

  const send = useCallback(async (keepalive = false) => {
    const entry = current.current;
    const response = responseRef.current;
    if (!entry || !response) return;
    if (keepalive) {
      // pagehide and visibilitychange both fire when a tab closes: one keepalive copy.
      const id = `${entry.page}:${entry.seq}`;
      if (hideSent.current === id) return;
      hideSent.current = id;
    } else {
      if (inflight.current) return;
      clearTimer();
      inflight.current = entry;
      firstAt.current = null;
    }
    const settled = () => { if (!keepalive && inflight.current === entry) inflight.current = null; };
    try {
      const reply = await fetch(`/r/${encodeURIComponent(token)}/wrap`, { method: "PUT", keepalive, signal: keepalive ? undefined : AbortSignal.timeout(SAVE_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: bodyOf(response, entry) });
      settled();
      // A reply for a response the page no longer answers for changes nothing.
      if (!alive.current || responseRef.current !== response) return;
      const body = (await reply.json().catch(() => ({}))) as WrapReplyBody;
      const step = wrapReplyStep(reply.status, body, entry, current.current, pageId(), known.current);
      if (step.outcome === "gone") { eventsRef.current.onGone(); return; }
      if (step.outcome === "notStarted") { eventsRef.current.onNotStarted(); return; }
      // A reply about an older version than the page has seen says nothing new.
      if ((step.outcome === "saved" || step.outcome === "stale") && freshReply(step.version, known.current)) eventsRef.current.onSaved?.(body);
      if (step.version !== null) known.current = Math.max(known.current, step.version);
      if (step.held) { held.current = step.held; refused.current = null; }
      if (step.failed !== null) markFailed(step.failed);
      // Answered: a retry still set for an earlier failure is not needed.
      if (answered(step) && retry.current) { clearTimeout(retry.current); retry.current = null; }
      if (step.rebase !== null && current.current) {
        // A newer change waits: it goes on top of the page's own confirmed save.
        const base = step.rebase;
        const next = { ...current.current, base, after: [] as SaveRef[] };
        current.current = next;
        update((raw) => rebasedWrap(raw, response, next.page, base));
      }
      if (step.done) {
        const waiting = current.current ?? entry;
        clearTimer();
        firstAt.current = null;
        current.current = null;
        update((raw) => withoutWrapEntry(raw, response, waiting.page, waiting.seq));
      }
      if (step.changedElsewhere || step.error) upsets.current += 1;
      if (step.changedElsewhere && step.held) {
        problem.current = RESPONDENT_ERRORS.wrapChanged;
        setNotice(RESPONDENT_ERRORS.wrapChanged);
        eventsRef.current.onStale(step.held);
      }
      if (step.error) {
        problem.current = step.error;
        refused.current = entry.draft;
        setError(step.error);
      }
      if (step.failed) scheduleRetry();
    } catch {
      // No connection, the time limit, or a keepalive the browser would not send: only a
      // change that still waits, for the response the page answers for, counts as failed.
      settled();
      if (!alive.current || responseRef.current !== response || !current.current || keepalive) return;
      markFailed(true);
      scheduleRetry();
    } finally {
      // A change made while this one was in flight goes now, unless its timer still runs or it
      // waits for its retry.
      const next = current.current;
      // A keepalive copy's answer drives the queue too: it may have cleared the retry.
      if (alive.current && sendsNext(next, entry, { inflight: inflight.current !== null, timer: timer.current !== null, retry: retry.current !== null })) void sendRef.current();
    }
  }, [token, update, pageId, markFailed, scheduleRetry, clearTimer]);
  useEffect(() => { sendRef.current = send; }, [send]);

  // A change of the form: the newest values wait for their turn, kept on the device.
  const queue = useCallback((raw: WrapValue) => {
    const response = responseRef.current;
    if (!response) return;
    const value = raw;
    const prev = current.current;
    if (wrapChange(prev, value, held.current, refused.current) === "skip") return;
    setError(null);
    setNotice(null);
    seq.current += 1;
    const entry = nextEntry(prev ?? undefined, value, known.current, pageId(), seq.current);
    current.current = entry;
    update(() => withWrapEntry(response, entry));
    const now = Date.now();
    firstAt.current ??= now;
    clearTimer();
    timer.current = setTimeout(() => { timer.current = null; void sendRef.current(); }, delayFor(firstAt.current, now));
  }, [update, pageId, clearTimer]);

  // Before Submit: what waits goes now (a retry waiting too) and Submit waits for the server
  // to hold it. ok: nothing waits; failed: it could not be saved now (it stays queued and
  // retries); check: the Wrap up was refused or changed elsewhere meanwhile, or the page
  // answers for another response now.
  const settle = useCallback(async (): Promise<"ok" | "failed" | "check"> => {
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    failing.current = false;
    const response = responseRef.current;
    const upsetAt = upsets.current;
    void sendRef.current();
    const until = Date.now() + SAVE_TIMEOUT_MS;
    for (;;) {
      const state = settleState({ waiting: current.current ? 1 : 0, failed: failing.current ? 1 : 0, down: false, alive: alive.current, late: Date.now() > until, upset: upsets.current !== upsetAt, moved: responseRef.current !== response });
      if (state !== "wait") return state;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, []);

  // Submit's version fields: the version the page holds, and this page's next number.
  const claim = useCallback(() => {
    seq.current += 1;
    return { base: known.current, page: pageId(), seq: seq.current, after: [] as SaveRef[] };
  }, [pageId]);
  // Submit's reply: the server holds these values at this version, or another Wrap up.
  const submitted = useCallback((version: unknown, value: WrapValue) => {
    if (typeof version === "number") known.current = Math.max(known.current, version);
    held.current = value;
    refused.current = null;
    setNotice(null);
    setError(null);
  }, []);
  // The sentence of the last refusal or change elsewhere (what stopped a Submit's wait).
  const lastProblem = useCallback(() => problem.current, []);
  const adopt = useCallback((body: WrapReplyBody) => {
    if (typeof body.version === "number") known.current = Math.max(known.current, body.version);
    if (body.wrap) {
      held.current = body.wrap;
      eventsRef.current.onStale(body.wrap);
    }
    setNotice(RESPONDENT_ERRORS.wrapChanged);
  }, []);

  // A lost response: nothing of the old one is sent any more, and its kept change goes.
  const reset = useCallback(() => {
    const response = responseRef.current;
    clearTimer();
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    current.current = null;
    firstAt.current = null;
    held.current = EMPTY_WRAP;
    refused.current = null;
    known.current = 0;
    responseRef.current = null;
    markFailed(false);
    setError(null);
    setNotice(null);
    if (response) update((raw) => (wrapEntryOf(raw, response) ? null : raw));
  }, [update, markFailed, clearTimer]);
  // Start named the response the page answers for from now (the same one again included).
  const bind = useCallback((id: string) => { responseRef.current = id; }, []);

  // Open: the change this device kept comes back on the form and goes, when the server would
  // take it; one the server has replaced since goes with the sentence.
  const restored = useRef(false);
  const initial = useRef(server);
  useEffect(() => {
    alive.current = true;
    const response = responseRef.current;
    if (!restored.current && response) {
      restored.current = true;
      let raw: string | null = null;
      try { raw = window.localStorage.getItem(key); } catch { /* Nothing kept. */ }
      const { entry, dropped } = restorableWrap(raw, response, initial.current);
      if (entry) {
        current.current = entry;
        queueMicrotask(() => eventsRef.current.onRestore(entry.draft));
      } else if (wrapEntryOf(raw, response)) {
        update(() => null);
        if (dropped) queueMicrotask(() => setNotice(RESPONDENT_ERRORS.wrapChanged));
      }
    }
    // What waits without a timer (the kept change, or one whose timer the extra cleanup React
    // runs in development cleared: react.dev/reference/react/StrictMode) goes now.
    if (current.current && !inflight.current && !timer.current) void sendRef.current();
    return () => {
      alive.current = false;
      clearTimer();
      if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    };
  }, [key, update, clearTimer]);

  useEffect(() => {
    const onHide = () => void sendRef.current(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") { void sendRef.current(true); return; }
      hideSent.current = null;
      if (current.current && !inflight.current) void sendRef.current();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { failed, error, notice, queue, settle, claim, submitted, adopt, reset, bind, lastProblem };
}
