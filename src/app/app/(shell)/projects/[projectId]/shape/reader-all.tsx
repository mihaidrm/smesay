"use client";
// "Accept all" and "Reject all" (stories/E4-3, acceptance 1): each shows a line with the
// count to confirm, then runs readerAllAction over the latest set's suggested versions. The
// page keys this by the count, so a change on the server closes an open confirm line.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { readerAllAction, type ProjectFormState } from "../../actions";

export function ReaderAll({ projectId, suggested }: { projectId: string; suggested: number }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(readerAllAction, { error: null, saved: false });
  const [confirming, setConfirming] = useState<"accept" | "reject" | null>(null);
  if (suggested === 0) return null;
  const error = state.error && <p id="reader-all-error" role="alert" className="text-sm text-danger">{state.error}</p>;
  if (!confirming) {
    return (
      <div className="flex items-center gap-2">
        {error}
        <Button type="button" variant="secondary" onClick={() => setConfirming("accept")}>{SHAPE_COPY.acceptAll}</Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming("reject")}>{SHAPE_COPY.rejectAll}</Button>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-3" data-testid="reader-all-confirm">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="move" value={confirming} />
      {error}
      <span className="text-sm">{confirming === "accept" ? SHAPE_COPY.acceptAllConfirm(suggested) : SHAPE_COPY.rejectAllConfirm(suggested)}</span>
      <Button type="submit" loading={pending}>{confirming === "accept" ? SHAPE_COPY.acceptAll : SHAPE_COPY.rejectAll}</Button>
      <Button type="button" variant="secondary" onClick={() => setConfirming(null)} disabled={pending}>{SHAPE_COPY.cancel}</Button>
    </form>
  );
}
