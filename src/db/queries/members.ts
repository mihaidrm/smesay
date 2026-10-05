// Membership helpers (stories/E1-3). Keyed by (workspace_id, user_id); the workspace id is the
// session's (WorkspaceId), so a member of A cannot list, change or remove B's members. The role
// check for owner-only actions is E2-4's.
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { user, workspaceMember } from "@/db/schema";
import type { MemberRole } from "@/db/types";
import type { WorkspaceId } from "./scoped";

export type Member = typeof workspaceMember.$inferSelect;
export type MemberWithUser = Member & { name: string; email: string };
export type KeepOwner = { ok: true; row: Member } | { ok: false; reason: "missing" | "last-owner" };

const oneRow = (workspaceId: WorkspaceId, userId: string) => and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId));

export const members = {
  list: async (workspaceId: WorkspaceId): Promise<Member[]> =>
    db.select().from(workspaceMember).where(eq(workspaceMember.workspaceId, workspaceId)).orderBy(workspaceMember.createdAt),
  // The Members list (stories/E2-4, acceptance 1): each membership with the person's name and
  // email from better-auth's user table, oldest first.
  listWithUsers: async (workspaceId: WorkspaceId): Promise<MemberWithUser[]> =>
    (await db.select({ m: workspaceMember, name: user.name, email: user.email }).from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId)).where(eq(workspaceMember.workspaceId, workspaceId)).orderBy(workspaceMember.createdAt))
      .map((r) => ({ ...r.m, name: r.name, email: r.email })),
  countOwners: async (workspaceId: WorkspaceId): Promise<number> =>
    (await db.select({ n: count() }).from(workspaceMember).where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.role, "owner"))))[0].n,
  get: async (workspaceId: WorkspaceId, userId: string): Promise<Member | null> =>
    (await db.select().from(workspaceMember).where(oneRow(workspaceId, userId)).limit(1))[0] ?? null,
  add: async (workspaceId: WorkspaceId, userId: string, role: MemberRole): Promise<Member> =>
    (await db.insert(workspaceMember).values({ workspaceId, userId, role }).returning())[0],
  // The quickstart's first showing (stories/E12-2, acceptance 1): stamps quickstart_seen_at
  // when it is still null, so only the first call wins; true when this call was the first.
  markQuickstartSeen: async (workspaceId: WorkspaceId, userId: string, now: Date): Promise<boolean> =>
    (await db.update(workspaceMember).set({ quickstartSeenAt: now })
      .where(and(oneRow(workspaceId, userId), isNull(workspaceMember.quickstartSeenAt))).returning({ userId: workspaceMember.userId })).length > 0,
  // Removal and role change that keep at least one owner (stories/E2-4, acceptance 4), in one
  // transaction with the workspace's member rows locked (select ... for update,
  // orm.drizzle.team/docs/rqb#select-for-update is the query builder's `.for("update")`,
  // node_modules/drizzle-orm/pg-core/query-builders/select.d.ts), so two owners demoting each
  // other at once cannot leave none. "missing" when the person is not a member any more.
  removeKeepingOwner: async (workspaceId: WorkspaceId, userId: string): Promise<KeepOwner> =>
    db.transaction(async (tx) => {
      const rows = await tx.select().from(workspaceMember).where(eq(workspaceMember.workspaceId, workspaceId)).for("update");
      const target = rows.find((m) => m.userId === userId);
      if (!target) return { ok: false, reason: "missing" };
      if (target.role === "owner" && rows.filter((m) => m.role === "owner").length <= 1) return { ok: false, reason: "last-owner" };
      await tx.delete(workspaceMember).where(oneRow(workspaceId, userId));
      return { ok: true, row: target };
    }),
  setRoleKeepingOwner: async (workspaceId: WorkspaceId, userId: string, role: MemberRole): Promise<KeepOwner> =>
    db.transaction(async (tx) => {
      const rows = await tx.select().from(workspaceMember).where(eq(workspaceMember.workspaceId, workspaceId)).for("update");
      const target = rows.find((m) => m.userId === userId);
      if (!target) return { ok: false, reason: "missing" };
      if (target.role === "owner" && role === "member" && rows.filter((m) => m.role === "owner").length <= 1) return { ok: false, reason: "last-owner" };
      const [row] = await tx.update(workspaceMember).set({ role }).where(oneRow(workspaceId, userId)).returning();
      return { ok: true, row };
    }),
  setRole: async (workspaceId: WorkspaceId, userId: string, role: MemberRole): Promise<Member | null> =>
    (await db.update(workspaceMember).set({ role }).where(oneRow(workspaceId, userId)).returning())[0] ?? null,
  remove: async (workspaceId: WorkspaceId, userId: string): Promise<Member | null> =>
    (await db.delete(workspaceMember).where(oneRow(workspaceId, userId)).returning())[0] ?? null,
};
