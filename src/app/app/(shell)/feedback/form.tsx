"use client";
// The feedback form (stories/E17-1, acceptance 2): the kind as radio buttons, the text, the
// page as a line, Send; the state from the server action (useActionState:
// react.dev/reference/react/useActionState). After "Sent" the form is cleared.
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_KINDS } from "@/db/types";
import { FEEDBACK_COPY as C } from "@/lib/feedback-copy";
import { sendFeedbackAction, type FeedbackState } from "./actions";

const INITIAL: FeedbackState = { error: null, sent: false };

export function FeedbackForm({ page, email }: { page: string | null; email: string }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedbackAction, INITIAL);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.sent) form.current?.reset(); }, [state]);
  return (
    <form ref={form} action={action} noValidate className="card flex flex-col gap-4 px-5 py-4" data-testid="feedback-form">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">{C.kindLabel}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {FEEDBACK_KINDS.map((k) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input type="radio" name="kind" value={k} className="accent-violet" />
              {C.kinds[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback-text">{C.textLabel}</Label>
        <Textarea id="feedback-text" name="text" rows={6} maxLength={2000} aria-describedby={state.error ? "feedback-error" : "feedback-hint"} aria-invalid={state.error ? true : undefined} />
        <p id="feedback-hint" className="text-xs text-ink-muted">{C.textHint}</p>
      </div>
      {page && <p className="text-sm text-ink-muted" data-testid="feedback-about">{C.about(page)}</p>}
      <input type="hidden" name="page" value={page ?? ""} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>{pending ? C.sending : C.send}</Button>
        {state.error && <p id="feedback-error" role="alert" className="text-sm text-danger">{state.error}</p>}
        {!state.error && state.sent && <p role="status" className="text-[13px] text-agree-text" data-testid="feedback-sent">{C.sent(email)}</p>}
      </div>
    </form>
  );
}
