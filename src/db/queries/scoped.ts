// The one place a workspace filter is written (stories/E1-3, CLAUDE.md: every query helper takes
// the workspace id from the session, never from the request body). Every table helper is built
// from this factory, so a row of another workspace can never be listed, read, changed or removed
// through src/db/queries/: each statement carries `where workspace_id = $1`, and get, update and
// remove add the id on top. Drizzle: eq, and, count from "drizzle-orm"; select, update, delete,
// returning from drizzle-orm/pg-core (node_modules/drizzle-orm/pg-core/db.d.ts).
import { and, count, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";

export type ScopedTable = PgTable & { id: PgColumn; workspaceId: PgColumn };

export type Scoped<T extends ScopedTable> = {
  list: (workspaceId: string) => Promise<T["$inferSelect"][]>;
  get: (workspaceId: string, id: string) => Promise<T["$inferSelect"] | null>;
  count: (workspaceId: string) => Promise<number>;
  create: (workspaceId: string, data: Omit<T["$inferInsert"], "workspaceId">) => Promise<T["$inferSelect"]>;
  update: (workspaceId: string, id: string, patch: Partial<Omit<T["$inferInsert"], "id" | "workspaceId">>) => Promise<T["$inferSelect"] | null>;
  remove: (workspaceId: string, id: string) => Promise<T["$inferSelect"] | null>;
};

export function scoped<T extends ScopedTable>(table: T): Scoped<T> {
  type Row = T["$inferSelect"];
  const inWorkspace = (workspaceId: string) => eq(table.workspaceId, workspaceId);
  const oneRow = (workspaceId: string, id: string) => and(inWorkspace(workspaceId), eq(table.id, id));
  return {
    list: async (workspaceId) => (await db.select().from(table as PgTable).where(inWorkspace(workspaceId))) as Row[],
    get: async (workspaceId, id) => ((await db.select().from(table as PgTable).where(oneRow(workspaceId, id)).limit(1))[0] as Row | undefined) ?? null,
    count: async (workspaceId) => (await db.select({ n: count() }).from(table as PgTable).where(inWorkspace(workspaceId)))[0].n,
    create: async (workspaceId, data) => (await db.insert(table).values({ ...data, workspaceId } as T["$inferInsert"]).returning())[0] as Row,
    update: async (workspaceId, id, patch) => ((await db.update(table).set(patch as T["$inferInsert"]).where(oneRow(workspaceId, id)).returning())[0] as Row | undefined) ?? null,
    remove: async (workspaceId, id) => ((await db.delete(table).where(oneRow(workspaceId, id)).returning())[0] as Row | undefined) ?? null,
  };
}
