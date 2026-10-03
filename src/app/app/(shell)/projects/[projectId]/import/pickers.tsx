"use client";
// The sheet and header row pickers (stories/E3-2, acceptance 2 and 3): each is a form on
// chooseAction with a loading button while the server re-reads the stored file, and the
// error of the last pick (a sheet over the row limit) under them. useActionState:
// react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { chooseAction, type ProjectFormState } from "../../actions";

const select = "h-9 rounded-md border border-hairline-strong bg-surface px-2 text-sm";
const NONE: ProjectFormState = { error: null, saved: false };

export function Pickers({ projectId, uploadId, sheets, sheet, headerRow, rowOptions }: { projectId: string; uploadId: string; sheets: string[]; sheet: string | null; headerRow: number | null; rowOptions: number[] }) {
  const [sheetState, sheetAction, sheetPending] = useActionState<ProjectFormState, FormData>(chooseAction, NONE);
  const [rowState, rowAction, rowPending] = useActionState<ProjectFormState, FormData>(chooseAction, NONE);
  const error = sheetState.error ?? rowState.error;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-4">
        {sheets.length > 1 && (
          <form action={sheetAction} className="flex items-end gap-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="uploadId" value={uploadId} />
            <div className="flex flex-col gap-1">
              <Label htmlFor="pick-sheet" className="text-[13px]">Sheet</Label>
              <select id="pick-sheet" name="sheet" defaultValue={sheet ?? ""} className={select}>
                {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Button type="submit" variant="secondary" loading={sheetPending}>Show sheet</Button>
          </form>
        )}
        <form action={rowAction} className="flex items-end gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="uploadId" value={uploadId} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="pick-row" className="text-[13px]">Header row</Label>
            <select id="pick-row" name="headerRow" defaultValue={headerRow ?? 0} className={select}>
              <option value={0}>No header row</option>
              {rowOptions.map((r) => <option key={r} value={r}>Row {r}</option>)}
            </select>
          </div>
          <Button type="submit" variant="secondary" loading={rowPending}>Use this row</Button>
        </form>
      </div>
      {error && <p id="pick-error" role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
