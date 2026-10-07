"use client";
// The file form of Import a project (stories/E10-2, acceptance 2): one .json file, sent to
// importProjectAction; a refusal shows under the field (docs/copy/errors.md, Projects).
// useActionState: react.dev/reference/react/useActionState. The file input is the shared picker
// (src/components/app/file-picker.tsx, design note 103).
import { useActionState } from "react";
import { FilePicker } from "@/components/app/file-picker";
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
        <FilePicker id="project-file" name="file" accept="application/json,.json" required disabled={pending} aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "project-file-error" : undefined} />
        {state.error && <p id="project-file-error" role="alert" className="text-sm text-danger" data-testid="import-error">{state.error}</p>}
      </div>
      <Button type="submit" loading={pending} className="self-start" data-testid="import-project">{C.submit}</Button>
    </form>
  );
}
