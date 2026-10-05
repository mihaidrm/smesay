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

// The step tips and rescue tips (stories/E15-3, E15-4): at most one per page, chosen from the
// page's data in the order below (a rescue tip first: it is the one that unsticks). A page whose
// data matches nothing shows no card. Times come from the rows; the server compares them with
// the request's time, so nothing waits on a client timer (E15-4 acceptance 2).
export const RESCUE_UPLOAD_MINUTES = 10;
export const RESCUE_NO_RESPONSE_DAYS = 3;

// Import: no list yet; a list uploaded or pasted with columns to map and not imported (after ten
// minutes, the rescue line). Importing it ends both, so the person never sees a tip for what
// they just did. An upload with no columns read shows its own error and no tip.
export function importTip(d: { hasSet: boolean; pending: { createdAt: Date } | null }, now = new Date()): TipId | null {
  if (d.pending) return now.getTime() - d.pending.createdAt.getTime() >= RESCUE_UPLOAD_MINUTES * 60_000 ? "rescue.mapping" : "import.mapping";
  return d.hasSet ? null : "import.empty";
}

// Shape: a refused or failed run on the newest list after its last good run (the rescue); a list
// not shaped yet; reader versions waiting. A failure before the newest list was imported is the
// old list's, not this one's.
export function shapeTip(d: { hasSet: boolean; importedAt: Date; shapedAt: Date | null; lastFailedAt: Date | null; pending: number }): TipId | null {
  if (!d.hasSet) return null;
  const since = d.shapedAt && d.shapedAt > d.importedAt ? d.shapedAt : d.importedAt;
  if (d.lastFailedAt && d.lastFailedAt > since) return "rescue.shapeFailed";
  if (!d.shapedAt) return "shape.notRun";
  return d.pending > 0 ? "shape.pending" : null;
}

// Build: the intro empty; the fields still the two defaults, Name and Role as text.
export function buildTip(d: { intro: string | null; fields: { key: string; type: string }[] }): TipId | null {
  if ((d.intro ?? "").trim() === "") return "build.intro";
  const defaults = d.fields.length === 2 && d.fields.every((f) => f.type === "text") && d.fields.map((f) => f.key).sort().join() === "name,role";
  return defaults ? "build.fields" : null;
}

// Share: the link in draft; a link open for three days or more with no response (the rescue).
// openSince is when respondents could first answer: the publish, or the open date when later. A
// link withdrawn, closed or not open yet is no rescue: nobody could answer it now.
export function shareTip(d: { publishedAt: Date | null; open: boolean; openSince: Date | null; responses: number }, now = new Date()): TipId | null {
  if (!d.publishedAt) return "share.draft";
  return d.open && d.openSince && d.responses === 0 && now.getTime() - d.openSince.getTime() >= RESCUE_NO_RESPONSE_DAYS * 86_400_000 ? "rescue.noResponse" : null;
}

// The sample walkthrough on the sample's Results (E15-3 acceptance 3): one tip per screen, each
// screen reached from the previous tip's Next. Dismissing any of the three ends the walkthrough.
export type SampleScreen = "strip" | "registers" | "detail";
export const SAMPLE_TIPS: Record<SampleScreen, TipId> = { strip: "sample.strip", registers: "sample.registers", detail: "sample.detail" };
export const walkthroughOver = (state: GuideState): boolean => state.tipsOff || state.dismissed.some((d) => d.startsWith("sample."));
