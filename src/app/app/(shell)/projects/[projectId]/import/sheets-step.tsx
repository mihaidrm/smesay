"use client";
// The Sheets step (stories/E3-7, acceptance 1 and 2; design note 111): every sheet with rows,
// its row count and a checkbox, the ticked set from the upload row (the first sheet with rows
// before the PM confirms), and "Use these sheets" on sheetsAction with a loading state. The
// error of the last press (no sheet ticked, the rows over the limit) sits under the button.
// useActionState: react.dev/reference/react/useActionState.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { UPLOAD_COPY } from "@/lib/import/copy";
import { sheetsAction, type ProjectFormState } from "../../actions";

export function SheetsStep({ uploadId, sheets, ticked, confirmed }: { uploadId: string; sheets: { name: string; rows: number }[]; ticked: string[]; confirmed: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(sheetsAction, { error: null, saved: false });
  return (
    <form action={action} className="flex flex-col gap-2" data-testid="sheets-step" aria-labelledby="sheets-title">
      <input type="hidden" name="uploadId" value={uploadId} />
      <h4 id="sheets-title" className="text-[13px] font-semibold">{UPLOAD_COPY.sheetsTitle}</h4>
      <ul className="flex flex-col gap-1.5">
        {sheets.map((sheet, i) => {
          const id = `sheet-${i}`;
          return (
            <li key={sheet.name} className="flex items-center gap-2">
              <input id={id} type="checkbox" name="sheet" value={sheet.name} defaultChecked={ticked.includes(sheet.name)} disabled={pending} className="size-4 accent-[var(--violet)] outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" />
              <label htmlFor={id} className="text-sm">{sheet.name} <span className="text-ink-muted">({UPLOAD_COPY.sheetCount(sheet.rows)})</span></label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={confirmed ? "secondary" : "primary"} loading={pending}>{UPLOAD_COPY.sheetsButton}</Button>
        {state.error && <p id="sheets-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      </div>
    </form>
  );
}
