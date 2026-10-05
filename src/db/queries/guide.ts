// The guide's reads and writes (stories/E15-1 and E15-2). The state is the person's own
// (user.guide_state, every workspace): read and written by the user id from the session. The
// first-project facts are the person's in the workspace of the session (its WorkspaceId), and
// leave the sample out (its set, run and link are the seed's, E15-2 acceptance 4).
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { event, instrument, item, itemSet, project, user } from "@/db/schema";
import { DEFAULT_FIELDS } from "@/lib/respondent-fields";
import type { GuideState, WorkspaceId } from "@/db/types";

const EMPTY: GuideState = { tipsOff: false, dismissed: [] };

export const guide = {
  state: async (userId: string): Promise<GuideState> => {
    const row = (await db.select({ s: user.guideState }).from(user).where(eq(user.id, userId)))[0];
    return row ? { tipsOff: row.s?.tipsOff === true, dismissed: Array.isArray(row.s?.dismissed) ? row.s.dismissed.filter((d): d is string => typeof d === "string") : [] } : EMPTY;
  },
  // Adds the id to the dismissed list once, in one statement, so two tabs cannot lose one.
  dismiss: async (userId: string, tipId: string): Promise<void> => {
    await db.update(user).set({
      guideState: sql`jsonb_set(${user.guideState}, '{dismissed}', (select coalesce(jsonb_agg(distinct d), '[]'::jsonb) from jsonb_array_elements_text(coalesce(${user.guideState}->'dismissed', '[]'::jsonb) || to_jsonb(${tipId}::text)) as d))`,
    }).where(eq(user.id, userId));
  },
  setTipsOff: async (userId: string, off: boolean): Promise<void> => {
    await db.update(user).set({ guideState: sql`jsonb_set(${user.guideState}, '{tipsOff}', to_jsonb(${off}::boolean))` }).where(eq(user.id, userId));
  },
};

export type FirstProjectFacts = {
  // The person's newest project (made by them, not the sample, not archived), or null.
  project: { id: string; name: string } | null;
  hasSet: boolean;
  shaped: boolean;
  built: boolean;
  published: boolean;
  // When a link was first published or an invite first sent in the workspace, by anyone, or
  // null (E15-2 acceptance 3).
  firstPublishedAt: Date | null;
};

// The data the first-project path is ticked from (E15-2 acceptance 2), for one person in one
// workspace: Import when their newest project has a set; Shape when that set was shaped
// (item_set.shape_runs, shaped_at: E4-2), or it came with areas and the person has gone on to
// Build (an instrument exists); Build when the instrument has an intro and fields other than the
// two defaults; Share when a link was published or an invite sent for the project. "Published"
// is read from the invite_sent events (src/lib/analytics.ts, E13-1), so a project file imported
// with its old dates (E10-2) does not count, nor does the seed's sample.
export async function firstProjectFacts(ws: WorkspaceId, userId: string): Promise<FirstProjectFacts> {
  const [newest] = await db.select({ id: project.id, name: project.name }).from(project)
    .where(and(eq(project.workspaceId, ws), eq(project.createdBy, userId), eq(project.isSample, false), isNull(project.archivedAt))).orderBy(desc(project.createdAt)).limit(1);
  const [first] = await db.select({ at: sql<Date | null>`min(${event.createdAt})` }).from(event).where(and(eq(event.workspaceId, ws), eq(event.name, "invite_sent")));
  const firstPublishedAt = first?.at ? new Date(first.at) : null;
  if (!newest) return { project: null, hasSet: false, shaped: false, built: false, published: false, firstPublishedAt };
  const [set] = await db.select({ id: itemSet.id, shapeRuns: itemSet.shapeRuns, shapedAt: itemSet.shapedAt }).from(itemSet)
    .where(and(eq(itemSet.workspaceId, ws), eq(itemSet.projectId, newest.id))).orderBy(desc(itemSet.version)).limit(1);
  const [inst] = await db.select({ intro: instrument.intro, fields: instrument.respondentFields }).from(instrument)
    .where(and(eq(instrument.workspaceId, ws), eq(instrument.projectId, newest.id))).orderBy(desc(instrument.createdAt)).limit(1);
  const [sent] = await db.select({ id: event.id }).from(event)
    .where(and(eq(event.workspaceId, ws), eq(event.name, "invite_sent"), sql`${event.properties}->>'project' = ${newest.id}`)).limit(1);
  let shaped = false;
  if (set) {
    const ran = set.shapeRuns > 0 || set.shapedAt !== null;
    const [withArea] = ran || !inst ? [] : await db.select({ id: item.id }).from(item).where(and(eq(item.workspaceId, ws), eq(item.itemSetId, set.id), isNotNull(item.area))).limit(1);
    shaped = ran || Boolean(withArea);
  }
  const built = Boolean(inst && (inst.intro ?? "").trim() !== "" && !sameFields((inst.fields ?? []) as Field[], DEFAULT_FIELDS as Field[]));
  return { project: newest, hasSet: Boolean(set), shaped, built, published: Boolean(sent), firstPublishedAt };
}

// Field by field, as jsonb keeps its own key order (postgresql.org/docs/current/datatype-json.html).
type Field = { key?: unknown; label?: unknown; type?: unknown; mandatory?: unknown; options?: unknown };
const sameFields = (a: Field[], b: Field[]) => a.length === b.length && a.every((f, i) => f.key === b[i].key && f.label === b[i].label && f.type === b[i].type && f.mandatory === b[i].mandatory && JSON.stringify(f.options ?? null) === JSON.stringify(b[i].options ?? null));
