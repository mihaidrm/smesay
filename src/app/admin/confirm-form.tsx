"use client";
// One admin action as a form with its confirm line (stories/E14-2 and E14-3, acceptance 3).
// The first press shows the line with Confirm and Cancel instead of acting, and the form's
// fields go inert (html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute) until
// Confirm or Cancel, so what is sent is what the line named; inert fields are still sent with
// the form. Confirm sends the form to the server action; its answer (done or refused) shows
// under the form (useActionState: react.dev/reference/react/useActionState). The action runs
// from the submit handler in a transition (react.dev/reference/react/startTransition) rather
// than as the form's action, so a refusal keeps what was typed; after a done line the fields go
// back to their defaults. New to the design system: design note 86.
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";

// What every admin action answers: a refusal or a done line.
export type AdminActionState = { error: string | null; done: string | null };

type Props = {
  action: (previous: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  hidden: Record<string, string>;
  label: string;
  // The confirm line; "[VALUE]" in it becomes the form's valueField as typed or picked, named
  // through valueLabels when given (a plan key shown as its name).
  confirmLine: string;
  valueField?: string;
  valueLabels?: Record<string, string>;
  children?: React.ReactNode;
  testId: string;
  variant?: "secondary" | "destructive";
};

export function ConfirmForm({ action, hidden, label, confirmLine, valueField, valueLabels, children, testId, variant = "secondary" }: Props) {
  const [state, run, pending] = useActionState(action, { error: null, done: null });
  const [asking, setAsking] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.done) form.current?.reset(); }, [state]);
  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (asking === null) {
          const value = valueField ? String(data.get(valueField) ?? "").trim() : "";
          setAsking(confirmLine.replace("[VALUE]", valueLabels?.[value] ?? value));
          return;
        }
        setAsking(null);
        startTransition(() => run(data));
      }}
      className="flex flex-col gap-2"
      data-testid={testId}
    >
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="flex flex-wrap items-end gap-2">
        {children && <div className="contents" inert={asking !== null}>{children}</div>}
        {asking === null && <Button type="submit" variant={variant} size="small" disabled={pending}>{label}</Button>}
      </div>
      {asking !== null && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-tint px-3 py-2 text-sm" role="alertdialog" aria-label={label} data-testid="confirm-line">
          <span>{asking}</span>
          <Button type="submit" variant={variant === "destructive" ? "destructive" : "primary"} size="small">{C.confirm}</Button>
          <Button type="button" variant="secondary" size="small" onClick={() => setAsking(null)}>{C.cancel}</Button>
        </div>
      )}
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state.done && <p className="text-sm text-ink-muted" role="status">{state.done}</p>}
    </form>
  );
}
