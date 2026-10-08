// The workspace id every helper is called with comes from here (CLAUDE.md, Data and security;
// stories/E1-3, acceptance 2). requireWorkspace(headers, workspaceId) reads the session with
// readSession(headers) (src/lib/session.ts, over better-auth's `auth.api.getSession({ headers })`,
// better-auth.com/docs/integrations/next, "How to handle auth checks in each page/route"), checks the user's membership and returns a
// WorkspaceId, the branded type the helpers take; nothing else produces one for a request. A
// workspace the user is not a member of, or that does not exist, or an id that is not a uuid, is
// 404, so a workspace's existence is never leaked. The membership check itself is
// requireWorkspaceForUser in src/db/queries/internal.ts, which only this file and src/db may
// import (eslint-rules/db-access.mjs); nothing here re-exports it.
import { readSession } from "@/lib/session";
import { requireWorkspaceForUser } from "@/db/queries/internal";
import type { WorkspaceId } from "@/db/types";

export async function requireWorkspace(headers: Headers, workspaceId: string): Promise<WorkspaceId> {
  const session = await readSession(headers);
  return requireWorkspaceForUser(session?.user.id ?? null, workspaceId);
}
