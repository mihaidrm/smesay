// The product events (stories/E13-1, acceptance 1; docs/analytics.md, the same list). Each event
// names the properties it may carry and what each may hold: a count (a whole number from 0), a
// value from a fixed list or an id (a uuid).
// Nothing else fits, so an email, a name or typed text cannot be stored (acceptance 3). A tip
// is one of GUIDE_TIPS, empty until E15 names the tips, so no guide event fits before. Pure, so
// the unit test reads it and the admin page (E13-2) names its funnel from it.
import type { Layout, ScoringMethod } from "@/db/types";

// The schema's values (src/db/types.ts); the two checks below fail the build if one is missed.
const METHODS = ["moscow", "fit", "kcd"] as const satisfies readonly ScoringMethod[];
const LAYOUTS = ["chapters", "item", "page"] as const satisfies readonly Layout[];
const allMethods: Exclude<ScoringMethod, (typeof METHODS)[number]> extends never ? true : never = true;
const allLayouts: Exclude<Layout, (typeof LAYOUTS)[number]> extends never ? true : never = true;
void allMethods; void allLayouts;

export type PropSpec = "count" | "id" | readonly string[];

// The guide's tip ids (stories/E15-3, E15-4); E15-5 fills this list when the tips exist.
export const GUIDE_TIPS: readonly string[] = [];

export const EVENTS = {
  signed_up: {},
  workspace_created: {},
  member_joined: {},
  project_created: { from: ["new", "import"] },
  import_committed: { source: ["upload", "paste"], rows: "count" },
  shape_run: { items: "count", costCents: "count" },
  instrument_published: { method: METHODS, layout: LAYOUTS },
  invite_sent: { kind: ["personal", "public"] },
  link_opened: { kind: ["personal", "public"], instrument: "id" },
  response_started: { instrument: "id" },
  response_submitted: { instrument: "id", items: "count", minutes: "count" },
  reminder_sent: {},
  insight_run: { actions: "count", costCents: "count" },
  export_downloaded: { format: ["csv", "json", "pdf", "zip"] },
  sample_opened: {},
  sample_deleted: {},
  quickstart_seen: {},
  workspace_deleted: {},
  // E15-5, written once the guide card is built.
  guide_shown: { tip: GUIDE_TIPS },
  guide_dismissed: { tip: GUIDE_TIPS },
  guide_acted: { tip: GUIDE_TIPS },
} as const satisfies Record<string, Record<string, PropSpec>>;

export type EventName = keyof typeof EVENTS;
type ValueOf<S> = S extends "count" ? number : S extends "id" ? string : S extends readonly (infer V)[] ? V : never;
export type EventProps<N extends EventName> = { [K in keyof (typeof EVENTS)[N]]: ValueOf<(typeof EVENTS)[N][K]> };

// Events a respondent causes: they never carry a user id (acceptance 3).
export const RESPONDENT_EVENTS: readonly EventName[] = ["link_opened", "response_started", "response_submitted"];
// Events kept with no workspace: before one exists, or about one that is going (acceptance 5:
// the workspace's own events go with it, the count of deletions stays).
export const NO_WORKSPACE_EVENTS: readonly EventName[] = ["signed_up", "workspace_deleted"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const COUNT_MAX = 1_000_000_000;

export const isEventName = (name: unknown): name is EventName => typeof name === "string" && Object.hasOwn(EVENTS, name);

// The reason a set of properties is refused, or null when every key is the event's and every
// value fits its spec, and every key of the spec is there.
export function propsProblem(name: EventName, props: Record<string, unknown>): string | null {
  const spec = EVENTS[name] as Record<string, PropSpec>;
  for (const key of Object.keys(props)) if (!Object.hasOwn(spec, key)) return "unknown property";
  for (const [key, kind] of Object.entries(spec)) {
    const v = props[key];
    if (v === undefined) return `missing property ${key}`;
    const ok = kind === "count" ? Number.isInteger(v) && (v as number) >= 0 && (v as number) <= COUNT_MAX
      : kind === "id" ? typeof v === "string" && UUID.test(v)
      : typeof v === "string" && kind.includes(v);
    if (!ok) return `property ${key} does not fit`;
  }
  return null;
}
