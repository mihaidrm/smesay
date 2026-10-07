// The project frame (stories/E3-1, acceptance 2 and 4): breadcrumb, title, Archive or
// Unarchive, the stepper (project-stepper.tsx), pinned to the top of the viewport while the
// step page scrolls, then the step page. The sample (stories/E8-8) has Delete sample in
// Archive's place and the watermark band (SampleBand) in the pinned header on every step, so
// it stays in view while the page scrolls, never dismissed. A project id outside the workspace
// is 404 through projects.get(ws, id). Steps without a page yet are not links. The unsaved
// changes banner (stories/E5-9) sits in the pinned header too, under the title row, so it is
// in view wherever the page is scrolled. Copy: docs/copy/app.md.
import { notFound } from "next/navigation";
import type { StepKey } from "@/components/app/stepper";
import { Button } from "@/components/ui/button";
import { NeutralPill } from "@/components/ui/status-pill";
import { instruments, invites, projects } from "@/db/queries";
import { aiMode, devMenuOn } from "@/lib/ai/mode";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { DEV_MENU_COPY } from "@/lib/dev-menu-copy";
import { latestSet } from "@/lib/imports";
import { SampleBand } from "@/components/app/sample-band";
import { UnsavedBanner } from "@/components/app/unsaved";
import { DeleteSample } from "../../delete-sample";
import { archiveAction } from "../actions";
import { ProjectStepper } from "./project-stepper";

const BUILT: StepKey[] = ["import", "shape", "build", "share", "results"];

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // After sign-in, the project's address: Results for the sample, Import otherwise
  // ([projectId]/page.tsx).
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const archived = project.archivedAt !== null;
  // Import is done once the project has a set (stories/E3-5, acceptance 5); Shape is the
  // current step from then on (E4-2; Shape can be left at any time, E4-3); Build once an
  // instrument draft exists (E5-1; the sample always has one); Results once the instrument
  // is published (a public link exists, E6-1; E8-1), Share done then.
  const imported = project.isSample || (await latestSet(current.ws, project.id)) !== null;
  const instrument = imported ? await instruments.latestForProject(current.ws, project.id) : null;
  const built = instrument !== null;
  const published = built && (await invites.livePublic(current.ws, project.id)) !== null;
  const furthest: StepKey = published ? "results" : built ? "build" : imported ? "shape" : "import";
  const done: StepKey[] = published ? ["import", "shape", "build", "share"] : built ? ["import", "shape"] : imported ? ["import"] : [];
  // The AI mode pill (stories/E4-8, acceptance 1): beside the stepper when the developer
  // menu's choice is not the real model, so the stand-in's output is never taken for the AI's.
  const mode = devMenuOn() ? await aiMode() : "real";
  return (
    <main className="flex flex-col gap-5 px-8 pb-6">
      {/* The project header with the stepper stays at the top of the viewport while the step
          page scrolls (Mihai, 2026-10-03), on the ground so the page slides under it. */}
      <div className="sticky top-0 z-20 -mx-8 flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-ground px-8 py-4" data-testid="project-header">
        <div className="flex flex-col gap-1">
          <div className="text-[13px] text-ink-muted" data-testid="breadcrumb">{current.workspace.name}{project.isSample ? " · sample project" : ""}</div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-[-0.03em]">{project.name}{archived && <NeutralPill>Archived</NeutralPill>}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ProjectStepper projectId={project.id} furthest={furthest} done={done} pages={BUILT} imported={imported} />
          {mode !== "real" && <NeutralPill data-testid="ai-mode-pill">{DEV_MENU_COPY.pill[mode]}</NeutralPill>}
        </div>
        {project.isSample ? <DeleteSample projectId={project.id} /> : (
          <form action={archiveAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="archived" value={archived ? "0" : "1"} />
            <Button type="submit" variant="secondary" size="small">{archived ? "Unarchive" : "Archive project"}</Button>
          </form>
        )}
        {project.isSample && <SampleBand className="basis-full" />}
        <UnsavedBanner className="basis-full" />
      </div>
      {children}
    </main>
  );
}
