// The preview of the latest upload (stories/E3-2, acceptance 2 and 3): the summary line from
// the board ("expense-requirements.xlsx, 6 rows read, header found on row 1."), a sheet picker
// when the workbook has several sheets, a header row picker (always available; opened by the
// message when no row was found), then the first ten data rows under the column letters and
// names. Server component; the pickers are plain forms on chooseAction.
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Upload } from "@/db/queries/uploads";
import { PREVIEW_ROWS } from "@/lib/import/limits";
import { UPLOAD_COPY } from "@/lib/uploads";
import { chooseAction } from "../../actions";

const select = "h-9 rounded-md border border-hairline-strong bg-white px-2 text-sm";

export function UploadPreview({ upload }: { upload: Upload }) {
  const { preview } = upload;
  const rowOptions = Array.from({ length: Math.min(20, preview.rowsRead + (preview.headerRow ?? 0)) }, (_, i) => i + 1);
  return (
    <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="preview-title">
      <div className="flex flex-col gap-1">
        <h3 id="preview-title" className="font-medium">Preview</h3>
        <p data-testid="upload-summary" className="text-[13px] text-ink-muted">{UPLOAD_COPY.summary(upload.filename, preview.rowsRead, preview.headerRow)}</p>
      </div>
      {preview.headerRow === null && <p id="preview-error" role="alert" className="text-sm text-danger">{UPLOAD_COPY.noHeader}</p>}
      <div className="flex flex-wrap items-end gap-4">
        {preview.sheets.length > 1 && (
          <form action={chooseAction} className="flex items-end gap-2">
            <input type="hidden" name="projectId" value={upload.projectId} />
            <input type="hidden" name="uploadId" value={upload.id} />
            <div className="flex flex-col gap-1">
              <Label htmlFor="pick-sheet" className="text-[13px]">Sheet</Label>
              <select id="pick-sheet" name="sheet" defaultValue={preview.sheet ?? ""} className={select}>
                {preview.sheets.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Button type="submit" variant="secondary">Show sheet</Button>
          </form>
        )}
        <form action={chooseAction} className="flex items-end gap-2">
          <input type="hidden" name="projectId" value={upload.projectId} />
          <input type="hidden" name="uploadId" value={upload.id} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="pick-row" className="text-[13px]">Header row</Label>
            <select id="pick-row" name="headerRow" defaultValue={preview.headerRow ?? 0} className={select}>
              <option value={0}>No header row</option>
              {rowOptions.map((r) => <option key={r} value={r}>Row {r}</option>)}
            </select>
          </div>
          <Button type="submit" variant="secondary">Use this row</Button>
        </form>
      </div>
      {preview.rows.length === 0 ? (
        <p className="text-sm text-ink-muted">This sheet has no rows. Pick another sheet, or upload another file.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="preview-table">
            <TableHeader>
              <TableRow>
                {preview.columns.map((c) => (
                  <TableHead key={c.letter} className="whitespace-nowrap"><span className="text-ink-muted">{c.letter}</span>{c.name && <span className="ml-2">{c.name}</span>}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row, i) => (
                <TableRow key={i} data-testid="preview-row">
                  {row.map((cell, j) => <TableCell key={j} className="max-w-[420px] truncate" title={cell}>{cell}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {preview.rowsRead > PREVIEW_ROWS && <p className="mt-2 text-[13px] text-ink-muted">The first {PREVIEW_ROWS} of {preview.rowsRead.toLocaleString("en-GB")} rows.</p>}
        </div>
      )}
    </section>
  );
}
