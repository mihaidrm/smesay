"use client";
// "Shape with AI" / "Run again" (stories/E4-2, acceptance 4): a form on shapeAction with a
// loading state. While the run is pending the thinking state shows under the button
// (stories/E4-8, acceptance 5) with the set's item count. A refusal shows beside the button
// in the danger tint with an alert icon (E4-8, acceptance 6; docs/copy/errors.md, Shaping);
// "Try again", which submits the form again, only when a second try can help (the AI did
// not answer, or answered badly), not for a budget, plan, size or sample refusal.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { Thinking } from "@/components/app/thinking";
import { Button } from "@/components/ui/button";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { shapeAction, type ProjectFormState } from "../../actions";

export function ShapeButton({ projectId, shaped, items }: { projectId: string; shaped: boolean; items: number }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(shapeAction, { error: null, saved: false });
  return (
    <form action={action} id="shape-run" className="flex flex-wrap items-center justify-end gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      {state.error && !pending && (
        <div id="shape-error" role="alert" className="flex items-center gap-3 rounded-lg bg-coral-soft px-4 py-2 text-sm text-danger">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>{state.error}</span>
          {state.retry && <Button type="submit" variant="secondary" size="small">{SHAPE_COPY.tryAgain}</Button>}
        </div>
      )}
      <Button type="submit" loading={pending} variant={shaped ? "secondary" : "primary"}>{pending ? SHAPE_COPY.shaping : shaped ? SHAPE_COPY.runAgain : SHAPE_COPY.shape}</Button>
      {pending && <Thinking steps={SHAPE_COPY.thinking(items)} className="basis-full justify-end" />}
    </form>
  );
}
