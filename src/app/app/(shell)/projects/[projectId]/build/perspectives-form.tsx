"use client";
// The Perspectives card of Build (stories/E5-4, acceptance 1): the names one per line, up
// to ten of up to 30 characters, saved with the server rule (savePerspectives in
// src/lib/instruments.ts); under it, how many items carry one and the way to Shape, where
// items are tagged. "Saved." until the next change; Save is secondary like the other Build
// cards (design note 38). Locked once published, like the Scoring card: the field and Save
// are disabled under the locked line, and the server refuses too (savePerspectives).
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUILD_COPY } from "@/lib/build-copy";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { savePerspectivesAction, type ProjectFormState } from "../../actions";

export function PerspectivesForm({ projectId, instrumentId, names, tagged, total, locked }: { projectId: string; instrumentId: string; names: string[]; tagged: number; total: number; locked: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(savePerspectivesAction, { error: null, saved: false });
  const [text, setText] = useState(names.join("\n"));
  const [dirty, setDirty] = useState(false);
  const id = useId();
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-3" data-testid="perspectives-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      {locked && <p className="text-[13px] text-ink-muted" data-testid="perspectives-locked">{PERSPECTIVES_COPY.locked}</p>}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-names`} className="text-[13px]">{BUILD_COPY.perspectivesLabel}</Label>
        <Textarea id={`${id}-names`} name="perspectives" rows={3} value={text} onChange={(e) => { setDirty(true); setText(e.target.value); }} disabled={locked} className="min-h-[84px]" />
      </div>
      <p className="text-[13px] text-ink-muted" data-testid="perspectives-tagged">
        {names.length === 0 ? BUILD_COPY.perspectivesNone : <>{BUILD_COPY.perspectivesTagged(tagged, total)} {!locked && <Link href={`/app/projects/${projectId}/shape`} className="underline underline-offset-4">{BUILD_COPY.perspectivesTaggedLink}</Link>}</>}
      </p>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      {!locked && <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending}>{BUILD_COPY.save}</Button></div>}
    </form>
  );
}
