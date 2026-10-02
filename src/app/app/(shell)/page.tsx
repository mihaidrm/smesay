// Projects (stories/E3-1, acceptance 1 and 4; stories/E2-3, acceptance 2; the PM app board,
// Projects): the table of name, items, responses ("5 of 7"), status, updated; New project;
// the sample's pill and Delete sample (stories/E8-8, acceptance 3); archived projects behind
// "Show archived". Copy: docs/copy/app.md, errors.md. Status: src/lib/project-status.ts.
import Link from "next/link";
import { EmptyState } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { projectStatus, type ProjectStatus } from "@/lib/project-status";
import { deleteSampleAction } from "./projects/actions";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Status({ status }: { status: ProjectStatus }) {
  if (status === "Open") return <StatusPill status="agree" data-testid="project-status">Open</StatusPill>;
  return <NeutralPill data-testid="project-status">{status}</NeutralPill>;
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { current } = await requireCurrentWorkspace("/app");
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const rows = await projects.summaries(current.ws, { archived: showArchived });
  const own = rows.filter((r) => !r.isSample);
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
          <h1 className="text-2xl font-normal">{showArchived ? "Archived projects" : "Projects"}</h1>
          <p className="text-ink-muted">One project per validation.</p>
        </div>
        {!showArchived && <Link href="/app/projects/new" className="inline-flex h-10 shrink-0 items-center rounded-full border border-ink bg-ink px-5 text-sm font-medium text-white">New project</Link>}
      </div>
      {rows.length > 0 && (
        <div className="rounded-md border border-hairline">
          <div className="flex h-8 items-center gap-4 rounded-t-md border-b border-hairline bg-grey-50 px-4 text-xs text-ink-muted">
            <div className="flex-grow">Project</div>
            <div className="w-[80px]">Items</div>
            <div className="w-[110px]">Responses</div>
            <div className="w-[110px]">Status</div>
            <div className="w-[200px]">Updated</div>
            <div className="w-[130px]"></div>
          </div>
          {rows.map((p) => {
            const status = projectStatus(p, p.links);
            return (
              <div key={p.id} data-testid="project-row" className="flex min-h-9 items-center gap-4 border-b border-grey-100 px-4 py-2 last:border-b-0">
                <div className="flex flex-grow items-center gap-2">
                  <Link href={`/app/projects/${p.id}/import`} className="font-medium">{p.name}</Link>
                  {p.isSample && <NeutralPill className="h-[18px] text-[11px]">Sample</NeutralPill>}
                </div>
                <div className="w-[80px] font-mono text-sm">{p.items}</div>
                <div className="w-[110px] font-mono text-sm">{p.submitted} of {p.invites}</div>
                <div className="w-[110px]"><Status status={status} /></div>
                <div className="w-[200px] text-ink-muted">{p.isSample ? "Created with the workspace" : DATE.format(p.archivedAt ?? p.createdAt)}</div>
                <div className="flex w-[130px] justify-end gap-2">
                  {p.isSample ? (
                    <form action={deleteSampleAction}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <Button type="submit" variant="secondary" size="small">Delete sample</Button>
                    </form>
                  ) : (
                    <Link href={`/app/projects/${p.id}/import`} className="inline-flex h-8 items-center rounded-full border border-hairline-strong bg-white px-3.5 text-[13px] font-medium">Open</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!showArchived && own.length === 0 && (
        <EmptyState title="No projects yet">
          <span className="flex flex-col items-center gap-3">
            <span>Start one and import your list.</span>
            <Link href="/app/projects/new" className="inline-flex h-10 items-center rounded-full border border-ink bg-ink px-5 text-sm font-medium text-white">New project</Link>
          </span>
        </EmptyState>
      )}
      {showArchived && rows.length === 0 && <EmptyState title="No archived projects">Archived projects appear here.</EmptyState>}
      <div className="text-[13px] text-ink-muted">
        {showArchived ? <Link href="/app" className="text-teal-700">Back to projects</Link> : <Link href="/app?archived=1" className="text-teal-700">Show archived</Link>}
      </div>
    </main>
  );
}
