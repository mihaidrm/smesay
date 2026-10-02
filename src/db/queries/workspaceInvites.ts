// Workspace-scoped helpers for the workspace_invite table (stories/E2-4): the pending
// invitations of a workspace. Every call takes the workspace id first; see scoped.ts for the
// rule. The acceptance on the invitee's side, which runs by email before any workspace is
// known, is acceptPendingInvites() in onboarding.ts.
import { workspaceInvite } from "@/db/schema";
import { scoped } from "./scoped";

export type WorkspaceInvite = typeof workspaceInvite.$inferSelect;
export const workspaceInvites = scoped(workspaceInvite);
