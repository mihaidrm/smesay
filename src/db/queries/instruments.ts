// Workspace-scoped helpers for the instrument table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. latestForProject (stories/E5-1): the newest instrument of a project, the one
// Build opens; desc and orderBy: orm.drizzle.team/docs/select#order-by.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { instrument } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type Instrument = typeof instrument.$inferSelect;
export const instruments = {
  ...scoped(instrument),
  latestForProject: async (workspaceId: WorkspaceId, projectId: string): Promise<Instrument | null> => {
    const rows = await db.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, projectId))).orderBy(desc(instrument.createdAt)).limit(1);
    return rows[0] ?? null;
  },
};
