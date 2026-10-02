// A version of the list, read-only (stories/E3-6, acceptance 2): the set's line and its items
// in position order, the references of folded duplicates beside the kept item's reference. A
// set outside the workspace or the project is 404.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { items, itemSets, projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function VersionPage({ params }: { params: Promise<{ projectId: string; setId: string }> }) {
  const { projectId, setId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/import/versions/${setId}`);
  const project = await projects.get(current.ws, projectId);
  const set = await itemSets.get(current.ws, setId);
  if (!project || !set || set.projectId !== project.id) notFound();
  const rows = (await items.list(current.ws)).filter((i) => i.itemSetId === set.id).sort((a, b) => a.position - b.position);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-normal">Version {set.version}</h2>
        <p className="text-ink-muted">{set.source === "pasted" ? "Pasted list" : set.sourceFilename}, imported {DATE.format(set.importedAt)}, {rows.length.toLocaleString("en-GB")} {rows.length === 1 ? "item" : "items"}. Read-only. <Link href={`/app/projects/${project.id}/import`} className="underline underline-offset-4">Back to Import</Link></p>
      </div>
      <Table data-testid="version-items">
        <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Ref</TableHead><TableHead>Item</TableHead><TableHead>Area</TableHead><TableHead>Proposed value</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((i) => (
            <TableRow key={i.id}><TableCell className="font-mono text-sm">{i.position}</TableCell><TableCell className="font-mono text-sm">{i.sourceRef ?? ""}{i.flags?.foldedRefs?.length ? <span className="text-ink-muted"> (also {i.flags.foldedRefs.join(", ")})</span> : null}</TableCell><TableCell>{i.originalText}</TableCell><TableCell>{i.area ?? ""}</TableCell><TableCell>{i.proposedValue ?? ""}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
