"use client";
// One admin action as a form with its confirm line (stories/E14-2, acceptance 3): the first press
// shows the line with Confirm and Cancel instead of acting; Confirm submits to the server action,
// whose answer (done or refused) shows under the form (useActionState: react.dev/reference/react/
// useActionState). The confirm line is built from what the form holds when it is pressed, so a
// plan picked in the select is the plan named. New to the design system: design note 86.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";
import type { AdminActionState } from "./actions";

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
  return (
    <form
      action={(formData) => { setAsking(null); run(formData); }}
      onSubmit={(e) => {
        if (asking !== null) return;
        e.preventDefault();
        const value = valueField ? String(new FormData(e.currentTarget).get(valueField) ?? "").trim() : "";
        setAsking(confirmLine.replace("[VALUE]", valueLabels?.[value] ?? value));
      }}
      className="flex flex-col gap-2"
      data-testid={testId}
    >
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="flex flex-wrap items-end gap-2">
        {children}
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
