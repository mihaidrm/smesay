// The import log (stories/E3-6, acceptance 2 and 4): every version of the project, newest
// first, with number, source, file, imported date, item count, the check counts and who
// imported; each number opens the version read-only (versions/[setId]). Under the table, the
// diff between the two latest versions as counts. Server component.
import Link from "next/link";
import type { ItemSetVersion } from "@/db/queries/itemSets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IMPORT_COPY } from "@/lib/imports";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SOURCE = { xlsx: "xlsx", csv: "csv", pasted: "pasted" } as const;

export function ImportLog({ projectId, versions, diffText }: { projectId: string; versions: ItemSetVersion[]; diffText: string | null }) {
  if (versions.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-md border border-hairline p-4" aria-labelledby="log-title" data-testid="import-log">
      <h3 id="log-title" className="font-medium">{IMPORT_COPY.logTitle}</h3>
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
                <TableCell className="text-[13px] text-ink-muted">{r ? `${r.emptyRows} empty, ${r.exactDuplicates} duplicates, ${r.overLimit} long, ${r.unrecognisedValues ?? 0} values` : ""}</TableCell>
                <TableCell>{v.importedByName ?? ""}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {diffText && versions.length >= 2 && <p data-testid="version-diff" className="text-[13px] text-ink-muted">{IMPORT_COPY.diff(diffText, versions[1].version, versions[0].version)}</p>}
    </section>
  );
}
