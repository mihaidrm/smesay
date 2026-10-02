// Workspace helpers (stories/E1-3). A workspace has no workspace_id of its own: it is scoped by
// membership, so every read takes the user id and joins workspace_member. Deleted workspaces
// (deleted_at set, E11-2) are invisible everywhere.
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";

export type Workspace = typeof workspace.$inferSelect;
export type NewWorkspace = Omit<typeof workspace.$inferInsert, "id" | "createdAt" | "deletedAt">;

const live = () => isNull(workspace.deletedAt);

export const workspaces = {
  listForUser: async (userId: string): Promise<Workspace[]> =>
    (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), live())).orderBy(workspace.createdAt)).map((r) => r.w),
  getForUser: async (userId: string, workspaceId: string): Promise<Workspace | null> =>
    (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), eq(workspace.id, workspaceId), live())).limit(1)).map((r) => r.w)[0] ?? null,
  // Creates the workspace and its first member in one transaction (E2-3 names the owner).
  create: async (data: NewWorkspace, ownerUserId: string): Promise<Workspace> =>
    db.transaction(async (tx) => {
      const [row] = await tx.insert(workspace).values(data).returning();
      await tx.insert(workspaceMember).values({ workspaceId: row.id, userId: ownerUserId, role: "owner" });
      return row;
    }),
  update: async (workspaceId: string, patch: Partial<NewWorkspace>): Promise<Workspace | null> =>
    (await db.update(workspace).set(patch).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null,
};
