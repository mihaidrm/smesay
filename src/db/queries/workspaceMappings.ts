// Workspace-scoped helpers for workspace_mapping (stories/E3-3, acceptance 3): the mapping
// remembered under a headers key, written by upsert() on every valid mapping. updated_at is the
// database clock (defaultNow() on insert, now() on update), the same clock as upload.created_at.
// onConflictDoUpdate: orm.drizzle.team/docs/insert#upserts-and-conflicts.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMapping } from "@/db/schema";
import type { ColumnMapping, WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type WorkspaceMapping = typeof workspaceMapping.$inferSelect;

export const workspaceMappings = {
  ...scoped(workspaceMapping),
  getByHeaders: async (workspaceId: WorkspaceId, headersKey: string): Promise<WorkspaceMapping | null> =>
    (await db.select().from(workspaceMapping).where(and(eq(workspaceMapping.workspaceId, workspaceId), eq(workspaceMapping.headersKey, headersKey))).limit(1))[0] ?? null,
  upsert: async (workspaceId: WorkspaceId, headersKey: string, mapping: ColumnMapping): Promise<WorkspaceMapping> =>
    (await db.insert(workspaceMapping).values({ workspaceId, headersKey, mapping })
      .onConflictDoUpdate({ target: [workspaceMapping.workspaceId, workspaceMapping.headersKey], set: { mapping, updatedAt: sql`now()` } })
      .returning())[0],
};
