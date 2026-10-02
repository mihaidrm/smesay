// The workspace a signed-in request works in (stories/E2-3, acceptance 3 to 5). It is read from
// the session row (session.current_workspace_id, src/lib/auth.ts) and checked against the
// person's memberships on every request, so switching changes every list on the next request
// and a membership that was removed drops out at once. The WorkspaceId the helpers take still
// comes only from requireWorkspace() (src/lib/workspace.ts). cache() keeps one lookup per
// request when the layout and the page both ask (react.dev/reference/react/cache). Writing the
// field uses the session adapter better-auth's own organization plugin uses for its active
// organization (node_modules/better-auth/dist/plugins/organization/adapter.mjs,
// internalAdapter.updateSession; auth.$context: node_modules/better-auth/dist/types/auth.d.mts).
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { workspaces } from "@/db/queries";
import type { Workspace } from "@/db/queries/workspaces";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { requireSession, type Session } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace";

export type Current = { workspace: Workspace; ws: WorkspaceId };
export type AppContext = { session: Session; memberships: Workspace[]; current: Current | null; storedId: string | null };

export const getAppContext = cache(async (nextPath: string): Promise<AppContext> => {
  const session = await requireSession(nextPath);
  const memberships = await workspaces.listForUser(session.user.id);
  const storedId = session.session.currentWorkspaceId ?? null;
  const stored = storedId ? memberships.find((w) => w.id === storedId) : undefined;
  const current = stored ? { workspace: stored, ws: await requireWorkspace(await headers(), stored.id) } : null;
  return { session, memberships, current, storedId };
});

// The shell and every page in it: no membership goes to the create page, a membership without
// a current workspace (first visit after an invite, or the current one removed) to the switcher.
export async function requireCurrentWorkspace(nextPath: string): Promise<AppContext & { current: Current }> {
  const context = await getAppContext(nextPath);
  if (context.current) return { ...context, current: context.current };
  redirect(context.memberships.length === 0 ? "/app/new" : "/app/switch");
}

export async function setCurrentWorkspace(session: Session, ws: WorkspaceId): Promise<void> {
  const context = await auth.$context;
  await context.internalAdapter.updateSession(session.session.token, { currentWorkspaceId: ws });
}
