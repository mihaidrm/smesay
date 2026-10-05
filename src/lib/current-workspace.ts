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
import { track } from "@/lib/analytics";
import { chooseWorkspace } from "@/lib/workspace-choice";
import { viewingOf, type Viewing } from "@/lib/view-as";

export type Current = { workspace: Workspace; ws: WorkspaceId };
// deleted: a workspace the person is still a member of was deleted (stories/E11-2), the stored
// one first; the app shows the deleted page (/app/deleted) until they leave it, which ends their
// membership of it, instead of choosing another without a word.
// viewing: an admin's read-only view of this workspace (stories/E14-4, src/lib/view-as.ts); the
// workspace is then the only one listed and the current one, and nothing may be written.
export type AppContext = { session: Session; memberships: Workspace[]; current: Current | null; storedId: string | null; deleted: DeletedWorkspace | null; viewing: Viewing | null };

export const getAppContext = cache(async (nextPath: string): Promise<AppContext> => {
  const session = await requireSession(nextPath);
  const viewing = await viewingOf(session);
  if (viewing) return { session, memberships: [viewing.workspace], current: { workspace: viewing.workspace, ws: viewing.ws }, storedId: session.session.currentWorkspaceId ?? null, deleted: null, viewing };
  // An open invitation for the signed-in address becomes a membership first (stories/E2-4).
  const joined: string[] = [];
  await acceptPendingInvites(session.user.id, session.user.email, INVITE_VALID_MINUTES, joined);
  // member_joined (stories/E13-1), once per membership the invitation just made; the id is the
  // workspace the person is now a member of, checked as every other one.
  // A workspace deleted in between is skipped: the event is never worth failing the page.
  for (const id of joined) {
    const ws = await requireWorkspace(await headers(), id).catch(() => null);
    if (ws) await track("member_joined", {}, { workspaceId: ws, userId: session.user.id });
  }
  const memberships = await workspaces.listForUser(session.user.id);
  const storedId = session.session.currentWorkspaceId ?? null;
  const deleted = (storedId !== null && !memberships.some((w) => w.id === storedId) ? await workspaces.deletedForUser(session.user.id, storedId) : null) ?? await workspaces.deletedForUser(session.user.id, null);
  const choice = chooseWorkspace(memberships, storedId);
  let current: Current | null = null;
  if (!deleted && (choice.kind === "current" || choice.kind === "select")) {
    const ws = await requireWorkspace(await headers(), choice.workspace.id);
    if (choice.kind === "select") await setCurrentWorkspace(session, ws);
    current = { workspace: choice.workspace, ws };
  }
  return { session, memberships, current, storedId, deleted, viewing: null };
});

// The shell and every page in it: no membership goes to the create page, memberships without
// a current workspace (several on a fresh session, or the current one removed) to the chooser.
export async function requireCurrentWorkspace(nextPath: string): Promise<AppContext & { current: Current }> {
  const context = await getAppContext(nextPath);
  if (context.current) return { ...context, current: context.current };
  if (context.deleted) redirect("/app/deleted");
  redirect(context.memberships.length === 0 ? "/app/new" : "/app/switch");
}

// The one helper every server action and every writing route takes its workspace from (stories/
// E14-4, acceptance 2): requireCurrentWorkspace, except that during an admin's view it answers
// with the view-only page instead (/app/view-only: "You are viewing as [WORKSPACE]. Changes are
// off."), so no write runs. src/app/app/view-only.test.ts checks every server action file uses it.
export async function requireWritableWorkspace(nextPath: string): Promise<AppContext & { current: Current }> {
  const context = await requireCurrentWorkspace(nextPath);
  if (context.viewing) redirect("/app/view-only");
  return context;
}

// For the actions that work without a current workspace (create, switch, leave a deleted one):
// refused the same way during a view.
export async function refuseWhileViewing(session: Session): Promise<void> {
  if (await viewingOf(session)) redirect("/app/view-only");
}

export async function setCurrentWorkspace(session: Session, ws: WorkspaceId | null): Promise<void> {
  const context = await auth.$context;
  await context.internalAdapter.updateSession(session.session.token, { currentWorkspaceId: ws });
}
