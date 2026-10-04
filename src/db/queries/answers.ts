// Workspace-scoped helpers for the answer table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. countForResponse (E6-3): how many items a response has answered.
// forResponse (E7-1): a response's answers, for the respondent page and its counts.
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { answer } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Answer = typeof answer.$inferSelect;
export const answers = {
  ...scoped(answer),
  countForResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<number> => {
    if (!isUuid(responseId)) return 0;
    return (await db.select({ n: count() }).from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId))))[0].n;
  },
  forResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<Answer[]> => {
    if (!isUuid(responseId)) return [];
    return db.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId)));
  },
};
