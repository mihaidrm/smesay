// The check before import (stories/E3-5, acceptance 1; PM app board, Import: "Check before
// import" with three counts): empty rows, exact duplicates, items over 1,000 characters, and
// the proposed values not recognised (E3-3), each count opening the rows concerned; then the
// "Import [N] items" button (E3-3, acceptance 1: disabled at 40 percent without a text
// column). Server component; the button is a form on commitAction with its pending state in
// import-button.tsx. An upload already imported shows its version instead of the button.
// The three counts sit side by side only when the card is 48rem wide or more (a container
// query: tailwindcss.com/docs/responsive-design#container-queries), so beside the preview
// panel they stack (decision 0021, item 5). A collapsible card (design note 110): open once
// the mapping has a text column and until the import, by the page's rule; the summary is
// the item count ready, or the version imported.
import { CollapsibleCard } from "@/components/app/collapsible-card";
import { IMPORT_COPY } from "@/lib/imports";
import { IMPORT_CARD_COPY } from "@/lib/import-guide";
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

export function CheckCard({ uploadId, check, importedVersion, open }: { uploadId: string; check: CheckResult | null; importedVersion: number | null; open: boolean }) {
  const counts = check ? IMPORT_COPY.counts(check.report) : null;
  const n = check?.items.length ?? 0;
  return (
    <CollapsibleCard title={IMPORT_CARD_COPY.check.title} titleId="check-title" summary={IMPORT_CARD_COPY.check.summary(check ? n : null, importedVersion)} open={open} testId="check-card" className="@container" bodyClassName="flex flex-col border-t border-hairline">
      {check && counts ? (
        <div className="grid grid-cols-1 divide-y divide-hairline @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0">
          <Rows label={counts.empty} rows={check.emptyRows.map((r) => `Row ${r}`)} />
          <Rows label={counts.duplicates} rows={check.duplicateRows.map((d) => `Row ${d.row}, same as row ${d.keptRow}`)} />
          <Rows label={counts.long} rows={check.longRows.map((r) => `Row ${r}`)} />
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-ink-muted">{IMPORT_COPY.noCheck}</div>
      )}
      {check && counts && check.report.unrecognisedValues > 0 && (
        <div className="border-t border-hairline"><Rows label={counts.values} rows={check.unrecognisedRows.map((u) => `Row ${u.row}: ${u.value}`)} /></div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-hairline px-4 py-3">
        {importedVersion !== null ? (
          <span data-testid="imported-version" className="text-[13px] text-ink-muted">Imported as version {importedVersion}.</span>
        ) : (
          <ImportButton uploadId={uploadId} label={IMPORT_COPY.button(n)} disabled={!check || n === 0} />
        )}
      </div>
    </CollapsibleCard>
  );
}
