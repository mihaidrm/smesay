// What the guide shows (stories/E15-1 and E15-2), pure so the unit tests read it. A tip shows
// when tips are on and the person has not dismissed it; the first-project path is ticked from
// the data (src/db/queries/guide.ts firstProjectFacts), never from a click.
import type { FirstProjectFacts } from "@/db/queries/guide";
import type { GuideState } from "@/db/types";
import type { TipId } from "@/lib/guide-lines";

export const tipVisible = (state: GuideState, id: TipId): boolean => !state.tipsOff && !state.dismissed.includes(id);

// The first-project path as a whole: hidden with tips off or once any of its lines was
// dismissed (its line changes with each step, so Dismiss on any ends it).
export const pathHidden = (state: GuideState): boolean => state.tipsOff || state.dismissed.some((d) => d.startsWith("path."));

export type PathStep = "import" | "shape" | "build" | "share";
export const PATH_STEPS: readonly PathStep[] = ["import", "shape", "build", "share"];
// How long "Your link is live" stays after the first link is published (docs/copy/guide.md
// path.done: the card's last show before it goes).
export const DONE_HOURS = 24;

export type PathView = { tip: TipId; projectId: string | null; ticked: Record<PathStep, boolean> };

// The path card, or null when it is gone for good: a link of the workspace's own was published
// over DONE_HOURS ago (acceptance 3, so a member joining a live workspace is not onboarded), or
// the newest project is not the one that was published.
export function pathView(facts: FirstProjectFacts, now = new Date()): PathView | null {
  const ticked = { import: facts.hasSet, shape: facts.shaped, build: facts.built, share: facts.published };
  if (facts.firstPublishedAt) {
    const fresh = now.getTime() - facts.firstPublishedAt.getTime() < DONE_HOURS * 3_600_000;
    return fresh && facts.project && facts.published ? { tip: "path.done", projectId: facts.project.id, ticked } : null;
  }
  if (!facts.project) return { tip: "path.start", projectId: null, ticked };
  const next = PATH_STEPS.find((s) => !ticked[s]) ?? "share";
  return { tip: `path.${next}` as TipId, projectId: facts.project.id, ticked };
}
