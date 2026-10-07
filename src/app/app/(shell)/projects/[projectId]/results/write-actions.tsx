"use client";
// Write actions and Write again (stories/E9-1, acceptance 1): a form on writeActionsAction
// with a loading state, as Shape with AI (E4-2). While the run is pending the thinking state
// shows under the button (stories/E4-8, acceptance 5) with the counts the tab passes. A
// refusal shows under the button in the danger tint with an alert icon (E4-8, acceptance 6;
// docs/copy/errors.md, Actions), with "Try again" only when a second try can help (the AI
// did not answer, or answered badly); a run that kept no action says so.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { Thinking } from "@/components/app/thinking";
import { Button } from "@/components/ui/button";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { writeActionsAction, type WriteActionsState } from "./actions";

export function WriteActions({ projectId, again, items, answers }: { projectId: string; again: boolean; items: number; answers: number }) {
  const [state, action, pending] = useActionState<WriteActionsState>(writeActionsAction.bind(null, projectId), { error: null, retry: false, written: null });
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <Button type="submit" loading={pending} variant={again ? "secondary" : "primary"} data-testid="write-actions">{pending ? ACTIONS_COPY.writing : again ? ACTIONS_COPY.writeAgain : ACTIONS_COPY.write}</Button>
      {pending && <Thinking steps={ACTIONS_COPY.thinking(items, answers)} />}
      {state.error && !pending && (
        <div role="alert" className="flex items-center gap-3 rounded-lg bg-coral-soft px-4 py-2 text-sm text-danger" data-testid="actions-error">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>{state.error}</span>
          {state.retry && <Button type="submit" variant="secondary" size="small">{SHAPE_COPY.tryAgain}</Button>}
        </div>
      )}
      {state.written === 0 && !pending && <p role="status" className="text-sm text-ink-muted" data-testid="actions-none">{ACTIONS_COPY.none}</p>}
    </form>
  );
}
