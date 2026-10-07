"use client";
// The About this project form (stories/E3-1, acceptance 3): the count follows the fields as
// typed, trimmed as the server trims them (src/lib/project-context.ts, the same rule). The sample project is
// read-only (stories/E8-8, acceptance 2). useActionState: react.dev/reference/react/useActionState.
// A save that finds the session ended shows the signed-out banner and keeps the text; the draft
// is in the tab's session storage until the server saves it (stories/E11-6, acceptance 3).
// The card registers with the unsaved changes guard (stories/E5-9): a change, a draft put
// back, a save on its way, refused or signed out all count; Discard drops the stored draft
// and remounts the form with the server's values (useDiscard).
import { useActionState, useEffect, useRef, useState } from "react";
import { SignedOutBanner } from "@/components/app/signed-out-banner";
import { useDiscard, useUnsavedForm } from "@/components/app/unsaved";
import { useDraft } from "@/components/app/use-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTEXT_MAX, contextCount, contextLength } from "@/lib/project-context";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { ERROR_PAGE_COPY } from "@/lib/error-pages-copy";
import { isUnsaved } from "@/lib/unsaved";
import { saveContextAction, type ProjectFormState } from "../../actions";

type Props = { projectId: string; goal: string; terms: string; readOnly: boolean };

export function ContextForm(props: Props) {
  const [epoch, discard] = useDiscard();
  return <Form key={epoch} {...props} discard={discard} />;
}

function Form({ projectId, goal: initialGoal, terms: initialTerms, readOnly, discard }: Props & { discard: () => void }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveContextAction, { error: null, saved: false });
  const { values: { goal, terms }, set, restored, clear, forget } = useDraft(`context:${projectId}`, { goal: initialGoal, terms: initialTerms }, Boolean(state.signedOut));
  const [dirty, setDirty] = useState(false);
  const unsaved = useUnsavedForm({ id: "import-context", label: PROJECTS_COPY.aboutCard, dirty: !readOnly && (restored || isUnsaved(dirty, pending, state)), reset: () => { forget(); discard(); } });
  // What the last Save sent, so a stored draft is cleared only when that is what is on screen.
  const sent = useRef({ goal: initialGoal, terms: initialTerms });
  const setGoal = (v: string) => { setDirty(true); set("goal", v); };
  const setTerms = (v: string) => { setDirty(true); set("terms", v); };
  useEffect(() => { if (state.saved) clear(sent.current); }, [state, clear]);
  const over = contextLength(goal.trim(), terms.trim()) > CONTEXT_MAX;
  return (
    <form {...unsaved.props} action={action} onSubmit={() => { sent.current = { goal, terms }; setDirty(false); }} noValidate className="flex flex-col gap-3">
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
