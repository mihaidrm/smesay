// Workspace-scoped helpers for the instrument table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. latestForProject (stories/E5-1): the newest instrument of a project, the one
// Build opens; desc and orderBy: orm.drizzle.team/docs/select#order-by. createOnSet: one
// instrument per project and set, under the project row's lock (`.for("update")`,
// node_modules/drizzle-orm/pg-core/query-builders/select.d.ts; db.transaction:
// orm.drizzle.team/docs/transactions), so two opens of Build at once, or two "Build on
// version N" presses, end with one draft: the second finds the first's row and returns it.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { instrument, project } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped, type NewRow } from "./scoped";

export type Instrument = typeof instrument.$inferSelect;
export const instruments = {
  ...scoped(instrument),
  latestForProject: async (workspaceId: WorkspaceId, projectId: string): Promise<Instrument | null> => {
    if (!isUuid(projectId)) return null;
    const rows = await db.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, projectId))).orderBy(desc(instrument.createdAt)).limit(1);
    return rows[0] ?? null;
  },
  // The instrument of the project on that set: the one that exists, or the one created from
  // data. Null when the project is not in the workspace.
  createOnSet: async (workspaceId: WorkspaceId, data: NewRow<typeof instrument>): Promise<Instrument | null> => {
    if (!isUuid(data.projectId) || !isUuid(data.itemSetId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, data.projectId))).for("update");
      if (!locked) return null;
      const [existing] = await tx.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, data.projectId), eq(instrument.itemSetId, data.itemSetId))).limit(1);
      if (existing) return existing;
      const [created] = await tx.insert(instrument).values({ ...data, workspaceId }).returning();
      return created;
    });
  },
};
