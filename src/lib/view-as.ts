// An admin's read-only view of a workspace as its owner sees it (stories/E14-4). The view lives
// on the admin's session row (view_as_workspace_id, view_as_until: src/db/auth-schema.ts), set
// only by startView (the admin's View as action) and read by getAppContext
// (src/lib/current-workspace.ts), which then serves that workspace. It counts only while the
// session's email is still an admin's and the 60 minutes have not run out; an expired view is
// cleared on the next request and recorded as stopped. Writes are refused through one helper,
// requireWritableWorkspace (src/lib/current-workspace.ts). Starting and stopping write audit rows
// (E14-1). The session field is written as currentWorkspaceId is (internalAdapter.updateSession,
// node_modules/better-auth/dist/db/internal-adapter.mjs).
import { adminWorkspace, audited } from "@/db/queries/admin";
import type { Workspace } from "@/db/queries/workspaces";
import type { AdminProof, WorkspaceId } from "@/db/types";
import { adminProofFor } from "@/lib/admin";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/session";

export const VIEW_MINUTES = 60;

export type Viewing = { workspace: Workspace; ws: WorkspaceId; until: Date };

type ViewFields = { viewAsWorkspaceId?: string | null; viewAsUntil?: Date | string | null };
// The view fields of a session as better-auth reads them (the one reader).
export const viewFields = (session: Session): { workspaceId: string | null; until: Date | null } => {
  const f = session.session as typeof session.session & ViewFields;
  return { workspaceId: f.viewAsWorkspaceId ?? null, until: f.viewAsUntil ? new Date(f.viewAsUntil) : null };
};

const CLEAR = { viewAsWorkspaceId: null, viewAsUntil: null };
async function setFields(session: Session, value: { viewAsWorkspaceId: string | null; viewAsUntil: Date | null }): Promise<void> {
  await (await auth.$context).internalAdapter.updateSession(session.session.token, value);
}

// The view in force for this session, or null. An expired view, or one whose workspace is gone
// or marked deleted, is ended with a view_stopped row (written first, then the fields cleared,
// E14-1). One held by an email that is no longer an admin's is cleared with no row: there is no
// admin to record it under. Two requests at the moment of expiry may each write a stop row.
export async function viewingOf(session: Session, now = new Date()): Promise<Viewing | null> {
  const { workspaceId: id, until } = viewFields(session);
  if (!id) return null;
  const proof = adminProofFor(session);
  if (!proof) { await setFields(session, CLEAR); return null; }
  const found = await adminWorkspace(proof, id);
  if (found && !found.workspace.deletedAt && until && until > now) return { workspace: found.workspace, ws: found.ws, until };
  await audited(proof, { action: "view_stopped", targetWorkspaceId: id, changes: { reason: until && until <= now ? "expired" : "ended" } }, () => setFields(session, CLEAR));
  return null;
}

// Starts a view for the admin's session (E14-4 acceptance 1): a view already held is stopped
// first, so every start has its stop; then the row, then the fields.
export async function startView(proof: AdminProof, session: Session, ws: WorkspaceId, now = new Date()): Promise<Date> {
  await stopView(proof, session, now);
  const until = new Date(now.getTime() + VIEW_MINUTES * 60_000);
  await audited(proof, { action: "view_started", targetWorkspaceId: ws, changes: { minutes: VIEW_MINUTES } }, () => setFields(session, { viewAsWorkspaceId: ws, viewAsUntil: until }));
  return until;
}

// Stops the view the session holds, if any (the banner's Stop viewing, or a new start); a view
// already past its 60 minutes is recorded as expired.
export async function stopView(proof: AdminProof, session: Session, now = new Date()): Promise<void> {
  const { workspaceId: id, until } = viewFields(session);
  if (!id) return;
  await audited(proof, { action: "view_stopped", targetWorkspaceId: id, changes: { reason: until && until <= now ? "expired" : "stopped" } }, () => setFields(session, CLEAR));
}
