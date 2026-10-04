"use client";
// "Revoke link" on the public link card (stories/E6-4, acceptance 1): one press, no
// confirmation (a kill switch has to be fast; docs/review-list.md), with the hint saying
// what it does. The server applies the rule (src/lib/sharing.ts revokeLink) and the card
// re-renders as Revoked with "Publish again".
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { SHARE_COPY } from "@/lib/sharing-copy";
import { revokeLinkAction, type ProjectFormState } from "../../actions";

export function RevokeLink({ projectId, instrumentId }: { projectId: string; instrumentId: string }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(revokeLinkAction, { error: null, saved: false });
  const id = useId();
  return (
    <form action={action} className="flex flex-col gap-2 border-t border-hairline pt-4" data-testid="revoke-link-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <div className="flex items-start justify-between gap-4">
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">{SHARE_COPY.revokeHint}</p>
        <Button type="submit" variant="destructive" loading={pending} aria-describedby={`${id}-hint`}>{SHARE_COPY.revoke}</Button>
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
