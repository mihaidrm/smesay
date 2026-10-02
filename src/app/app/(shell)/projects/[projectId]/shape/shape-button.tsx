"use client";
// "Shape with AI" / "Run again" (stories/E4-2, acceptance 4): a form on shapeAction with a
// loading state. A refusal shows beside the button (docs/copy/errors.md, Shaping); "Try
// again", which submits the form again, only when a second try can help (the AI did not
// answer, or answered badly), not for a budget, plan, size or sample refusal.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { shapeAction, type ProjectFormState } from "../../actions";

export function ShapeButton({ projectId, shaped }: { projectId: string; shaped: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(shapeAction, { error: null, saved: false });
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && !pending && (
        <div id="shape-error" role="alert" className="flex items-center gap-3 rounded-lg bg-unclear-tint px-4 py-2 text-sm text-unclear-text">
          <span>{state.error}</span>
          {state.retry && <Button type="submit" variant="secondary" size="small">{SHAPE_COPY.tryAgain}</Button>}
        </div>
      )}
      <Button type="submit" loading={pending} variant={shaped ? "secondary" : "primary"}>{pending ? SHAPE_COPY.shaping : shaped ? SHAPE_COPY.runAgain : SHAPE_COPY.shape}</Button>
    </form>
  );
}
