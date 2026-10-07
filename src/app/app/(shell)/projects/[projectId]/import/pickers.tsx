"use client";
// The header row picker (stories/E3-2, acceptance 2 and 3): a form on chooseAction with a
// loading button while the server re-reads the stored file, and the error of the last pick
// under it. With several sheets ticked (stories/E3-7, acceptance 3) each sheet has its own
// picker: the form then names the sheet and the control ids carry the sheet's index, so the
// labels stay unique on the page. The sheet dropdown of E3-2 is replaced by the Sheets step
// (sheets-step.tsx). useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { chooseAction, type ProjectFormState } from "../../actions";

const select = "h-9 rounded-md border border-hairline-strong bg-surface px-2 text-sm";
const NONE: ProjectFormState = { error: null, saved: false };

export function Pickers({ projectId, uploadId, headerRow, rowOptions, sheet, index }: { projectId: string; uploadId: string; headerRow: number | null; rowOptions: number[]; sheet?: string; index?: number }) {
  const [rowState, rowAction, rowPending] = useActionState<ProjectFormState, FormData>(chooseAction, NONE);
  const id = index === undefined ? "pick-row" : `pick-row-${index}`;
  return (
    <div className="flex flex-col gap-2">
      <form action={rowAction} className="flex items-end gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="uploadId" value={uploadId} />
        {sheet !== undefined && <input type="hidden" name="sheet" value={sheet} />}
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} className="text-[13px]">Header row</Label>
          <select id={id} name="headerRow" defaultValue={headerRow ?? 0} className={select}>
            <option value={0}>No header row</option>
            {rowOptions.map((r) => <option key={r} value={r}>Row {r}</option>)}
          </select>
        </div>
        <Button type="submit" variant="secondary" loading={rowPending}>Use this row</Button>
      </form>
      {rowState.error && <p id={index === undefined ? "pick-error" : `pick-error-${index}`} role="alert" className="text-sm text-danger">{rowState.error}</p>}
    </div>
  );
}
