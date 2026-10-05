// Workspace helpers (stories/E1-3). A workspace has no workspace_id of its own: it is scoped by
// membership, so the reads a request can make take the user id and join workspace_member. A
// deleted workspace (deleted_at set, E11-2) is not returned here, so requireWorkspace() never
// hands out its id and no helper is reached with it. The helpers that take no session (the
// seed's, the removal job's) are in internal.ts, which lint keeps out of routes.
// db.transaction: orm.drizzle.team/docs/transactions.
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { user, workspace, workspaceMember } from "@/db/schema";
import type { PlanKey } from "@/db/types";
import { isUuid, type WorkspaceId } from "./scoped";

export type Workspace = typeof workspace.$inferSelect;
export type NewWorkspace = Omit<typeof workspace.$inferInsert, "id" | "createdAt" | "deletedAt" | "deletedBy">;
export type DeletedWorkspace = { id: string; name: string; deletedAt: Date; deletedByEmail: string | null };

const live = () => isNull(workspace.deletedAt);

export const workspaces = {
  listForUser: async (userId: string): Promise<Workspace[]> =>
    (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), live())).orderBy(workspace.createdAt)).map((r) => r.w),
  // The live workspaces where the user is the only owner (stories/E14-3: an account that would
  // leave a workspace without an owner is not deleted).
  soleOwnedBy: async (userId: string): Promise<Workspace[]> => {
    const owners = db.select({ id: workspaceMember.workspaceId }).from(workspaceMember).where(eq(workspaceMember.role, "owner")).groupBy(workspaceMember.workspaceId).having(sql`count(*) = 1`);
    return (await db.select({ w: workspace }).from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(and(eq(workspaceMember.userId, userId), eq(workspaceMember.role, "owner"), live(), inArray(workspace.id, owners))).orderBy(workspace.name)).map((r) => r.w);
  },
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
  // Only the columns a PM edits can change here: name, slug, accent, logo.
  update: async (workspaceId: WorkspaceId, patch: Partial<NewWorkspace>): Promise<Workspace | null> => {
    const values = pickEditable(patch);
    if (Object.keys(values).length === 0) return (await db.select().from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null;
    return (await db.update(workspace).set(values).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null;
  },
  // The workspace a request works in, by its checked id (stories/E2-6 reads the plan from it).
  getById: async (workspaceId: WorkspaceId): Promise<Workspace | null> =>
    (await db.select().from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null,
  // The brand of a workspace for a public page (stories/E2-5): the respondent side and the logo
  // route show the name, logo and accent to people with no session. Only those three fields;
  // a non-uuid or unknown id is null, so nothing else is learned about a workspace.
  publicBrand: async (workspaceId: string): Promise<{ name: string; accentHex: string | null; logoObjectKey: string | null } | null> => {
    if (!isUuid(workspaceId)) return null;
    return (await db.select({ name: workspace.name, accentHex: workspace.accentHex, logoObjectKey: workspace.logoObjectKey })
      .from(workspace).where(and(eq(workspace.id, workspaceId), live())).limit(1))[0] ?? null;
  },
  // Switches a workspace's plan (stories/E2-6, acceptance 4): a column change, with no screen
  // until R3; the id is the session's as everywhere.
  setPlan: async (workspaceId: WorkspaceId, plan: PlanKey): Promise<Workspace | null> =>
    (await db.update(workspace).set({ plan }).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null,
  // Starts the 24-hour removal (E11-2): the workspace disappears from every read at once.
  // Who deleted it is kept for the deleted page and the removal job's email.
  markDeleted: async (workspaceId: WorkspaceId, deletedBy: string, now = new Date()): Promise<Workspace | null> =>
    (await db.update(workspace).set({ deletedAt: now, deletedBy }).where(and(eq(workspace.id, workspaceId), live())).returning())[0] ?? null,
  // An admin restores a workspace marked deleted (stories/E14-2, acceptance 3): only while the
  // row is still there, which is until the removal job runs (E11-2, within 24 hours).
  restoreDeleted: async (workspaceId: WorkspaceId): Promise<Workspace | null> =>
    (await db.update(workspace).set({ deletedAt: null, deletedBy: null }).where(and(eq(workspace.id, workspaceId), isNotNull(workspace.deletedAt))).returning())[0] ?? null,
  // Leaves a deleted workspace (stories/E11-2): the person's membership goes, so the deleted page
  // does not show again; a live workspace's membership is never touched here.
  leaveDeleted: async (userId: string, workspaceId: string): Promise<boolean> => {
    if (!isUuid(workspaceId)) return false;
    const gone = db.select({ id: workspace.id }).from(workspace).where(and(eq(workspace.id, workspaceId), isNotNull(workspace.deletedAt)));
    return (await db.delete(workspaceMember).where(and(eq(workspaceMember.userId, userId), eq(workspaceMember.workspaceId, workspaceId), inArray(workspaceMember.workspaceId, gone))).returning()).length > 0;
  },
  // A deleted workspace the user is still a member of until the removal job runs (the deleted
  // page, stories/E11-2 acceptance 2): its name, when, and the email of the owner who deleted it.
  // With no id: the first deleted workspace the user is still a member of.
  deletedForUser: async (userId: string, workspaceId: string | null): Promise<DeletedWorkspace | null> => {
    if (workspaceId !== null && !isUuid(workspaceId)) return null;
    const row = (await db.select({ id: workspace.id, name: workspace.name, deletedAt: workspace.deletedAt, deletedByEmail: user.email })
      .from(workspace).innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id)).leftJoin(user, eq(user.id, workspace.deletedBy))
      .where(and(eq(workspaceMember.userId, userId), workspaceId === null ? undefined : eq(workspace.id, workspaceId), isNotNull(workspace.deletedAt))).orderBy(workspace.deletedAt).limit(1))[0];
    return row && row.deletedAt ? { id: row.id, name: row.name, deletedAt: row.deletedAt, deletedByEmail: row.deletedByEmail } : null;
  },
};

// The AI budget is not here: internal.setAiBudgetEur, from the admin area only (decision 0036).
const EDITABLE = ["name", "slug", "accentHex", "logoObjectKey"] as const;
function pickEditable(patch: Partial<NewWorkspace>): Partial<NewWorkspace> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in patch) out[key] = (patch as Record<string, unknown>)[key];
  return out as Partial<NewWorkspace>;
}
