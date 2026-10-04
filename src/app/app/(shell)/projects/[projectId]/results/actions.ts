"use server";
// Server actions of Results (stories/E8-1, acceptance 2 and 7; E8-3, acceptance 2): the PM's
// tiles, the include-unsubmitted switch and the Agreement tab's view, kept per PM per
// instrument (user.results_prefs). The project is
// read through the current workspace first, so an instrument of another workspace is never
// written to anyone's choices; the tiles are checked on the server (one to six known ids).
// Server Functions: node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md.
import { revalidatePath } from "next/cache";
import { instruments, projects } from "@/db/queries";
import { resultsPrefs } from "@/db/queries/results";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { RESULTS_COPY } from "@/lib/results-copy";
import { parseTileChoice } from "@/lib/results-tiles";
import { setActionState, writeActions } from "@/lib/insights";

export type ResultsActionState = { error: string | null };

async function instrumentFor(projectId: string) {
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const project = await projects.get(current.ws, projectId);
  const instrument = project ? await instruments.latestForProject(current.ws, project.id) : null;
  return instrument ? { userId: session.user.id, instrumentId: instrument.id } : null;
}

export async function saveTiles(projectId: string, tiles: string[]): Promise<ResultsActionState> {
  const found = await instrumentFor(projectId);
  if (!found) return { error: RESULTS_COPY.noInstrument };
  const choice = parseTileChoice(Array.isArray(tiles) ? tiles : []);
  if ("error" in choice) return { error: choice.error };
  await resultsPrefs.set(found.userId, found.instrumentId, { tiles: choice });
  revalidatePath(`/app/projects/${projectId}/results`);
  return { error: null };
}

export async function saveIncludeUnsubmitted(projectId: string, on: boolean): Promise<ResultsActionState> {
  const found = await instrumentFor(projectId);
  if (!found) return { error: RESULTS_COPY.noInstrument };
  await resultsPrefs.set(found.userId, found.instrumentId, { includeUnsubmitted: on === true });
  revalidatePath(`/app/projects/${projectId}/results`);
  return { error: null };
}

// The Agreement tab's view (E8-3, acceptance 2), kept per PM per instrument.
export async function saveView(projectId: string, view: string): Promise<ResultsActionState> {
  if (view !== "table" && view !== "columns" && view !== "share") return { error: RESULTS_COPY.saveFailed };
  const found = await instrumentFor(projectId);
  if (!found) return { error: RESULTS_COPY.noInstrument };
  await resultsPrefs.set(found.userId, found.instrumentId, { view });
  revalidatePath(`/app/projects/${projectId}/results`);
  return { error: null };
}

// Write actions (stories/E9-1): the model writes the project's actions from the answers;
// the sample is refused in src/lib/insights.ts (no model call).
// written: how many actions the run kept, so a run that kept none says so.
export type WriteActionsState = { error: string | null; retry: boolean; written: number | null };
export async function writeActionsAction(projectId: string): Promise<WriteActionsState> {
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const result = await writeActions({ ws: current.ws, userId: session.user.id }, projectId);
  if ("error" in result) return { error: result.error, retry: result.retry, written: null };
  revalidatePath(`/app/projects/${projectId}/results`);
  return { error: null, retry: false, written: result.written.length };
}

// Mark done, Dismiss and Reopen (stories/E9-2): the state comes from the button pressed and is
// checked again in src/lib/insights.ts.
export type ActionStateResult = { error: string | null };
export async function setActionStateAction(projectId: string, insightId: string, state: string): Promise<ActionStateResult> {
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const result = await setActionState({ ws: current.ws, userId: session.user.id }, projectId, insightId, state);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/app/projects/${projectId}/results`);
  return { error: null };
}
