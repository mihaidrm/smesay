// Workspace-scoped helpers for the aiRun table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. The month's run count and cost are in usage.ts (E2-6), the
// one place that counts. lastFor (E9-3): a project's latest answered run of one purpose (a call
// the provider did not answer is a row with no tokens, and is not the run to show).
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiRun } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type AiRun = typeof aiRun.$inferSelect;
export const aiRuns = {
  ...scoped(aiRun),
  lastFor: async (ws: WorkspaceId, projectId: string, purpose: AiRun["purpose"]): Promise<AiRun | null> => {
    if (!isUuid(projectId)) return null;
    const [row] = await db.select().from(aiRun).where(and(eq(aiRun.workspaceId, ws), eq(aiRun.projectId, projectId), eq(aiRun.purpose, purpose), sql`${aiRun.tokensIn} + ${aiRun.tokensOut} > 0`)).orderBy(desc(aiRun.createdAt)).limit(1);
    return row ?? null;
  },
};
