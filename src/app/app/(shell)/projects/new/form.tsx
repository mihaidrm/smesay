"use client";
// The name form of New project (stories/E3-1, acceptance 2). useActionState:
// react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction, type ProjectFormState } from "../actions";

export function NewProjectForm() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(createProjectAction, { error: null, saved: false });
  return (
    <form action={action} noValidate className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" name="name" maxLength={80} autoFocus className="h-10" aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "project-name-error" : undefined} />
        {state.error && <p id="project-name-error" className="text-sm text-danger">{state.error}</p>}
      </div>
      <Button type="submit" loading={pending} className="self-start">Create project</Button>
    </form>
  );
}
