"use client";
// On a link that no longer takes answers (closed, revoked, or unknown: a personal link the
// PM renewed), the unsent answers this device
// kept for it (stories/E7-3; src/lib/answer-queue.ts) can never be saved: they are removed,
// so reasons and comments do not stay in the browser's storage (SECURITY.md, Public links and
// respondents). localStorage access can throw (a blocked store), so it is guarded
// (developer.mozilla.org/docs/Web/API/Window/localStorage, Exceptions).
import { useEffect } from "react";
import { queueKey } from "@/lib/answer-queue";

export function ForgetQueue({ token }: { token: string }) {
  useEffect(() => {
    try {
      window.localStorage.removeItem(queueKey(token));
    } catch {
      // Nothing kept, nothing to remove.
    }
  }, [token]);
  return null;
}
