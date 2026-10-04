// Workspace-scoped helpers for the project table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. summaries() feeds the project list (stories/E3-1): the item
// count of the latest set, the submitted responses against the invites, and the links the
// status is derived from (src/lib/project-status.ts); the item and response counts and the
// invite count are SQL counts grouped per set or instrument, and the link rows are read only
// for the listed projects' instruments. deleteSample() removes the sample project
// (stories/E8-8, acceptance 3, built with E3-1): responses first, because the database refuses
// to drop an instrument with responses (decision 0028), then the project, whose cascades take
// the rest, in one transaction that rolls back when the project row is not the sample. update
// refuses is_sample (E8-8, acceptance 4). count()
// and groupBy: orm.drizzle.team/docs/select#aggregations; inArray() with a subquery:
// node_modules/drizzle-orm/sql/expressions/conditions.d.ts (values: SQLWrapper).
import { and, count, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { instrument, invite, item, itemSet, project, response } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type Project = typeof project.$inferSelect;
export type ProjectSummary = Project & { items: number; submitted: number; invites: number; links: { opensAt: Date | null; closesAt: Date | null; revokedAt: Date | null }[] };

const base = scoped(project);
class NotSampleError extends Error {}

// The watermark goes only with the sample (stories/E8-8, acceptance 4): is_sample is set only
// when the sample is seeded (src/db/seed/sample-seed.ts, through createSample), any other
// create or any update that carries it is refused, so the only way to lose it is to delete the
// sample and the only way to get one is the seed.
export class SampleFlagError extends Error {
  constructor() { super("project.is_sample is set when the sample is seeded and never changed (stories/E8-8)."); }
}

export const projects = {
  ...base,
  // Only the seed makes a sample (createSample); any other create is refused the flag.
  create: async (workspaceId: WorkspaceId, values: Parameters<typeof base.create>[1]): Promise<Project> => {
    if ((values as { isSample?: boolean }).isSample) throw new SampleFlagError();
    return base.create(workspaceId, values);
  },
  createSample: async (workspaceId: WorkspaceId, values: Parameters<typeof base.create>[1]): Promise<Project> =>
    base.create(workspaceId, { ...values, isSample: true }),
  update: async (workspaceId: WorkspaceId, id: string, patch: Parameters<typeof base.update>[2]): Promise<Project | null> => {
    if (Object.hasOwn(patch, "isSample")) throw new SampleFlagError();
    return base.update(workspaceId, id, patch);
  },
  list: async (workspaceId: WorkspaceId): Promise<Project[]> =>
    db.select().from(project).where(eq(project.workspaceId, workspaceId)).orderBy(desc(project.isSample), desc(project.createdAt)),
  summaries: async (workspaceId: WorkspaceId, options: { archived?: boolean } = {}): Promise<ProjectSummary[]> => {
    const rows = await db.select().from(project)
      .where(and(eq(project.workspaceId, workspaceId), options.archived ? isNotNull(project.archivedAt) : isNull(project.archivedAt)))
      .orderBy(desc(project.isSample), desc(project.createdAt));
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    // The latest set per project, then the item count of those sets.
    const sets = await db.select({ id: itemSet.id, projectId: itemSet.projectId, version: itemSet.version }).from(itemSet)
      .where(and(eq(itemSet.workspaceId, workspaceId), inArray(itemSet.projectId, ids)));
    const latest = new Map<string, { id: string; version: number }>();
    for (const s of sets) if ((latest.get(s.projectId)?.version ?? -1) < s.version) latest.set(s.projectId, { id: s.id, version: s.version });
    const latestIds = [...latest.values()].map((s) => s.id);
    const listedInstruments = db.select({ id: instrument.id }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), inArray(instrument.projectId, ids)));
    const [itemCounts, instruments, links, inviteCounts, submitted] = await Promise.all([
      latestIds.length === 0 ? Promise.resolve([] as { itemSetId: string; n: number }[])
        : db.select({ itemSetId: item.itemSetId, n: count() }).from(item).where(and(eq(item.workspaceId, workspaceId), inArray(item.itemSetId, latestIds))).groupBy(item.itemSetId),
      db.select({ id: instrument.id, projectId: instrument.projectId }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), inArray(instrument.projectId, ids))),
      db.select({ instrumentId: invite.instrumentId, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: invite.revokedAt }).from(invite).where(and(eq(invite.workspaceId, workspaceId), inArray(invite.instrumentId, listedInstruments))),
      db.select({ instrumentId: invite.instrumentId, n: count() }).from(invite).where(and(eq(invite.workspaceId, workspaceId), inArray(invite.instrumentId, listedInstruments))).groupBy(invite.instrumentId),
      db.select({ instrumentId: response.instrumentId, n: count() }).from(response).where(and(eq(response.workspaceId, workspaceId), isNotNull(response.submittedAt), inArray(response.instrumentId, listedInstruments))).groupBy(response.instrumentId),
    ]);
    const projectOf = new Map(instruments.map((i) => [i.id, i.projectId]));
    const countOfSet = new Map(itemCounts.map((c) => [c.itemSetId, c.n]));
    const items = new Map([...latest].map(([projectId, s]) => [projectId, countOfSet.get(s.id) ?? 0]));
    return rows.map((r) => {
      const own = (instrumentId: string) => projectOf.get(instrumentId) === r.id;
      return {
        ...r,
        items: items.get(r.id) ?? 0,
        submitted: submitted.filter((s) => own(s.instrumentId)).reduce((sum, s) => sum + s.n, 0),
        invites: inviteCounts.filter((c) => own(c.instrumentId)).reduce((sum, c) => sum + c.n, 0),
        links: links.filter((l) => own(l.instrumentId)).map(({ opensAt, closesAt, revokedAt }) => ({ opensAt, closesAt, revokedAt })),
      };
    });
  },
  setArchived: async (workspaceId: WorkspaceId, id: string, archived: boolean): Promise<Project | null> =>
    base.update(workspaceId, id, { archivedAt: archived ? new Date() : null, updatedAt: new Date() }),
  deleteSample: async (workspaceId: WorkspaceId, id: string): Promise<boolean> => {
    const row = await base.get(workspaceId, id);
    if (!row || !row.isSample) return false;
    try {
      await db.transaction(async (tx) => {
        const own = tx.select({ id: instrument.id }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, id)));
        await tx.delete(response).where(and(eq(response.workspaceId, workspaceId), inArray(response.instrumentId, own)));
        const gone = await tx.delete(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, id), eq(project.isSample, true))).returning();
        // Throwing rolls the response deletion back (orm.drizzle.team/docs/transactions).
        if (gone.length !== 1) throw new NotSampleError();
      });
      return true;
    } catch (error) {
      if (error instanceof NotSampleError) return false;
      throw error;
    }
  },
};
