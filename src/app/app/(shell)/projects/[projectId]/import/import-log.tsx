// The import log (stories/E3-6, acceptance 2 and 4): every version of the project, newest
// first, with number, source, file, imported date, item count, the check counts and who
// imported; each number opens the version read-only (versions/[setId]). Under the table, the
// diff between the two latest versions as counts. Server component. A collapsible card
// (design note 110) with the latest version as its summary; open once everything is
// imported, by the page's rule.
import Link from "next/link";
import type { ItemSetVersion } from "@/db/queries/itemSets";
import { CollapsibleCard } from "@/components/app/collapsible-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IMPORT_COPY } from "@/lib/imports";
import { IMPORT_CARD_COPY } from "@/lib/import-guide";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SOURCE = { xlsx: "xlsx", csv: "csv", pasted: "pasted" } as const;

export function ImportLog({ projectId, versions, diffText, open }: { projectId: string; versions: ItemSetVersion[]; diffText: string | null; open: boolean }) {
  if (versions.length === 0) return null;
  return (
    <CollapsibleCard title={IMPORT_CARD_COPY.versions.title} titleId="log-title" summary={IMPORT_CARD_COPY.versions.summary(versions[0].version, versions[0].items)} open={open} testId="import-log">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead><TableHead>Source</TableHead><TableHead>File</TableHead><TableHead>Imported</TableHead><TableHead>Items</TableHead><TableHead>Checks</TableHead><TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => {
            const r = v.importReport;
            return (
              <TableRow key={v.id} data-testid="version-row">
                <TableCell><Link href={`/app/projects/${projectId}/import/versions/${v.id}`} className="font-medium underline underline-offset-4">Version {v.version}</Link></TableCell>
                <TableCell>{SOURCE[v.source]}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={v.sourceFilename ?? ""}>{v.sourceFilename ?? (v.source === "pasted" ? "Pasted list" : "")}</TableCell>
                <TableCell className="whitespace-nowrap">{DATE.format(v.importedAt)}</TableCell>
                <TableCell className="font-mono text-sm">{v.items}</TableCell>
                <TableCell className="text-[13px] text-ink-muted">{r ? `${r.emptyRows} empty, ${r.exactDuplicates} ${r.exactDuplicates === 1 ? "duplicate" : "duplicates"}, ${r.overLimit} long, ${r.unrecognisedValues ?? 0} ${(r.unrecognisedValues ?? 0) === 1 ? "value" : "values"}` : ""}</TableCell>
                <TableCell>{v.importedByName ?? ""}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {diffText && versions.length >= 2 && <p data-testid="version-diff" className="text-[13px] text-ink-muted">{IMPORT_COPY.diff(diffText, versions[1].version, versions[0].version)}</p>}
    </CollapsibleCard>
  );
}
