// Workspace-scoped helpers for the missingItem table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. forResponse (E7-5): a response's missing item (one at most, replaced on
// every Submit by responses.submit).
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { missingItem } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type MissingItem = typeof missingItem.$inferSelect;
export const missingItems = {
  ...scoped(missingItem),
  forResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<MissingItem[]> => {
    if (!isUuid(responseId)) return [];
    return db.select().from(missingItem).where(and(eq(missingItem.workspaceId, workspaceId), eq(missingItem.responseId, responseId)));
  },
};
