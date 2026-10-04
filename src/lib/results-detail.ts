// The item detail's logic (stories/E8-5): which counts it shows and which pill a row carries.
// The counts follow the item, not the instrument: an item with no proposed value is rated
// (kind pick) even where the instrument shows proposals (src/lib/scoring.ts), as the
// Agreement tab treats it.
import { KIND_LABELS } from "@/lib/results-filter";

export type DetailCountKey = "agree" | "change" | "disagree" | "unclear" | "pick" | "notYet";
export type DetailCounts = Record<DetailCountKey, number>;

export function detailCountKeys(proposed: string | null): DetailCountKey[] {
  return proposed ? ["agree", "change", "disagree", "unclear", "notYet"] : ["pick", "unclear", "notYet"];
}

export type RowPill =
  | { type: "status"; status: "agree" | "pushedBack" | "disagree" | "unclear"; label: string }
  | { type: "neutral"; label: string }
  | { type: "notAnswered" };

const STATUS: Record<string, "agree" | "pushedBack" | "disagree" | "unclear"> = { agree: "agree", change: "pushedBack", disagree: "disagree", unclear: "unclear" };

// The four verdicts in their status tint, Rated in the neutral pill; with no answer that
// counts: Not started for an invite not opened, Not answered for a submitted response (a
// guard case, since Submit needs every item the person sees answered, E7-5), else In progress.
export function rowPill(r: { kind: string | null; invited: boolean; submitted: boolean }, labels: { notStarted: string; inProgress: string }): RowPill {
  if (r.kind && STATUS[r.kind]) return { type: "status", status: STATUS[r.kind], label: KIND_LABELS[r.kind as keyof typeof KIND_LABELS] };
  if (r.kind) return { type: "neutral", label: KIND_LABELS[r.kind as keyof typeof KIND_LABELS] ?? r.kind };
  if (r.invited) return { type: "neutral", label: labels.notStarted };
  if (r.submitted) return { type: "notAnswered" };
  return { type: "neutral", label: labels.inProgress };
}

// A value shows where it differs from the proposal; with no proposal every value shows.
export const showValue = (value: string | null, proposed: string | null): value is string => value !== null && value !== proposed;

// The item in the URL (item=[id]): an id of the UUID shape, else no detail, so nothing else
// is carried into the page's links.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const itemParam = (v: string | string[] | undefined): string | null => (typeof v === "string" && ID.test(v) ? v : null);
