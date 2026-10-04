"use client";
// The card answers' saver (stories/E7-2; E7-3 widens it with the offline queue): a change
// waits 400 ms for the next one (typing), then goes to PUT /r/[token]/answers; focus
// leaving a box and the page being hidden send every waiting answer at once, the hidden
// page's with keepalive so the request outlives the tab (developer.mozilla.org/docs/Web/
// API/RequestInit, keepalive; the pagehide and visibilitychange events:
// developer.mozilla.org/docs/Web/API/Window/pagehide_event,
// developer.mozilla.org/docs/Web/API/Document/visibilitychange_event). One request per item
// is in flight at a time: a newer change waits for it and goes out when it returns, so the
// server writes an item's changes in the order they were made (src/db/queries/answers.ts
// locks the response row). A hidden page cannot wait, so its keepalive request goes out
// at once. A request that has not answered in 10 seconds is given up
// (developer.mozilla.org/docs/Web/API/AbortSignal/timeout_static), so a stalled connection
// does not hold the card's newer change. An answer is marked saved only when the server
// answered the newest request sent for its card and nothing newer waits. A link that
// stopped being open (410, 404, 403, a 409 not open yet) reloads the page, which then shows
// the link's state; a response not started returns the respondent to About you (`reset` marks every card not saved; the page sends the drafts
// again after Start, `resend`); an answer the server refused (422, a stale page) shows the
// server's sentence on its card until the next change.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CardDraft } from "@/components/respondent/item-card";

export const SAVE_DELAY_MS = 400;
export const SAVE_TIMEOUT_MS = 10_000;

export type SaverEvents = { onGone: () => void; onNotStarted: () => void };

export function useAnswerSaver(token: string, initialSaved: Record<string, boolean>, events: SaverEvents) {
  const [saved, setSaved] = useState<Record<string, boolean>>(initialSaved);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const waiting = useRef(new Map<string, CardDraft>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inflight = useRef(new Map<string, number>());
  const sent = useRef(new Map<string, number>());
  const sendRef = useRef<(itemId: string, keepalive?: boolean) => Promise<void>>(async () => {});
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

  const send = useCallback(async (itemId: string, keepalive = false) => {
    const timer = timers.current.get(itemId);
    if (timer) { clearTimeout(timer); timers.current.delete(itemId); }
    const draft = waiting.current.get(itemId);
    if (!draft || draft.picked === null) { waiting.current.delete(itemId); return; }
    if ((inflight.current.get(itemId) ?? 0) > 0 && !keepalive) return;
    waiting.current.delete(itemId);
    inflight.current.set(itemId, (inflight.current.get(itemId) ?? 0) + 1);
    const n = (sent.current.get(itemId) ?? 0) + 1;
    sent.current.set(itemId, n);
    const newest = () => sent.current.get(itemId) === n && !waiting.current.has(itemId);
    try {
      const response = await fetch(`/r/${encodeURIComponent(token)}/answers`, { method: "PUT", keepalive, signal: keepalive ? undefined : AbortSignal.timeout(SAVE_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, picked: draft.picked, reason: draft.reason, comment: draft.comment }) });
      if (response.ok) {
        if (newest()) setSaved((s) => ({ ...s, [itemId]: true }));
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 410 || response.status === 404 || response.status === 403 || (response.status === 409 && body.error === "notOpen")) eventsRef.current.onGone();
      else if (response.status === 409) eventsRef.current.onNotStarted();
      else if (body.error && newest()) { const error = body.error; setErrors((e) => ({ ...e, [itemId]: error })); }
    } catch {
      // Offline, a transient failure or the 10 seconds: the answer stays marked not saved
      // (E7-3 retries).
    } finally {
      const left = (inflight.current.get(itemId) ?? 1) - 1;
      if (left > 0) inflight.current.set(itemId, left);
      else inflight.current.delete(itemId);
      // A change made while this one was in flight goes out now, unless its timer still runs.
      if (left === 0 && waiting.current.has(itemId) && !timers.current.has(itemId)) void sendRef.current(itemId);
    }
  }, [token]);
  useEffect(() => { sendRef.current = send; }, [send]);

  const queue = useCallback((itemId: string, draft: CardDraft) => {
    waiting.current.set(itemId, draft);
    setSaved((s) => ({ ...s, [itemId]: false }));
    setErrors((e) => { if (!(itemId in e)) return e; const next = { ...e }; delete next[itemId]; return next; });
    const timer = timers.current.get(itemId);
    if (timer) clearTimeout(timer);
    timers.current.set(itemId, setTimeout(() => void sendRef.current(itemId), SAVE_DELAY_MS));
  }, []);

  const flush = useCallback((keepalive = false) => {
    for (const itemId of [...waiting.current.keys()]) void sendRef.current(itemId, keepalive);
  }, []);

  // The server has no response for this device (a cleared cookie): nothing on the page is
  // saved any more. After Start, the page sends its drafts again.
  const reset = useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    waiting.current.clear();
    setSaved({});
  }, []);
  const resend = useCallback((drafts: Record<string, CardDraft>) => {
    for (const [itemId, draft] of Object.entries(drafts)) if (draft.picked !== null) queue(itemId, draft);
  }, [queue]);

  useEffect(() => {
    const onHide = () => flush(true);
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(true); };
    const onFocusOut = () => flush(false);
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [flush]);

  return { saved, errors, queue, flush, reset, resend };
}
