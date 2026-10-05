"use client";
// The About this project form (stories/E3-1, acceptance 3): the count follows the fields as
// typed, trimmed as the server trims them (src/lib/project-context.ts, the same rule). The sample project is
// read-only (stories/E8-8, acceptance 2). useActionState: react.dev/reference/react/useActionState.
// A save that finds the session ended shows the signed-out banner and keeps the text; the draft
// is in the tab's session storage until the server saves it (stories/E11-6, acceptance 3).
import { useActionState, useEffect } from "react";
import { SignedOutBanner } from "@/components/app/signed-out-banner";
import { useDraft } from "@/components/app/use-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTEXT_MAX, contextCount, contextLength } from "@/lib/project-context";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";
import { saveContextAction, type ProjectFormState } from "../../actions";

export function ContextForm({ projectId, goal: initialGoal, terms: initialTerms, readOnly }: { projectId: string; goal: string; terms: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveContextAction, { error: null, saved: false });
  const { values: { goal, terms }, set, restored, clear } = useDraft(`context:${projectId}`, { goal: initialGoal, terms: initialTerms });
  const setGoal = (v: string) => set("goal", v);
  const setTerms = (v: string) => set("terms", v);
  useEffect(() => { if (state.saved) clear(); }, [state, clear]);
  const over = contextLength(goal.trim(), terms.trim()) > CONTEXT_MAX;
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
        <div id="ctx-count" data-testid="context-count" className={`whitespace-nowrap text-xs ${over ? "text-danger" : "text-ink-muted"}`}>{contextCount(goal.trim(), terms.trim())}</div>
      </div>
      {state.signedOut && <SignedOutBanner />}
      {restored && !state.saved && !state.signedOut && <p role="status" data-testid="draft-back" className="text-[13px] text-ink-muted">{ERROR_PAGE_COPY.draftBack}</p>}
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && state.saved && <p role="status" className="text-[13px] text-agree-text">{PROJECTS_COPY.saved}</p>}
      {!readOnly && <div className="flex justify-end"><Button type="submit" loading={pending} disabled={over}>Save</Button></div>}
      {readOnly && <p className="text-[13px] text-ink-muted">{PROJECTS_COPY.sample}</p>}
    </form>
  );
}
