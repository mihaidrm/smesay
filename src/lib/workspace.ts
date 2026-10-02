// The workspace id every helper is called with comes from here (CLAUDE.md, Data and security;
// stories/E1-3, acceptance 2). requireWorkspace() checks the signed-in user's membership and
// returns the id; a workspace the user is not a member of, or that does not exist, is 404.
// Reading the session is better-auth's `auth.api.getSession({ headers })`
// (better-auth.com/docs/integrations/next, "How to handle auth checks in each page/route").
import { auth } from "@/lib/auth";
import { NotFoundError, SignedOutError } from "@/lib/errors";
import { workspaces } from "@/db/queries/workspaces";

export async function requireWorkspace(userId: string | null, workspaceId: string): Promise<string> {
  if (!userId) throw new SignedOutError();
  const found = await workspaces.getForUser(userId, workspaceId);
  if (!found) throw new NotFoundError("This workspace does not exist, or you are not a member of it.");
  return found.id;
}

export async function requireWorkspaceFromRequest(headers: Headers, workspaceId: string): Promise<string> {
  const session = await auth.api.getSession({ headers });
  return requireWorkspace(session?.user.id ?? null, workspaceId);
}
