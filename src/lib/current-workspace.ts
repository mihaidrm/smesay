// The workspace a signed-in request works in (stories/E2-3, acceptance 3 to 5). It is read from
// the session row (session.current_workspace_id, src/lib/auth.ts) and checked against the
// person's memberships on every request (src/lib/workspace-choice.ts), so switching changes
// every list on the next request and a membership that was removed drops out at once. The
// WorkspaceId the helpers take still comes only from requireWorkspace() (src/lib/workspace.ts),
// which reads the session again; one extra session read per request. cache() keeps one lookup
// per request when the layout and the page both ask (react.dev/reference/react/cache). Writing
// the field uses the session adapter better-auth's own organization plugin uses for its active
// organization (node_modules/better-auth/dist/plugins/organization/adapter.mjs,
// internalAdapter.updateSession; auth.$context: node_modules/better-auth/dist/types/auth.d.mts).
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { workspaces } from "@/db/queries";
import { acceptPendingInvites } from "@/db/queries/onboarding";
import { INVITE_VALID_MINUTES } from "@/lib/invites";
import type { DeletedWorkspace, Workspace } from "@/db/queries/workspaces";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { requireSession, type Session } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace";
import { chooseWorkspace } from "@/lib/workspace-choice";

export type Current = { workspace: Workspace; ws: WorkspaceId };
// deleted: the stored workspace was deleted (stories/E11-2) and the person was in it; the app
// shows the deleted page (/app/deleted) until they leave it, instead of choosing another.
export type AppContext = { session: Session; memberships: Workspace[]; current: Current | null; storedId: string | null; deleted: DeletedWorkspace | null };

export const getAppContext = cache(async (nextPath: string): Promise<AppContext> => {
  const session = await requireSession(nextPath);
  // An open invitation for the signed-in address becomes a membership first (stories/E2-4).
  await acceptPendingInvites(session.user.id, session.user.email, INVITE_VALID_MINUTES);
  const memberships = await workspaces.listForUser(session.user.id);
  const storedId = session.session.currentWorkspaceId ?? null;
  const deleted = storedId !== null && !memberships.some((w) => w.id === storedId) ? await workspaces.deletedForUser(session.user.id, storedId) : null;
  const choice = chooseWorkspace(memberships, storedId);
  let current: Current | null = null;
  if (!deleted && (choice.kind === "current" || choice.kind === "select")) {
    const ws = await requireWorkspace(await headers(), choice.workspace.id);
    if (choice.kind === "select") await setCurrentWorkspace(session, ws);
    current = { workspace: choice.workspace, ws };
  }
  return { session, memberships, current, storedId, deleted };
});

// The shell and every page in it: no membership goes to the create page, memberships without
// a current workspace (several on a fresh session, or the current one removed) to the chooser.
export async function requireCurrentWorkspace(nextPath: string): Promise<AppContext & { current: Current }> {
  const context = await getAppContext(nextPath);
  if (context.current) return { ...context, current: context.current };
  if (context.deleted) redirect("/app/deleted");
  redirect(context.memberships.length === 0 ? "/app/new" : "/app/switch");
}

export async function setCurrentWorkspace(session: Session, ws: WorkspaceId | null): Promise<void> {
  const context = await auth.$context;
  await context.internalAdapter.updateSession(session.session.token, { currentWorkspaceId: ws });
}
