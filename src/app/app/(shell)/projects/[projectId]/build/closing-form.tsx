"use client";
// The Closing card of Build (stories/E5-5, acceptance 1): the closing question (optional,
// up to 200 characters), the missing-item switch, the confidence row (always on, shown as
// such, decision 0003) and the sign-off text (up to 300 characters, the default sentence
// prefilled). The server applies the rule again (saveClosing in src/lib/instruments.ts).
// Once published the question is locked with its line; the switch and the sign-off still
// change. Focusing or clicking any control opens the Wrap up in the preview (acceptance
// 3; data-preview-screen, src/components/app/preview-frame.tsx PreviewColumn). "Saved."
// until the next change; Save is secondary like the other Build cards (design note 38).
import { useActionState, useId, useState } from "react";
import { Toggle } from "@/components/app/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClosingSpec } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { CLOSING_COPY, CLOSING_QUESTION_MAX, SIGN_OFF_MAX, signOffFor } from "@/lib/closing";
import { saveClosingAction, type ProjectFormState } from "../../actions";

export function ClosingForm({ projectId, instrumentId, closing, locked }: { projectId: string; instrumentId: string; closing: ClosingSpec; locked: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveClosingAction, { error: null, saved: false });
  const [question, setQuestion] = useState(closing.closingQuestion ?? "");
  const [missingForm, setMissingForm] = useState(closing.missingForm);
  const [signOff, setSignOff] = useState(signOffFor(closing));
  const [dirty, setDirty] = useState(false);
  const id = useId();
  const touch = () => setDirty(true);
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate data-preview-screen="wrap" className="flex flex-col gap-4" data-testid="closing-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="missingForm" value={missingForm ? "1" : "0"} />
      <input type="hidden" name="confidence" value="1" />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-question`} className="text-[13px]">{CLOSING_COPY.questionLabel}</Label>
        <Input id={`${id}-question`} name="closingQuestion" value={question} maxLength={CLOSING_QUESTION_MAX} disabled={locked} aria-describedby={`${id}-question-hint`} onChange={(e) => { setQuestion(e.target.value); touch(); }} />
        <p id={`${id}-question-hint`} className="text-[13px] text-ink-muted">{locked ? CLOSING_COPY.questionLocked : CLOSING_COPY.questionHint}</p>
      </div>
      <div className="item-row flex items-center justify-between gap-4 px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <span id={`${id}-missing`} className="text-sm font-semibold">{CLOSING_COPY.missingTitle}</span>
          <span id={`${id}-missing-line`} className="text-[13px] text-ink-muted">{CLOSING_COPY.missingLine}</span>
        </div>
        <Toggle checked={missingForm} onChange={(next) => { setMissingForm(next); touch(); }} aria-labelledby={`${id}-missing`} aria-describedby={`${id}-missing-line`} />
      </div>
      <div className="item-row flex items-center justify-between gap-4 px-3.5 py-3" data-testid="closing-confidence">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{CLOSING_COPY.confidenceTitle}</span>
          <span className="text-[13px] text-ink-muted">{CLOSING_COPY.confidenceLine}</span>
        </div>
        <span className="shrink-0 rounded-full bg-tint px-3 py-1 text-xs font-semibold text-ink-muted">{CLOSING_COPY.always}</span>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-signoff`} className="text-[13px]">{CLOSING_COPY.signOffLabel}</Label>
        <Textarea id={`${id}-signoff`} name="signOffText" rows={2} value={signOff} maxLength={SIGN_OFF_MAX} aria-describedby={`${id}-signoff-hint`} onChange={(e) => { setSignOff(e.target.value); touch(); }} className="min-h-[64px]" />
        <p id={`${id}-signoff-hint`} className="text-[13px] text-ink-muted">{CLOSING_COPY.signOffHint}</p>
      </div>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending}>{BUILD_COPY.save}</Button></div>
    </form>
  );
}
