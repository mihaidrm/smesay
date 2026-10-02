// The workspace id every helper is called with comes from here (CLAUDE.md, Data and security;
// stories/E1-3, acceptance 2). requireWorkspace(headers, workspaceId) reads the session with
// better-auth's `auth.api.getSession({ headers })` (better-auth.com/docs/integrations/next, "How
// to handle auth checks in each page/route"), checks the user's membership and returns a
// WorkspaceId, the branded type the helpers take; nothing else produces one for a request. A
// workspace the user is not a member of, or that does not exist, or an id that is not a uuid, is
// 404, so a workspace's existence is never leaked. requireWorkspaceForUser is the same check
// for a user id the caller already trusts: the tests under src/db; lint refuses the import
// anywhere else (eslint-rules/db-access.mjs).
import { auth } from "@/lib/auth";
import { NotFoundError, SignedOutError } from "@/lib/errors";
import { workspaces } from "@/db/queries/workspaces";
import type { WorkspaceId } from "@/db/types";

export async function requireWorkspaceForUser(userId: string | null, workspaceId: string): Promise<WorkspaceId> {
  if (!userId) throw new SignedOutError();
  const found = await workspaces.getForUser(userId, workspaceId);
  if (!found) throw new NotFoundError("This workspace does not exist, or you are not a member of it. Check the address, or go to your projects.");
  return found.id as WorkspaceId;
}

export async function requireWorkspace(headers: Headers, workspaceId: string): Promise<WorkspaceId> {
  const session = await auth.api.getSession({ headers });
  return requireWorkspaceForUser(session?.user.id ?? null, workspaceId);
}
