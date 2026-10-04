"use client";
// Live updates on Results (stories/E8-7): while the instrument's link is open the page
// listens to /api/projects/[id]/events (EventSource: developer.mozilla.org/docs/Web/API/
// EventSource) and, on each "change", reads the page again from the server (router.refresh:
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md), so the
// strip, the open tab and the tracker show the new numbers with the filter kept. A stream with
// no heartbeat for 15 seconds shows the banner, is closed and opened again with backoff
// (src/lib/results-live.ts); the banner clears on the next event, and the page is read again
// to catch up. Copy: docs/copy/errors.md, Results.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { RESULTS_COPY } from "@/lib/results-copy";
import { isStale, reconnectDelay } from "@/lib/results-live";

export function LiveUpdates({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [stale, setStale] = useState(false);
  useEffect(() => {
    let source: EventSource | null = null;
    let lastBeat = Date.now();
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let refresh: ReturnType<typeof setTimeout> | null = null;
    let wasStale = false;
    let closed = false;
    // Several writes in a burst (an autosave, then Submit) read the page once.
    const refreshSoon = () => {
      if (refresh) return;
      refresh = setTimeout(() => { refresh = null; router.refresh(); }, 250);
    };
    const alive = () => {
      lastBeat = Date.now();
      attempt = 0;
      if (wasStale) { wasStale = false; setStale(false); refreshSoon(); }
    };
    const open = () => {
      if (closed) return;
      source = new EventSource(`/api/projects/${projectId}/events`);
      source.addEventListener("ready", alive);
      source.addEventListener("ping", alive);
      source.addEventListener("change", () => { alive(); refreshSoon(); });
      // A drop or a refused stream: close it and open it again after the backoff; the
      // browser's own retry would not back off, and stops for good after a refused one.
      source.onerror = () => {
        source?.close();
        source = null;
        if (!retry) retry = setTimeout(() => { retry = null; open(); }, reconnectDelay(attempt++));
      };
    };
    const watch = setInterval(() => {
      if (!isStale(lastBeat, Date.now()) || wasStale) return;
      wasStale = true;
      setStale(true);
      source?.close();
      source = null;
      if (!retry) retry = setTimeout(() => { retry = null; open(); }, reconnectDelay(attempt++));
    }, 1_000);
    open();
    return () => {
      closed = true;
      clearInterval(watch);
      if (retry) clearTimeout(retry);
      if (refresh) clearTimeout(refresh);
      source?.close();
    };
  }, [projectId, router]);
  return stale ? <Banner data-testid="live-stale">{RESULTS_COPY.liveStopped}</Banner> : null;
}
