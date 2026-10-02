// Membership helpers (stories/E1-3). Keyed by (workspace_id, user_id); the role check for
// owner-only actions is E2-4's.
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMember } from "@/db/schema";
import type { MemberRole } from "@/db/types";

export type Member = typeof workspaceMember.$inferSelect;

export const members = {
  list: async (workspaceId: string): Promise<Member[]> =>
    db.select().from(workspaceMember).where(eq(workspaceMember.workspaceId, workspaceId)).orderBy(workspaceMember.createdAt),
  get: async (workspaceId: string, userId: string): Promise<Member | null> =>
    (await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId))).limit(1))[0] ?? null,
  add: async (workspaceId: string, userId: string, role: MemberRole): Promise<Member> =>
    (await db.insert(workspaceMember).values({ workspaceId, userId, role }).returning())[0],
  setRole: async (workspaceId: string, userId: string, role: MemberRole): Promise<Member | null> =>
    (await db.update(workspaceMember).set({ role }).where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId))).returning())[0] ?? null,
  remove: async (workspaceId: string, userId: string): Promise<Member | null> =>
    (await db.delete(workspaceMember).where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId))).returning())[0] ?? null,
};
