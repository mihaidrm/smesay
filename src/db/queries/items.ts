// Workspace-scoped helpers for the item table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. forSet (E4-2): a set's items in position order.
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { item } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type Item = typeof item.$inferSelect;
export const items = {
  ...scoped(item),
  forSet: async (workspaceId: WorkspaceId, itemSetId: string): Promise<Item[]> =>
    db.select().from(item).where(and(eq(item.workspaceId, workspaceId), eq(item.itemSetId, itemSetId))).orderBy(asc(item.position)),
};
