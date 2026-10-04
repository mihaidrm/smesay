"use client";
// The Wrap up's saver (stories/E7-5): the missing item, the closing answer and confidence go
// to PUT /r/[token]/wrap as the respondent writes them, within a second like the cards
// (answer-saver.ts; the same timing: src/lib/answer-queue.ts delayFor), one request at a time,
// the newest values each time (they replace the stored ones whole). The page keeps them on the
// device until the server holds them (smesay-wrap:[token]), so a closed tab loses nothing;
// `onHeld` says when the server holds what the page shows. A request that fails retries every
// 5 seconds with "Not saved" in the header; a link that stopped being open reloads the page;
// a response not this device's returns the respondent to About you; a refusal (422) shows its
// sentence under Submit. Submit carries the same values, so before it posts, `settle` drops
// what waits and lets a request in flight finish, so an older save never lands after it.
import { useCallback, useEffect, useRef, useState } from "react";
import { delayFor, outcomeOf, RETRY_MS, SAVE_TIMEOUT_MS } from "@/lib/answer-queue";
import type { WrapValue } from "@/lib/respondent-rules";

export type WrapSaverEvents = { onGone: () => void; onNotStarted: () => void; onHeld: () => void };

const bodyOf = (response: string, value: WrapValue) => {
  const missing = value.missing.text.trim() ? { text: value.missing.text, area: value.missing.area || null, value: value.missing.value || null } : null;
  return JSON.stringify({ response, confidence: value.confidence, closingAnswer: value.closingAnswer, missing });
};

export function useWrapSaver(token: string, responseId: string | null, events: WrapSaverEvents) {
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<WrapValue | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstAt = useRef<number | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);
  const responseRef = useRef(responseId);
  useEffect(() => { responseRef.current = responseId; }, [responseId]);
  const sendRef = useRef<() => void>(() => {});

  const send = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const value = latest.current;
    const response = responseRef.current;
    if (!value || !response || inflight.current) return;
    firstAt.current = null;
    const run = (async () => {
      try {
        const reply = await fetch(`/r/${encodeURIComponent(token)}/wrap`, { method: "PUT", signal: AbortSignal.timeout(SAVE_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: bodyOf(response, value) });
        if (!alive.current || responseRef.current !== response) return;
        const body = (await reply.json().catch(() => ({}))) as { error?: string };
        const outcome = outcomeOf(reply.status, body.error);
        if (outcome === "saved") {
          setFailed(false);
          setError(null);
          if (latest.current === value) { latest.current = null; eventsRef.current.onHeld(); }
          return;
        }
        if (outcome === "gone") { eventsRef.current.onGone(); return; }
        if (outcome === "notStarted") { eventsRef.current.onNotStarted(); return; }
        if (outcome === "refused") { if (latest.current === value) latest.current = null; setError(body.error ?? null); return; }
        throw new Error("retry");
      } catch {
        if (!alive.current || responseRef.current !== response) return;
        setFailed(true);
        if (!retry.current) retry.current = setTimeout(() => { retry.current = null; sendRef.current(); }, RETRY_MS);
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    // A change made while this one flew goes next.
    void run.then(() => { if (alive.current && latest.current && latest.current !== value && !timer.current) sendRef.current(); });
  }, [token]);
  useEffect(() => { sendRef.current = send; }, [send]);

  const queue = useCallback((value: WrapValue) => {
    latest.current = value;
    setError(null);
    const now = Date.now();
    firstAt.current ??= now;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => sendRef.current(), delayFor(firstAt.current, now));
  }, []);

  // Before Submit: what waits is dropped (Submit posts the same values), a request in flight
  // finishes first. false when it does not within the time limit.
  const settle = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    latest.current = null;
    firstAt.current = null;
    const flying = inflight.current;
    if (!flying) return true;
    const limit = new Promise<false>((resolve) => setTimeout(() => resolve(false), SAVE_TIMEOUT_MS));
    return Promise.race([flying.then(() => true as const), limit]);
  }, []);

  // A lost response: nothing of the old one is sent any more.
  const reset = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    latest.current = null;
    firstAt.current = null;
    responseRef.current = null;
    setFailed(false);
    setError(null);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    };
  }, []);

  return { failed, error, queue, settle, reset };
}
