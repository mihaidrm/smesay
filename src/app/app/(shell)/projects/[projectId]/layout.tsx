// The project frame (stories/E3-1, acceptance 2 and 4): breadcrumb, title, Archive or
// Unarchive, the stepper, then the step page. A project id outside the workspace is 404
// through projects.get(ws, id). Steps without a page yet are not links. Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import { Stepper, type StepKey } from "@/components/app/stepper";
import { Button } from "@/components/ui/button";
import { NeutralPill } from "@/components/ui/status-pill";
import { projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { latestSet } from "@/lib/imports";
import { archiveAction } from "../actions";

const BUILT: StepKey[] = ["import", "shape"];

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/import`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const archived = project.archivedAt !== null;
  // Import is done once the project has a set (stories/E3-5, acceptance 5); Shape is the
  // current step from then on (E4-2; Shape can be left at any time, E4-3), until E5 builds
  // the Build page.
  const imported = project.isSample || (await latestSet(current.ws, project.id)) !== null;
  return (
    <main className="flex flex-col gap-5 px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}{project.isSample ? " · sample project" : ""}</div>
          <h1 className="flex items-center gap-2 text-xl font-medium">{project.name}{archived && <NeutralPill>Archived</NeutralPill>}</h1>
        </div>
        <Stepper current={imported ? "shape" : "import"} done={imported ? ["import"] : []} href={(step) => (BUILT.includes(step) ? `/app/projects/${project.id}/${step}` : null)} />
        {!project.isSample && (
          <form action={archiveAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value={archived ? "0" : "1"} />
            <Button type="submit" variant="secondary" size="small">{archived ? "Unarchive" : "Archive project"}</Button>
          </form>
        )}
      </div>
      {children}
    </main>
  );
}
