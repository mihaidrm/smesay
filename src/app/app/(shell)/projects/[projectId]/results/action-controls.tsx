"use client";
// Mark done and Dismiss on an open action, Reopen on a closed one (stories/E9-2, acceptance 1):
// each a form on setActionStateAction with its pending state; a refusal shows beside the
// buttons (useActionState: react.dev/reference/react/useActionState).
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { InsightState } from "@/db/types";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { setActionStateAction, type ActionStateResult } from "./actions";

export function ActionControls({ projectId, insightId, state }: { projectId: string; insightId: string; state: InsightState }) {
  const [result, action, pending] = useActionState<ActionStateResult, FormData>(
    (_prev, form) => setActionStateAction(projectId, insightId, String(form.get("state") ?? "")),
    { error: null },
  );
  // One form per button, the state in a hidden field, so the value sent never depends on how
  // the browser reports the button pressed.
  // Mark done is the primary one, as on the PM app board.
  const buttons: { state: InsightState; label: string; testId: string; primary: boolean }[] = state === "open"
    ? [{ state: "done", label: ACTIONS_COPY.markDone, testId: "action-done", primary: true }, { state: "dismissed", label: ACTIONS_COPY.dismiss, testId: "action-dismiss", primary: false }]
    : [{ state: "open", label: ACTIONS_COPY.reopen, testId: "action-reopen", primary: false }];
  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending || undefined}>
      {buttons.map((b) => (
        <form key={b.state} action={action}>
          <input type="hidden" name="state" value={b.state} />
          <Button type="submit" variant={b.primary ? "primary" : "secondary"} size="small" disabled={pending} data-testid={b.testId}>{b.label}</Button>
        </form>
      ))}
      {result.error && !pending && <p role="alert" className="text-sm text-danger" data-testid="action-state-error">{result.error}</p>}
    </div>
  );
}
