"use client";
// Delete sample on the project list (stories/E8-8, acceptance 3, built with E3-1): the first
// press shows the confirm line from docs/copy/errors.md and the real button; Cancel puts the
// row back. The action itself is deleteSampleAction.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { deleteSampleAction } from "./projects/actions";

export function DeleteSample({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <Button type="button" variant="secondary" size="small" onClick={() => setConfirming(true)}>Delete sample</Button>;
  return (
    <form action={deleteSampleAction} className="flex items-center gap-3" data-testid="delete-sample-confirm">
      <input type="hidden" name="projectId" value={projectId} />
      <span className="text-[13px] text-ink-muted">{PROJECTS_COPY.deleteSampleConfirm}</span>
      <Button type="button" variant="secondary" size="small" onClick={() => setConfirming(false)}>Cancel</Button>
      <Button type="submit" size="small">Delete sample</Button>
    </form>
  );
}
