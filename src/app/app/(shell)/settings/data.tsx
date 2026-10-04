"use client";
// Settings, Data (stories/E11-2, acceptance 1 and 2), owners only: Export everything, a download
// with its waiting and failed states (results/export-download.tsx), and Delete this workspace, a
// form that asks for the workspace's name; the server checks the role and the name
// (src/lib/workspace-data.ts) and opens the deleted page. useActionState:
// react.dev/reference/react/useActionState. Copy: src/lib/workspace-data-copy.ts.
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPORT_COPY } from "@/lib/export/copy";
import { WORKSPACE_DATA_COPY as C } from "@/lib/workspace-data-copy";
import { ExportDownload } from "../projects/[projectId]/results/export-download";
import { deleteWorkspaceAction, type DeleteState } from "./actions";

const INITIAL: DeleteState = { error: null };

export function DataSection({ workspaceName }: { workspaceName: string }) {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteWorkspaceAction, INITIAL);
  const [typed, setTyped] = useState("");
  return (
    <section className="card" aria-labelledby="data-title" data-testid="data-section">
      <h2 id="data-title" className="border-b border-hairline px-4 py-3 font-semibold">{C.heading}</h2>
      <div className="flex flex-col gap-2 border-b border-hairline px-4 py-4">
        <h3 className="text-[15px] font-bold">{C.exportTitle}</h3>
        <p className="text-sm text-ink-muted">{C.exportLine}</p>
        <ExportDownload href="/api/workspace/export" label={C.exportButton} srLabel={C.exportTitle} busyLabel={EXPORT_COPY.tab.downloading} failed={C.exportFailed} testId="export-everything" fallbackName="workspace.zip" />
      </div>
      <form action={action} className="flex flex-col gap-2 px-4 py-4">
        <h3 className="text-[15px] font-bold">{C.deleteTitle}</h3>
        <p className="text-sm text-ink-muted">{C.deleteLine}</p>
        <Label htmlFor="delete-name">{C.deleteField(workspaceName)}</Label>
        <Input id="delete-name" name="name" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="max-w-sm"
          aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "delete-error" : undefined} />
        {state.error && <p id="delete-error" role="alert" className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="destructive" loading={pending} disabled={typed.trim() !== workspaceName.trim()} className="self-start" data-testid="delete-workspace">{C.deleteButton}</Button>
      </form>
    </section>
  );
}
