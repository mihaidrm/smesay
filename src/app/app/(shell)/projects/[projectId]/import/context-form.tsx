"use client";
// The About this project form (stories/E3-1, acceptance 3): the count follows the fields as
// typed (src/lib/project-context.ts, the same rule the server applies). The sample project is
// read-only (stories/E8-8, acceptance 2). useActionState: react.dev/reference/react/useActionState.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTEXT_MAX, contextCount, contextLength } from "@/lib/project-context";
import { saveContextAction, type ProjectFormState } from "../../actions";

export function ContextForm({ projectId, goal: initialGoal, terms: initialTerms, readOnly }: { projectId: string; goal: string; terms: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveContextAction, { error: null, saved: false });
  const [goal, setGoal] = useState(initialGoal);
  const [terms, setTerms] = useState(initialTerms);
  const over = contextLength(goal, terms) > CONTEXT_MAX;
  return (
    <form action={action} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="ctx-goal" className="text-[13px]">What is this about?</Label>
        <Textarea id="ctx-goal" name="goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} readOnly={readOnly} className="min-h-[60px]" aria-describedby="ctx-count" />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-grow flex-col gap-1">
          <Label htmlFor="ctx-terms" className="text-[13px]">Terms to keep as written, optional</Label>
          <Input id="ctx-terms" name="terms" value={terms} onChange={(e) => setTerms(e.target.value)} readOnly={readOnly} placeholder="Product names, internal acronyms, the client's own labels" className="h-9" aria-describedby="ctx-count" />
        </div>
        <div id="ctx-count" data-testid="context-count" className={`whitespace-nowrap text-xs ${over ? "text-danger" : "text-ink-muted"}`}>{contextCount(goal, terms)}</div>
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && state.saved && <p role="status" className="text-[13px] text-agree-text">Saved.</p>}
      {!readOnly && <div className="flex justify-end"><Button type="submit" loading={pending} disabled={over}>Save</Button></div>}
      {readOnly && <p className="text-[13px] text-ink-muted">The sample project cannot be edited.</p>}
    </form>
  );
}
