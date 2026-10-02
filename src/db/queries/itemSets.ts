// Workspace-scoped helpers for the itemSet table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. versions() feeds the import log (stories/E3-6): every set of
// a project, newest first, with its item count (a SQL count grouped by set) and the importer's
// name. count() and groupBy: orm.drizzle.team/docs/select#aggregations; leftJoin:
// orm.drizzle.team/docs/joins.
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { item, itemSet, user } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type ItemSet = typeof itemSet.$inferSelect;
export type ItemSetVersion = ItemSet & { items: number; importedByName: string | null };

export const itemSets = {
  ...scoped(itemSet),
  versions: async (workspaceId: WorkspaceId, projectId: string): Promise<ItemSetVersion[]> => {
    const rows = await db.select({ set: itemSet, importedByName: user.name, importedByEmail: user.email }).from(itemSet)
      .leftJoin(user, eq(user.id, itemSet.importedBy))
      .where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.projectId, projectId)))
      .orderBy(desc(itemSet.version));
    if (rows.length === 0) return [];
    const counts = await db.select({ itemSetId: item.itemSetId, n: count() }).from(item)
      .where(and(eq(item.workspaceId, workspaceId), inArray(item.itemSetId, rows.map((r) => r.set.id)))).groupBy(item.itemSetId);
    const countOf = new Map(counts.map((c) => [c.itemSetId, c.n]));
    // The importer's name, or the email while the account has no name (E2-1 sign-in).
    return rows.map((r) => ({ ...r.set, items: countOf.get(r.set.id) ?? 0, importedByName: r.importedByName || r.importedByEmail || null }));
  },
};
