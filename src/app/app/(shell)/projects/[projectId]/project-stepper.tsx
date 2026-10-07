"use client";
// The stepper of the project frame, placed by the layout (stories/E3-1, acceptance 2). The
// current pill is the furthest step the project's data has reached (Import until a set
// exists, then Shape, then Build once a draft exists, E3-5 acceptance 5 and E5-1), or the
// step whose page is open when that is further and the project has a set: Build creates
// its draft while the page renders (E5-1, acceptance 1), so the layout's data is one step
// behind on that first open. useSelectedLayoutSegment reads the open step one level under
// the layout (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// use-selected-layout-segment.md: "the active route segment one level below the Layout").
// A pill's click runs the unsaved changes guard first (stories/E5-9).
import { useSelectedLayoutSegment } from "next/navigation";
import { Stepper, STEPS, type StepKey } from "@/components/app/stepper";
import { useUnsavedGuard } from "@/components/app/unsaved";

const index = (step: StepKey) => STEPS.findIndex((s) => s.key === step);
const isStep = (value: string | null): value is StepKey => STEPS.some((s) => s.key === value);

export function ProjectStepper({ projectId, furthest, done, pages, imported }: { projectId: string; furthest: StepKey; done: StepKey[]; pages: StepKey[]; imported: boolean }) {
  const segment = useSelectedLayoutSegment();
  const viewed = isStep(segment) && pages.includes(segment) ? segment : null;
  const current = imported && viewed && index(viewed) > index(furthest) ? viewed : furthest;
  const guard = useUnsavedGuard();
  return <Stepper current={current} done={done} href={(step) => (pages.includes(step) ? `/app/projects/${projectId}/${step}` : null)} onClick={guard} />;
}
