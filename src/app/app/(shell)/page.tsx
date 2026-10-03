// Projects (stories/E3-1, acceptance 1 and 4; stories/E2-3, acceptance 2; the PM app board,
// design v2): the title, three stat tiles (the projects of your own on the list, then the
// responses and AI runs this month from the usage counts, stories/E2-6), then the
// table card of name with its tile, items, responses ("5 of 7"), status, updated; New
// project; the sample's pill and Delete sample (stories/E8-8, acceptance 3); archived
// projects behind "Show archived". Copy: docs/copy/app.md, errors.md. Status:
// src/lib/project-status.ts.
import Link from "next/link";
import { ProjectTile, StatTile } from "@/components/app/tiles";
import { EmptyState } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { projects } from "@/db/queries";
import { usage } from "@/db/queries/usage";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { projectStatus, type ProjectStatus } from "@/lib/project-status";
import { DeleteSample } from "./delete-sample";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Status({ status }: { status: ProjectStatus }) {
  if (status === "Open") return <StatusPill status="agree" data-testid="project-status">Open</StatusPill>;
  return <NeutralPill data-testid="project-status">{status}</NeutralPill>;
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { current } = await requireCurrentWorkspace("/app");
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const [rows, used] = await Promise.all([projects.summaries(current.ws, { archived: showArchived }), usage(current.ws)]);
  // The empty state is for a workspace with no project of its own at all, archived ones included.
  const own = showArchived ? rows : (await projects.list(current.ws)).filter((r) => !r.isSample);
  const ownOnList = rows.filter((p) => !p.isSample).length;
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-[13px] text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
          <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{showArchived ? "Archived projects" : "Projects"}</h1>
          <p className="text-ink-muted">One project per validation.</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link href={showArchived ? "/app" : "/app?archived=1"} className={buttonVariants({ variant: "secondary" })}>{showArchived ? "Back to projects" : "Show archived"}</Link>
          {!showArchived && <Link href="/app/projects/new" className={buttonVariants()}>New project</Link>}
        </div>
      </div>
      {!showArchived && (
        <div className="flex gap-3.5">
          <StatTile value={ownOnList} label={ownOnList === 1 ? "project of your own" : "projects of your own"} tone="violet" />
          <StatTile value={used.responsesThisMonth} label={used.responsesThisMonth === 1 ? "response this month" : "responses this month"} tone="mint" />
          <StatTile value={used.aiRunsThisMonth} label={used.aiRunsThisMonth === 1 ? "AI run this month" : "AI runs this month"} tone="sun" />
        </div>
      )}
      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-4 px-[18px] py-3 text-xs font-semibold text-ink-muted">
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
              <div key={p.id} data-testid="project-row" className="flex min-h-[52px] items-center gap-4 border-t border-hairline px-[18px] py-2 transition-colors duration-150 hover:bg-tint">
                <div className="flex flex-grow items-center gap-2.5">
                  <ProjectTile name={p.name} sample={p.isSample} />
                  <Link href={`/app/projects/${p.id}/import`} className="font-semibold">{p.name}</Link>
                  {p.isSample && <NeutralPill className="h-[18px] text-[11px]">Sample</NeutralPill>}
                </div>
                <div className="w-[80px] font-mono text-sm">{p.items}</div>
                <div className="w-[110px] font-mono text-sm">{p.submitted} of {p.invites}</div>
                <div className="w-[110px]"><Status status={status} /></div>
                <div className="w-[200px] text-[13px] text-ink-muted">{p.isSample ? "Created with the workspace" : DATE.format(p.updatedAt)}</div>
                <div className="flex min-w-[130px] justify-end gap-2">
                  {p.isSample ? (
                    <DeleteSample projectId={p.id} />
                  ) : (
                    <Link href={`/app/projects/${p.id}/import`} className={buttonVariants({ variant: "secondary", size: "small" })}>Open</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!showArchived && own.length === 0 && (
        <EmptyState title="No projects yet" mascot>
          <span className="flex flex-col items-center gap-3">
            <span>Start one and import your list.</span>
            <Link href="/app/projects/new" className={buttonVariants()}>New project</Link>
          </span>
        </EmptyState>
      )}
      {showArchived && rows.length === 0 && <EmptyState title="No archived projects">Archived projects appear here.</EmptyState>}
    </main>
  );
}
