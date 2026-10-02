// The check before import (stories/E3-5, acceptance 1; PM app board, Import: "Check before
// import" with three counts): empty rows, exact duplicates, items over 1,000 characters, and
// the proposed values not recognised (E3-3), each count opening the rows concerned; then the
// "Import [N] items" button (E3-3, acceptance 1: disabled at 40 percent without a text
// column). Server component; the button is a form on commitAction with its pending state in
// import-button.tsx. An upload already imported shows its version instead of the button.
import { IMPORT_COPY } from "@/lib/imports";
import type { CheckResult } from "@/lib/import/report";
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

export function CheckCard({ uploadId, check, importedVersion }: { uploadId: string; check: CheckResult | null; importedVersion: number | null }) {
  const counts = check ? IMPORT_COPY.counts(check.report) : null;
  const n = check?.items.length ?? 0;
  return (
    <section className="flex flex-col rounded-md border border-hairline" aria-labelledby="check-title" data-testid="check-card">
      <div className="border-b border-hairline px-4 py-3"><h3 id="check-title" className="font-medium">Check before import</h3></div>
      {check && counts ? (
        <div className="grid grid-cols-1 divide-y divide-grey-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Rows label={counts.empty} rows={check.emptyRows.map((r) => `Row ${r}`)} />
          <Rows label={counts.duplicates} rows={check.duplicateRows.map((d) => `Row ${d.row}, same as row ${d.keptRow}`)} />
          <Rows label={counts.long} rows={check.longRows.map((r) => `Row ${r}`)} />
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-ink-muted">{IMPORT_COPY.noCheck}</div>
      )}
      {check && counts && check.report.unrecognisedValues > 0 && (
        <div className="border-t border-grey-100"><Rows label={counts.values} rows={check.unrecognisedRows.map((u) => `Row ${u.row}: ${u.value}`)} /></div>
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
