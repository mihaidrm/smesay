// Workspace helpers (stories/E1-3). A workspace has no workspace_id of its own: it is scoped by
// membership, so the reads a request can make take the user id and join workspace_member. A
// deleted workspace (deleted_at set, E11-2) is not returned here, so requireWorkspace() never
// hands out its id and no helper is reached with it. The helpers that take no session (the
// seed's, the removal job's) are in internal.ts, which lint keeps out of routes.
// db.transaction: orm.drizzle.team/docs/transactions.
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
  // Only the columns a PM edits can change here: name, slug, accent, logo, budget.
  update: async (workspaceId: WorkspaceId, patch: Partial<NewWorkspace>): Promise<Workspace | null> => {
    const values = pickEditable(patch);
    if (Object.keys(values).length === 0) return (await db.select().from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null;
    return (await db.update(workspace).set(values).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null;
  },
  // The brand of a workspace for a public page (stories/E2-5): the respondent side and the logo
  // route show the name, logo and accent to people with no session. Only those three fields;
  // a non-uuid or unknown id is null, so nothing else is learned about a workspace.
  publicBrand: async (workspaceId: string): Promise<{ name: string; accentHex: string | null; logoObjectKey: string | null } | null> => {
    if (!isUuid(workspaceId)) return null;
    return (await db.select({ name: workspace.name, accentHex: workspace.accentHex, logoObjectKey: workspace.logoObjectKey })
      .from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null;
  },
  // Starts the 24-hour removal (E11-2): the workspace disappears from every read at once.
  markDeleted: async (workspaceId: WorkspaceId): Promise<Workspace | null> =>
    (await db.update(workspace).set({ deletedAt: new Date() }).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null,
};

const EDITABLE = ["name", "slug", "accentHex", "logoObjectKey", "aiBudgetEur"] as const;
function pickEditable(patch: Partial<NewWorkspace>): Partial<NewWorkspace> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in patch) out[key] = (patch as Record<string, unknown>)[key];
  return out as Partial<NewWorkspace>;
}
