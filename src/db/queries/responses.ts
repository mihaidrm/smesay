// Workspace-scoped helpers for the response table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. forInvite (E6-3): the newest response of an invite.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { response } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Response = typeof response.$inferSelect;
export const responses = {
  ...scoped(response),
  forInvite: async (workspaceId: WorkspaceId, inviteId: string): Promise<Response | null> => {
    if (!isUuid(inviteId)) return null;
    const rows = await db.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.inviteId, inviteId))).orderBy(desc(response.updatedAt)).limit(1);
    return rows[0] ?? null;
  },
};
