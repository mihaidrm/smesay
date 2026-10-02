// Workspace-scoped helpers for the aiRun table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { and, eq, gte, sum } from "drizzle-orm";
import { db } from "@/db";
import { aiRun } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type AiRun = typeof aiRun.$inferSelect;
export const aiRuns = {
  ...scoped(aiRun),
  // The AI budget line (stories/E2-5, acceptance 1): euro cents spent since the first of the
  // current month, UTC. sum(): orm.drizzle.team/docs/select#aggregations.
  costThisMonthCents: async (workspaceId: WorkspaceId, now = new Date()): Promise<number> => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const [row] = await db.select({ total: sum(aiRun.costEurCents) }).from(aiRun).where(and(eq(aiRun.workspaceId, workspaceId), gte(aiRun.createdAt, start)));
    return Number(row?.total ?? 0);
  },
};
