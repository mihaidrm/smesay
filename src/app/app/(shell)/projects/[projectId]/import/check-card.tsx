// The check before import (stories/E3-5, acceptance 1; PM app board, Import: "Check before
// import" with three counts): empty rows, exact duplicates, items over 1,000 characters, and
// the proposed values not recognised (E3-3), each count opening the rows concerned; then the
// "Import [N] items" button (E3-3, acceptance 1: disabled at 40 percent without a text
// column). Server component; the button is a form on commitAction with its pending state in
// import-button.tsx. An upload already imported shows its version instead of the button.
// The three counts sit side by side only when the card is 48rem wide or more (a container
// query: tailwindcss.com/docs/responsive-design#container-queries), so beside the preview
// panel they stack (decision 0021, item 5). With several sheets ticked (stories/E3-7,
// acceptance 6) the counts come once per sheet under "Sheet [NAME]", the rows named as in
// that sheet, and a duplicate of a row on another sheet says which.
import { IMPORT_COPY } from "@/lib/imports";
import type { CheckResult, SheetCheck } from "@/lib/import/report";
import { ImportButton } from "./import-button";

function Rows({ label, rows }: { label: string; rows: string[] }) {
  if (rows.length === 0) return <div className="px-4 py-3 text-sm">{label}</div>;
  return (
    <details className="px-4 py-3 text-sm">
      <summary className="cursor-pointer">{label}</summary>
      <ul className="mt-2 flex flex-col gap-1 text-[13px] text-ink-muted">{rows.map((r, i) => <li key={i}>{r}</li>)}</ul>
    </details>
  );
}

type CountsInput = Pick<SheetCheck, "emptyRows" | "longRows" | "unrecognisedRows"> & {
  name: string | null;
  report: Parameters<typeof IMPORT_COPY.counts>[0];
  duplicateRows: { row: number; keptRow: number; keptSheet?: string }[];
};

function Counts({ check }: { check: CountsInput }) {
  const counts = IMPORT_COPY.counts(check.report);
  return (
    <>
      <div className="grid grid-cols-1 divide-y divide-hairline @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0">
        <Rows label={counts.empty} rows={check.emptyRows.map((r) => `Row ${r}`)} />
        <Rows label={counts.duplicates} rows={check.duplicateRows.map((d) => IMPORT_COPY.sameAs(d.row, d.keptRow, d.keptSheet && d.keptSheet !== check.name ? d.keptSheet : null))} />
        <Rows label={counts.long} rows={check.longRows.map((r) => `Row ${r}`)} />
      </div>
      {check.report.unrecognisedValues > 0 && (
        <div className="border-t border-hairline"><Rows label={counts.values} rows={check.unrecognisedRows.map((u) => `Row ${u.row}: ${u.value}`)} /></div>
      )}
    </>
  );
}

export function CheckCard({ uploadId, check, importedVersion, blocked }: { uploadId: string; check: CheckResult | null; importedVersion: number | null; blocked: string | null }) {
  const n = check?.items.length ?? 0;
  return (
    <section className="@container flex flex-col card" aria-labelledby="check-title" data-testid="check-card">
      <div className="border-b border-hairline px-4 py-3"><h3 id="check-title" className="font-semibold">Check before import</h3></div>
      {check && check.sheets ? (
        check.sheets.map((sheet) => (
          <div key={sheet.name} className="flex flex-col border-b border-hairline" data-testid="check-sheet">
            <div className="px-4 pt-3 text-[13px] font-semibold">{IMPORT_COPY.sheetHeading(sheet.name)}</div>
            <Counts check={sheet} />
          </div>
        ))
      ) : check ? (
        <Counts check={{ ...check, name: null }} />
      ) : (
        <div className="px-4 py-3 text-sm text-ink-muted">{blocked ?? IMPORT_COPY.noCheck}</div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-hairline px-4 py-3">
        {importedVersion !== null ? (
          <span data-testid="imported-version" className="text-[13px] text-ink-muted">Imported as version {importedVersion}.</span>
        ) : (
          <ImportButton uploadId={uploadId} label={IMPORT_COPY.button(n)} disabled={!check || n === 0} />
        )}
      </div>
    </section>
  );
}
