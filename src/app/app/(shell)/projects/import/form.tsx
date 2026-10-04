"use client";
// The file form of Import a project (stories/E10-2, acceptance 2): one .json file, sent to
// importProjectAction; a refusal shows under the field (docs/copy/errors.md, Projects).
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EXPORT_COPY } from "@/lib/export/copy";
import { importProjectAction, type ProjectFormState } from "../actions";

export function ImportProjectForm() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(importProjectAction, { error: null, saved: false });
  const C = EXPORT_COPY.importPage;
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-file">{C.field}</Label>
        <input id="project-file" name="file" type="file" accept="application/json,.json" required className="text-sm file:mr-3 file:rounded-full file:border file:border-hairline-strong file:bg-surface file:px-4 file:py-1.5 file:font-semibold" aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "project-file-error" : undefined} />
        {state.error && <p id="project-file-error" role="alert" className="text-sm text-danger" data-testid="import-error">{state.error}</p>}
      </div>
      <Button type="submit" loading={pending} className="self-start" data-testid="import-project">{C.submit}</Button>
    </form>
  );
}
