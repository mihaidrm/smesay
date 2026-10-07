"use client";
// The stepper of the project frame, placed by the layout (stories/E3-1, acceptance 2). The
// filled pill is the step whose page is open (Mihai, 2026-10-07, design note 106); when the
// open segment is not a step page the furthest step the project's data has reached stands
// in. The ticks follow the data, not the filled pill: every step before `furthest` (Import
// until a set exists, then Shape, then Build once a draft exists, E3-5 acceptance 5 and E5-1)
// and the layout's `done` list. One exception: Build creates its draft while the page renders
// (E5-1, acceptance 1), so the layout's data is one step behind on that first open, and
// Shape is ticked then too. useSelectedLayoutSegment reads the open step one level under the
// layout (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
// use-selected-layout-segment.md: "the active route segment one level below the Layout").
import { useSelectedLayoutSegment } from "next/navigation";
import { Stepper, STEPS, type StepKey } from "@/components/app/stepper";

const isStep = (value: string | null): value is StepKey => STEPS.some((s) => s.key === value);

export function ProjectStepper({ projectId, furthest, done, pages, imported }: { projectId: string; furthest: StepKey; done: StepKey[]; pages: StepKey[]; imported: boolean }) {
  const segment = useSelectedLayoutSegment();
  const viewed = isStep(segment) && pages.includes(segment) ? segment : null;
  const current = viewed ?? furthest;
  const reached = imported && viewed === "build" && furthest === "shape" ? "build" : furthest;
  return <Stepper current={current} reached={reached} done={done} href={(step) => (pages.includes(step) ? `/app/projects/${projectId}/${step}` : null)} />;
}
