// track(): the only writer of product events (stories/E13-1, acceptances 1, 3 and 5). It refuses
// a name not in the catalogue, a property that does not fit (src/lib/analytics-catalogue.ts), a
// user id on a respondent event, and a workspace on an event kept without one. It never throws
// and never fails the user's action: a refused event or a failed insert is logged, without the
// values, and the caller goes on. Callers await it after their own work has succeeded; the
// insert is one row.
import { events } from "@/db/queries/events";
import type { WorkspaceId } from "@/db/types";
import { EVENTS, isEventName, NO_WORKSPACE_EVENTS, propsProblem, RESPONDENT_EVENTS, type EventName, type EventProps } from "@/lib/analytics-catalogue";
import { log } from "@/lib/log";

export type TrackWho = { workspaceId: WorkspaceId | null; userId: string | null };
type Empty<N extends EventName> = keyof (typeof EVENTS)[N] extends never ? true : false;

export function trackProblem(name: unknown, properties: Record<string, unknown>, who: TrackWho): string | null {
  if (!isEventName(name)) return "not in the catalogue";
  if (RESPONDENT_EVENTS.includes(name) && who.userId !== null) return "a respondent event carries no user";
  if (NO_WORKSPACE_EVENTS.includes(name) !== (who.workspaceId === null)) return NO_WORKSPACE_EVENTS.includes(name) ? "this event is kept without a workspace" : "this event needs a workspace";
  return propsProblem(name, properties);
}

export async function track<N extends EventName>(name: N, properties: Empty<N> extends true ? Record<string, never> : EventProps<N>, who: TrackWho): Promise<boolean> {
  const props = properties as Record<string, string | number>;
  try {
    const problem = trackProblem(name, props ?? {}, who);
    if (problem) {
      log("warn", "An event was refused.", { detail: String(name).slice(0, 40), reason: problem });
      return false;
    }
    await events.record(who.workspaceId, { userId: who.userId, name, properties: props });
    return true;
  } catch (error) {
    log("error", "An event could not be written.", { detail: name, error: error instanceof Error ? error.name : "error" });
    return false;
  }
}

// Whether the event just tracked was the workspace's first of its name (Plausible's "first"
// goals, stories/E13-3); false when it cannot tell.
export async function wasFirst(name: EventName, workspaceId: WorkspaceId): Promise<boolean> {
  try { return (await events.countInWorkspace(workspaceId, name)) === 1; } catch { return false; }
}
