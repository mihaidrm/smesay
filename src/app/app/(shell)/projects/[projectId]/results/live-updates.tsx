"use client";
// Live updates on Results (stories/E8-7): the page listens to /api/projects/[id]/events
// (EventSource: developer.mozilla.org/docs/Web/API/EventSource) and reads itself again from
// the server on a change (router.refresh: node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/use-router.md), so the strip, the open tab and the tracker
// show the new numbers with the filter kept. The rules (stale after 15 s, backoff, a read
// after a reconnect, one read a second at most, none in a hidden tab) are in
// src/lib/results-live.ts createLiveClient. The banner sits in a status region that is always
// there, so screen readers announce it when it appears (developer.mozilla.org/docs/Web/
// Accessibility/ARIA/Reference/Roles/status_role). Copy: docs/copy/errors.md, Results.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banner } from "@/components/ui/banner";
import { createLiveClient } from "@/lib/results-live";
import { RESULTS_COPY } from "@/lib/results-copy";

export function LiveUpdates({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const client = createLiveClient({
      open: () => new EventSource(`/api/projects/${projectId}/events`),
      refresh: () => router.refresh(),
      setStale,
      hidden: () => document.hidden,
    });
    const onVisible = () => { if (!document.hidden) client.visible(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      client.stop();
    };
  }, [projectId, router]);
  // The region is always there; the banner inside it is not a second region. Empty, it is
  // taken out of the page's flow (absolute), so it adds no gap to the column it sits in.
  return (
    <div role="status" className={stale ? undefined : "absolute"} data-testid="live-region">
      {stale && <Banner role="presentation" data-testid="live-stale">{RESULTS_COPY.liveStopped}</Banner>}
    </div>
  );
}
