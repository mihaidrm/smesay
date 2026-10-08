"use client";
// The Import button (stories/E3-5, acceptance 3; E3-3, acceptance 1): a form on commitAction
// with a loading state that says what runs ("Importing [N] items...", design note 121); disabled at 40 percent while the mapping has no text column or there
// is nothing to import. The error of a refused commit shows beside it.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { commitAction, type ProjectFormState } from "../../actions";

export function ImportButton({ uploadId, label, pendingLabel, disabled }: { uploadId: string; label: string; pendingLabel: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(commitAction, { error: null, saved: false });
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="uploadId" value={uploadId} />
      {state.error && <p id="import-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} disabled={disabled} className={disabled ? "opacity-40" : ""}>{pending ? pendingLabel : label}</Button>
    </form>
  );
}
