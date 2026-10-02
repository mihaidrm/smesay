// The one place a workspace filter is written (stories/E1-3, CLAUDE.md: every query helper takes
// the workspace id from the session, never from the request body). Every table helper is built
// from this factory, so a row of another workspace can never be listed, read, changed or removed
// through src/db/queries/: each statement carries `where workspace_id = $1`, and get, update and
// remove add the id on top. The workspace id is a WorkspaceId, a branded string that only
// src/lib/workspace.ts produces from the session (and unsafeWorkspaceId() below, for the seed and
// the tests, which lint keeps out of routes). Create and update drop `id` and `workspaceId` from
// what they are given, so a request body cannot move a row or plant one under another workspace.
// Drizzle: eq, and, count from "drizzle-orm"; select, insert, update, delete, returning from
// drizzle-orm/pg-core (node_modules/drizzle-orm/pg-core/db.d.ts).
import { and, count, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";

import type { WorkspaceId } from "@/db/types";

export type { WorkspaceId };

// For the seed and the tests only (eslint-rules/db-access.mjs keeps this module out of routes).
export const unsafeWorkspaceId = (id: string): WorkspaceId => id as WorkspaceId;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export type ScopedTable = PgTable & { id: PgColumn; workspaceId: PgColumn };
export type Row<T extends ScopedTable> = T["$inferSelect"];
export type NewRow<T extends ScopedTable> = Omit<T["$inferInsert"], "id" | "workspaceId">;
export type Patch<T extends ScopedTable> = Partial<NewRow<T>>;

export type Scoped<T extends ScopedTable> = {
  list: (workspaceId: WorkspaceId) => Promise<Row<T>[]>;
  get: (workspaceId: WorkspaceId, id: string) => Promise<Row<T> | null>;
  count: (workspaceId: WorkspaceId) => Promise<number>;
  create: (workspaceId: WorkspaceId, data: NewRow<T>) => Promise<Row<T>>;
  update: (workspaceId: WorkspaceId, id: string, patch: Patch<T>) => Promise<Row<T> | null>;
  remove: (workspaceId: WorkspaceId, id: string) => Promise<Row<T> | null>;
};

// Drops the two columns a caller may never set, whatever the runtime object carries.
function own<T extends object>(data: T): Omit<T, "id" | "workspaceId"> {
  const copy = { ...data } as Record<string, unknown>;
  delete copy.id;
  delete copy.workspaceId;
  return copy as Omit<T, "id" | "workspaceId">;
}

export function scoped<T extends ScopedTable>(table: T): Scoped<T> {
  const inWorkspace = (workspaceId: WorkspaceId) => eq(table.workspaceId, workspaceId);
  const oneRow = (workspaceId: WorkspaceId, id: string) => and(inWorkspace(workspaceId), eq(table.id, id));
  return {
    list: async (workspaceId) => (await db.select().from(table as PgTable).where(inWorkspace(workspaceId))) as Row<T>[],
    get: async (workspaceId, id) => {
      if (!isUuid(id)) return null;
      return ((await db.select().from(table as PgTable).where(oneRow(workspaceId, id)).limit(1))[0] as Row<T> | undefined) ?? null;
    },
    count: async (workspaceId) => (await db.select({ n: count() }).from(table as PgTable).where(inWorkspace(workspaceId)))[0].n,
    create: async (workspaceId, data) => (await db.insert(table).values({ ...own(data), workspaceId } as T["$inferInsert"]).returning())[0] as Row<T>,
    update: async (workspaceId, id, patch) => {
      if (!isUuid(id)) return null;
      const values = own(patch);
      if (Object.keys(values).length === 0) return scopedGet(table, workspaceId, id);
      return ((await db.update(table).set(values as T["$inferInsert"]).where(oneRow(workspaceId, id)).returning())[0] as Row<T> | undefined) ?? null;
    },
    remove: async (workspaceId, id) => {
      if (!isUuid(id)) return null;
      return ((await db.delete(table).where(oneRow(workspaceId, id)).returning())[0] as Row<T> | undefined) ?? null;
    },
  };
}

async function scopedGet<T extends ScopedTable>(table: T, workspaceId: WorkspaceId, id: string): Promise<Row<T> | null> {
  return ((await db.select().from(table as PgTable).where(and(eq(table.workspaceId, workspaceId), eq(table.id, id))).limit(1))[0] as Row<T> | undefined) ?? null;
}
