"use client";
// "Build on version N" (stories/E5-1, owed from E3-6 acceptance 3): the card shown when a
// newer set exists than the one the instrument is built on. The action creates the new draft
// and the page re-renders on it.
import { useActionState } from "react";
import { Banner, bannerButtonClass } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { BUILD_COPY } from "@/lib/build-copy";
import { buildOnLatestAction, type ProjectFormState } from "../../actions";

export function BuildOn({ projectId, instrumentId, built, latest }: { projectId: string; instrumentId: string; built: number; latest: number }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(buildOnLatestAction, { error: null, saved: false });
  return (
    <form action={action} data-testid="build-on">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <Banner action={<Button type="submit" variant="secondary" size="small" loading={pending} className={bannerButtonClass}>{BUILD_COPY.buildOn(latest)}</Button>}>
        {BUILD_COPY.newer(built, latest)}
        {state.error && <span role="alert" className="block text-danger">{state.error}</span>}
      </Banner>
    </form>
  );
}
