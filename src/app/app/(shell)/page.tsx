// Projects (stories/E2-3, acceptance 2; the PM app board, Projects): the breadcrumb with the
// current workspace, the table of projects with the Sample pill, status and the updated line.
// E3-1 adds New project, the item and response counts and Open. Copy: docs/copy/app.md.
import { EmptyState } from "@/components/ui/banner";
import { projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ProjectsPage() {
  const { current } = await requireCurrentWorkspace("/app");
  const rows = await projects.list(current.ws);
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted">{current.workspace.name}</div>
        <h1 className="text-2xl font-normal">Projects</h1>
        <p className="text-ink-muted">One project per validation.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No projects yet">Your workspace has no projects.</EmptyState>
      ) : (
        <div className="rounded-md border border-hairline">
          <div className="flex gap-4 border-b border-hairline px-4 py-2 text-xs text-ink-muted">
            <div className="flex-grow">Project</div>
            <div className="w-[120px]">Status</div>
            <div className="w-[200px]">Updated</div>
          </div>
          {rows.map((p) => (
            <div key={p.id} data-testid="project-row" className="flex min-h-9 items-center gap-4 border-b border-grey-100 px-4 py-2 last:border-b-0">
              <div className="flex flex-grow items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {p.isSample && <span className="rounded-full bg-grey-100 px-2 text-[11px] font-medium leading-5 text-ink-soft">Sample</span>}
              </div>
              <div className="w-[120px]">
                <span className="rounded-full bg-grey-100 px-2 text-xs font-medium leading-5 text-ink-soft">{p.isSample ? "Sample" : "Draft"}</span>
              </div>
              <div className="w-[200px] text-ink-muted">{p.isSample ? "Created with the workspace" : DATE.format(p.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
