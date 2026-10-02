// Membership helpers (stories/E1-3). Keyed by (workspace_id, user_id); the workspace id is the
// session's (WorkspaceId), so a member of A cannot list, change or remove B's members. The role
// check for owner-only actions is E2-4's.
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMember } from "@/db/schema";
import type { MemberRole } from "@/db/types";
import type { WorkspaceId } from "./scoped";

export type Member = typeof workspaceMember.$inferSelect;

const oneRow = (workspaceId: WorkspaceId, userId: string) => and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId));

export const members = {
  list: async (workspaceId: WorkspaceId): Promise<Member[]> =>
    db.select().from(workspaceMember).where(eq(workspaceMember.workspaceId, workspaceId)).orderBy(workspaceMember.createdAt),
  get: async (workspaceId: WorkspaceId, userId: string): Promise<Member | null> =>
    (await db.select().from(workspaceMember).where(oneRow(workspaceId, userId)).limit(1))[0] ?? null,
  add: async (workspaceId: WorkspaceId, userId: string, role: MemberRole): Promise<Member> =>
    (await db.insert(workspaceMember).values({ workspaceId, userId, role }).returning())[0],
  setRole: async (workspaceId: WorkspaceId, userId: string, role: MemberRole): Promise<Member | null> =>
    (await db.update(workspaceMember).set({ role }).where(oneRow(workspaceId, userId)).returning())[0] ?? null,
  remove: async (workspaceId: WorkspaceId, userId: string): Promise<Member | null> =>
    (await db.delete(workspaceMember).where(oneRow(workspaceId, userId)).returning())[0] ?? null,
};
