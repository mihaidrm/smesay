"use client";
// Write actions and Write again (stories/E9-1, acceptance 1): a form on writeActionsAction
// with a loading state, as Shape with AI (E4-2). A refusal shows beside the button
// (docs/copy/errors.md, Actions), with "Try again" only when a second try can help (the AI
// did not answer, or answered badly); a run that kept no action says so.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { writeActionsAction, type WriteActionsState } from "./actions";

export function WriteActions({ projectId, again }: { projectId: string; again: boolean }) {
  const [state, action, pending] = useActionState<WriteActionsState>(writeActionsAction.bind(null, projectId), { error: null, retry: false, written: null });
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" loading={pending} variant={again ? "secondary" : "primary"} data-testid="write-actions">{pending ? ACTIONS_COPY.writing : again ? ACTIONS_COPY.writeAgain : ACTIONS_COPY.write}</Button>
      {state.error && !pending && (
        <div role="alert" className="flex items-center gap-3 rounded-lg bg-unclear-tint px-4 py-2 text-sm text-unclear-text" data-testid="actions-error">
          <span>{state.error}</span>
          {state.retry && <Button type="submit" variant="secondary" size="small">{SHAPE_COPY.tryAgain}</Button>}
        </div>
      )}
      {state.written === 0 && !pending && <p role="status" className="text-sm text-ink-muted" data-testid="actions-none">{ACTIONS_COPY.none}</p>}
    </form>
  );
}
