"use client";
// The open page's watch on its link (stories/E6-4, acceptance 4): every LINK_POLL_SECONDS
// it asks /r/[token]/state and, on anything but 200 "open", refreshes the page, which the
// server then renders as the inactive, closed or passcode page; so an open tab turns
// inactive within a minute of a revoke without a reload, and at once when a background tab
// comes to the front. A failed fetch (offline) is ignored until the next tick (E7-3
// handles offline). router.refresh: node_modules/next/
// dist/docs/01-app/03-api-reference/04-functions/use-router.md.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const LINK_POLL_SECONDS = 60;

export function LinkWatch({ token }: { token: string }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const response = await fetch(`/r/${encodeURIComponent(token)}/state`, { cache: "no-store" });
        // Too many requests from this connection (E11-1) or maintenance (E11-6, 503): the page
        // stays with the answers on it, the next tick asks again.
        if (response.status === 429 || response.status === 503) return;
        const body = (await response.json()) as { state?: string };
        if (!stopped && (!response.ok || body.state !== "open")) router.refresh();
      } catch {
        // Offline or a transient failure: the next tick asks again.
      }
    };
    const id = setInterval(tick, LINK_POLL_SECONDS * 1000);
    // A tab coming back to the front asks at once: browsers slow timers in background tabs
    // (developer.mozilla.org/docs/Web/API/Page_Visibility_API, "Policies in place to aid
    // background page performance"; the visibilitychange event:
    // developer.mozilla.org/docs/Web/API/Document/visibilitychange_event).
    const onVisible = () => { if (document.visibilityState === "visible") void tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stopped = true; clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [token, router]);
  return null;
}
