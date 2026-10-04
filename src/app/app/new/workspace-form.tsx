"use client";
// The one-field form of the workspace step (stories/E2-3, acceptance 1). useActionState wires
// the server action and its error (react.dev/reference/react/useActionState); the server is
// the validator, the field only carries the message back. Components: docs/design-system.md.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WORKSPACE_NAME_MAX } from "@/lib/workspace-name";
import { createWorkspace, type CreateWorkspaceState } from "../actions";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState<CreateWorkspaceState, FormData>(createWorkspace, { error: null });
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input id="name" name="name" maxLength={WORKSPACE_NAME_MAX} autoComplete="organization"
          aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "name-error" : undefined} className="h-10" />
        {state.error && <p id="name-error" className="text-sm text-danger">{state.error}</p>}
      </div>
      <Button type="submit" loading={pending} className="self-start">Create workspace</Button>
    </form>
  );
}
