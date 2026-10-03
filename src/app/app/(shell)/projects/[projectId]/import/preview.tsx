// The preview of the latest upload (stories/E3-2, acceptance 2 and 3): the summary line from
// the board ("expense-requirements.xlsx, 6 rows read, header found on row 1."), a sheet picker
// when the workbook has several sheets, a header row picker (always available; opened by the
// message when no row was found), then the first ten data rows under the column letters and
// names. A pasted list (stories/E3-4) has no pickers and its own summary line. Server
// component; the pickers are pickers.tsx.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Upload } from "@/db/queries/uploads";
import { PREVIEW_ROWS } from "@/lib/import/limits";
import { UPLOAD_COPY } from "@/lib/import/copy";
import { PASTE_COPY } from "@/lib/import/paste";
import { Pickers } from "./pickers";

export function UploadPreview({ upload }: { upload: Upload }) {
  const { preview } = upload;
  const rowOptions = Array.from({ length: Math.min(20, preview.rowsRead + (preview.headerRow ?? 0)) }, (_, i) => i + 1);
  return (
    <section className="flex flex-col gap-3 card p-4" aria-labelledby="preview-title">
      <div className="flex flex-col gap-1">
        <h3 id="preview-title" className="font-semibold">Preview</h3>
        <p data-testid="upload-summary" className="text-[13px] text-ink-muted">{upload.kind === "pasted" ? PASTE_COPY.summary(preview.rowsRead) : UPLOAD_COPY.summary(upload.filename, preview.rowsRead, preview.headerRow)}</p>
      </div>
      {upload.kind !== "pasted" && preview.headerRow === null && <p id="preview-error" role="alert" className="text-sm text-danger">{UPLOAD_COPY.noHeader}</p>}
      {upload.kind !== "pasted" && <Pickers projectId={upload.projectId} uploadId={upload.id} sheets={preview.sheets} sheet={preview.sheet} headerRow={preview.headerRow} rowOptions={rowOptions} />}
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
