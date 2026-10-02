// Workspace helpers (stories/E1-3). A workspace has no workspace_id of its own: it is scoped by
// membership, so the reads a request can make take the user id and join workspace_member. A
// deleted workspace (deleted_at set, E11-2) is not returned here, so requireWorkspace() never
// hands out its id and no helper is reached with it. db.transaction:
// orm.drizzle.team/docs/transactions.
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { isUuid, type WorkspaceId } from "./scoped";

export type Workspace = typeof workspace.$inferSelect;
export type NewWorkspace = Omit<typeof workspace.$inferInsert, "id" | "createdAt" | "deletedAt">;

const live = () => isNull(workspace.deletedAt);

export const workspaces = {
  listForUser: async (userId: string): Promise<Workspace[]> =>
    (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), live())).orderBy(workspace.createdAt)).map((r) => r.w),
  getForUser: async (userId: string, workspaceId: string): Promise<Workspace | null> => {
    if (!isUuid(workspaceId)) return null;
    return (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), eq(workspace.id, workspaceId), live())).limit(1)).map((r) => r.w)[0] ?? null;
  },
  // Creates the workspace and its first member in one transaction (E2-3 names the owner).
  create: async (data: NewWorkspace, ownerUserId: string): Promise<Workspace> =>
    db.transaction(async (tx) => {
      const [row] = await tx.insert(workspace).values(data).returning();
      await tx.insert(workspaceMember).values({ workspaceId: row.id, userId: ownerUserId, role: "owner" });
      return row;
    }),
  // The owner-only check is E2-4's (src/lib/permissions.ts); the id comes from requireWorkspace().
  update: async (workspaceId: WorkspaceId, patch: Partial<NewWorkspace>): Promise<Workspace | null> => {
    const values = { ...patch } as Record<string, unknown>;
    delete values.id;
    if (Object.keys(values).length === 0) return (await db.select().from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null;
    return (await db.update(workspace).set(values as Partial<NewWorkspace>).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null;
  },
  // No membership check: the seed (is the sample there?) and E11-2's removal job only.
  getById: async (workspaceId: string): Promise<Workspace | null> =>
    isUuid(workspaceId) ? (await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1))[0] ?? null : null,
  // A workspace with no member yet: the seed's sample workspace (stories/E1-4, acceptance 4),
  // whose owner is attached by E2's first sign-in. Every other caller uses create().
  createEmpty: async (data: NewWorkspace & { id?: string }): Promise<Workspace> =>
    (await db.insert(workspace).values(data).returning())[0],
  // Removes the workspace and, through the cascades of schema v1, everything in it. Used by the
  // seed when it fails half way and by E11-2's removal job; never by a request handler.
  hardDelete: async (workspaceId: string): Promise<boolean> =>
    isUuid(workspaceId) && (await db.delete(workspace).where(eq(workspace.id, workspaceId)).returning()).length > 0,
};
