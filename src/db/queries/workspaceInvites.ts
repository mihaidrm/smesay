// Workspace-scoped helpers for the workspace_invite table (stories/E2-4): the pending
// invitations of a workspace. Every call takes the workspace id first; see scoped.ts for the
// rule. The acceptance on the invitee's side, which runs by email before any workspace is
// known, is acceptPendingInvites() in onboarding.ts.
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { workspaceInvite } from "@/db/schema";
import type { MemberRole, WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type WorkspaceInvite = typeof workspaceInvite.$inferSelect;

export const workspaceInvites = {
  ...scoped(workspaceInvite),
  // One row per address: the old invitation (open, expired or accepted) goes and the new one
  // comes in the same transaction, so two invites to one address at once cannot collide on the
  // unique index. The address is stored in lower case.
  replace: async (workspaceId: WorkspaceId, data: { email: string; role: MemberRole; invitedBy: string | null }): Promise<WorkspaceInvite> =>
    db.transaction(async (tx) => {
      const email = data.email.toLowerCase();
      await tx.delete(workspaceInvite).where(and(eq(workspaceInvite.workspaceId, workspaceId), eq(workspaceInvite.email, email)));
      return (await tx.insert(workspaceInvite).values({ workspaceId, email, role: data.role, invitedBy: data.invitedBy }).returning())[0];
    }),
  // How many invitations this workspace sent in the last minutes (the invite limit).
  countSince: async (workspaceId: WorkspaceId, minutes: number): Promise<number> =>
    (await db.select({ n: count() }).from(workspaceInvite)
      .where(and(eq(workspaceInvite.workspaceId, workspaceId), gt(workspaceInvite.invitedAt, new Date(Date.now() - minutes * 60 * 1000)))))[0].n,
};
