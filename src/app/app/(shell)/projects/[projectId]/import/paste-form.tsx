"use client";
// The paste box (stories/E3-4, acceptance 1 to 3): "Paste a list" opens a textarea under the
// file input, one item per line, with the bar rule in one line under it; "Use this list" sends
// it to pasteAction. The error of the last attempt shows under the box.
// useActionState: react.dev/reference/react/useActionState. Text typed and not yet used
// registers with the unsaved changes guard (stories/E5-9) under the card's title; the box
// empties once the list went through (state adjusted during render on a changed result:
// react.dev/learn/you-might-not-need-an-effect, "Adjusting some state when a prop changes"),
// and Discard remounts it empty (useDiscard), still open.
import { useActionState, useState } from "react";
import { useDiscard, useUnsavedForm } from "@/components/app/unsaved";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PASTE_COPY } from "@/lib/import/paste";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { isUnsaved } from "@/lib/unsaved";
import { pasteAction, type ProjectFormState } from "../../actions";

export function PasteForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [epoch, discard] = useDiscard();
  if (!open) return <Button type="button" variant="tertiary" onClick={() => setOpen(true)}>Paste a list instead</Button>;
  return <Form key={epoch} projectId={projectId} discard={discard} />;
}

function Form({ projectId, discard }: { projectId: string; discard: () => void }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(pasteAction, { error: null, saved: false });
  const [text, setText] = useState("");
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state.saved) setText(""); }
  const unsaved = useUnsavedForm({ id: "import-paste", label: PROJECTS_COPY.listCard, dirty: isUnsaved(text.trim() !== "", pending, state), reset: discard });
  return (
    <form {...unsaved.props} action={action} noValidate className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Label htmlFor="paste-text" className="text-[13px]">Paste a list</Label>
      <Textarea id="paste-text" name="text" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Receipts captured by phone\nApproval from the notification email | Approving | Must"} aria-describedby="paste-hint" className="font-mono text-[13px]" />
      <p id="paste-hint" className="text-[13px] text-ink-muted">{PASTE_COPY.hint}</p>
      {state.error && <p id="paste-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end"><Button type="submit" loading={pending}>Use this list</Button></div>
    </form>
  );
}
