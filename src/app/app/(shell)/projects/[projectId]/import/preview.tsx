// The preview of the latest upload (stories/E3-2, acceptance 2 and 3): the summary line from
// the board ("We read 6 rows from expense-requirements.xlsx and found the header on row 1."), a
// header row picker (always available; opened by the message when no row was found), then the
// first ten data rows under the column letters and names. A pasted list (stories/E3-4) has no
// pickers and its own summary line. A workbook with several sheets that have rows (stories/E3-7)
// opens with the Sheets step (sheets-step.tsx) and shows nothing else until the PM confirms;
// with several ticked, each sheet has its line, its picker and its ten rows. Server component;
// the pickers are pickers.tsx.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Upload } from "@/db/queries/uploads";
import type { SheetPreview } from "@/db/types";
import { PREVIEW_ROWS } from "@/lib/import/limits";
import { UPLOAD_COPY } from "@/lib/import/copy";
import { PASTE_COPY } from "@/lib/import/paste";
import { needsSheetStep, tickedNames } from "@/lib/import/sheets";
import { Pickers } from "./pickers";
import { SheetsStep } from "./sheets-step";

function rowOptionsFor(sheet: { rowsRead: number; headerRow: number | null }): number[] {
  return Array.from({ length: Math.min(20, sheet.rowsRead + (sheet.headerRow ?? 0)) }, (_, i) => i + 1);
}

function SheetTable({ sheet }: { sheet: { columns: { letter: string; name: string }[]; rows: string[][]; rowsRead: number } }) {
  if (sheet.rows.length === 0) return <p className="text-sm text-ink-muted">{UPLOAD_COPY.sheetNoRows}</p>;
  return (
    <div className="overflow-x-auto">
      <Table data-testid="preview-table">
        <TableHeader>
          <TableRow>
            {sheet.columns.map((c) => (
              <TableHead key={c.letter} className="whitespace-nowrap"><span className="text-ink-muted">{c.letter}</span>{c.name && <span className="ml-2">{c.name}</span>}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheet.rows.map((row, i) => (
            <TableRow key={i} data-testid="preview-row">
              {row.map((cell, j) => <TableCell key={j} className="max-w-[420px] truncate" title={cell}>{cell}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sheet.rowsRead > PREVIEW_ROWS && <p className="mt-2 text-[13px] text-ink-muted">The first {PREVIEW_ROWS} of {sheet.rowsRead.toLocaleString("en-GB")} rows.</p>}
    </div>
  );
}

export function UploadPreview({ upload }: { upload: Upload }) {
  const { preview } = upload;
  const step = needsSheetStep(upload);
  const waiting = step && upload.sheets === null;
  const several: SheetPreview[] | null = preview.perSheet && preview.perSheet.length > 1 ? preview.perSheet : null;
  const summary = upload.kind === "pasted" ? PASTE_COPY.summary(preview.rowsRead)
    : waiting ? UPLOAD_COPY.sheetsLine
    : several ? UPLOAD_COPY.summarySheets(upload.filename, preview.rowsRead, several.length)
    : UPLOAD_COPY.summary(upload.filename, preview.rowsRead, preview.headerRow);
  return (
    <section className="flex flex-col gap-3 card p-4" aria-labelledby="preview-title">
      <div className="flex flex-col gap-1">
        <h3 id="preview-title" className="font-semibold">Preview</h3>
        <p data-testid="upload-summary" className="text-[13px] text-ink-muted">{summary}</p>
      </div>
      {step && <SheetsStep uploadId={upload.id} sheets={preview.sheetRows ?? []} ticked={tickedNames(upload)} confirmed={!waiting} />}
      {waiting ? null : several ? (
        several.map((sheet, i) => (
          <div key={sheet.name} className="flex flex-col gap-3 border-t border-hairline pt-3" data-testid="sheet-block">
            <p data-testid="sheet-line" className="text-sm font-medium">{UPLOAD_COPY.sheetLine(sheet.name, sheet.rowsRead, sheet.headerRow)}</p>
            {sheet.headerRow === null && <p id={`preview-error-${i}`} role="alert" className="text-sm text-danger">{UPLOAD_COPY.noHeader}</p>}
            <Pickers projectId={upload.projectId} uploadId={upload.id} headerRow={sheet.headerRow} rowOptions={rowOptionsFor(sheet)} sheet={sheet.name} index={i} />
            <SheetTable sheet={sheet} />
          </div>
        ))
      ) : (
        <>
          {upload.kind !== "pasted" && preview.headerRow === null && <p id="preview-error" role="alert" className="text-sm text-danger">{UPLOAD_COPY.noHeader}</p>}
          {upload.kind !== "pasted" && <Pickers projectId={upload.projectId} uploadId={upload.id} headerRow={preview.headerRow} rowOptions={rowOptionsFor(preview)} />}
          <SheetTable sheet={preview} />
        </>
      )}
    </section>
  );
}
