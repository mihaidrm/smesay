"use client";
// Mark done and Dismiss on an open action, Reopen on a closed one (stories/E9-2, acceptance 1):
// each a form on setActionStateAction, sending the state the page shows so a stale tab is
// refused; the button pressed shows the spinner while it posts (Button loading,
// docs/design-system.md), and a refusal shows beside the buttons (useActionState:
// react.dev/reference/react/useActionState). All secondary: one primary per screen (Write
// actions).
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { InsightState } from "@/db/types";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { setActionStateAction, type ActionStateResult } from "./actions";

export function ActionControls({ projectId, insightId, state }: { projectId: string; insightId: string; state: InsightState }) {
  const [pressed, setPressed] = useState<InsightState | null>(null);
  const [result, action, pending] = useActionState<ActionStateResult, FormData>(
    (_prev, form) => setActionStateAction(projectId, insightId, state, String(form.get("state") ?? "")),
    { error: null },
  );
  // One form per button, the state in a hidden field, so the value sent never depends on how
  // the browser reports the button pressed.
  const buttons: { state: InsightState; label: string; testId: string }[] = state === "open"
    ? [{ state: "done", label: ACTIONS_COPY.markDone, testId: "action-done" }, { state: "dismissed", label: ACTIONS_COPY.dismiss, testId: "action-dismiss" }]
    : [{ state: "open", label: ACTIONS_COPY.reopen, testId: "action-reopen" }];
  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending || undefined}>
      {buttons.map((b) => (
        <form key={b.state} action={action} onSubmit={() => setPressed(b.state)}>
          <input type="hidden" name="state" value={b.state} />
          <Button type="submit" variant="secondary" size="small" disabled={pending} loading={pending && pressed === b.state} data-testid={b.testId}>{b.label}</Button>
        </form>
      ))}
      {result.error && !pending && <p role="alert" className="text-sm text-danger" data-testid="action-state-error">{result.error}</p>}
    </div>
  );
}
