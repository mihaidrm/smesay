// Membership actions (stories/E2-4): invite, remove, change a role. Each takes the WorkspaceId
// from requireWorkspace() and the actor's user id from the session, reads the actor's own
// membership and refuses with 403 when can() says no (src/lib/permissions.ts), so the server
// refuses whatever the UI showed. An invite is a better-auth magic link sent to the address
// through the server API (auth.api.signInMagicLink, node_modules/better-auth/dist/plugins/
// magic-link/index.d.mts; E2-1's email) plus an open workspace_invite row, which the invitee's
// first signed-in request turns into a membership (acceptPendingInvites in
// src/db/queries/onboarding.ts). The server API bypasses better-auth's own rate limiter (it runs
// in the request handler only, node_modules/better-auth/dist/api/index.mjs), so the workspace's
// own limit applies here (src/lib/invites.ts). Inviting again replaces the row and sends a new
// link; if the email cannot be sent the row goes again. Removal and role changes keep at least
// one owner inside one locked transaction (src/db/queries/members.ts). Messages: src/lib/
// members-copy.ts, from docs/copy/errors.md.
import { z } from "zod";
import { members, workspaceInvites } from "@/db/queries";
import type { MemberWithUser } from "@/db/queries/members";
import type { WorkspaceInvite } from "@/db/queries/workspaceInvites";
import type { MemberRole, WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { INVITE_LIMIT, INVITE_LIMIT_MINUTES, INVITE_VALID_MINUTES } from "@/lib/invites";
import { MEMBERS_COPY } from "@/lib/members-copy";
import { can, type Action } from "@/lib/permissions";

// headers: the request's, which the endpoint requires (requireHeaders); the tests pass none.
export type Actor = { ws: WorkspaceId; userId: string; headers?: Headers };
export type Refused = { error: string };

export async function requireRole(actor: Actor, action: Action): Promise<MemberRole> {
  const membership = await members.get(actor.ws, actor.userId);
  if (!membership) throw new NotFoundError();
  if (!can(membership.role, action)) throw new ForbiddenError();
  return membership.role;
}

export function isOpenInvite(invite: WorkspaceInvite, now = Date.now()): boolean {
  return invite.acceptedAt === null && invite.invitedAt.getTime() > now - INVITE_VALID_MINUTES * 60 * 1000;
}

// The Members list: memberships, then the open invitations as "Invited" rows.
export async function listMembersAndInvites(ws: WorkspaceId): Promise<{ members: MemberWithUser[]; invited: WorkspaceInvite[] }> {
  const [rows, invites] = await Promise.all([members.listWithUsers(ws), workspaceInvites.list(ws)]);
  return { members: rows, invited: invites.filter((i) => isOpenInvite(i)).sort((a, b) => a.invitedAt.getTime() - b.invitedAt.getTime()) };
}

export async function inviteMember(actor: Actor, rawEmail: unknown): Promise<Refused | { sent: true; email: string }> {
  await requireRole(actor, "members.invite");
  const text = String(rawEmail ?? "").trim();
  if (!text) return { error: MEMBERS_COPY.emptyAddress };
  const parsed = z.email().safeParse(text.toLowerCase());
  if (!parsed.success) return { error: MEMBERS_COPY.badAddress(text) };
  const email = parsed.data;
  if ((await members.listWithUsers(actor.ws)).some((m) => m.email.toLowerCase() === email)) return { error: MEMBERS_COPY.alreadyMember(email) };
  if ((await workspaceInvites.countSince(actor.ws, INVITE_LIMIT_MINUTES)) >= INVITE_LIMIT) return { error: MEMBERS_COPY.tooMany };
  const row = await workspaceInvites.replace(actor.ws, { email, role: "member", invitedBy: actor.userId });
  try {
    await auth.api.signInMagicLink({ headers: actor.headers ?? new Headers(), body: { email, callbackURL: "/app", errorCallbackURL: "/sign-in/link-used" } });
  } catch {
    await workspaceInvites.remove(actor.ws, row.id);
    return { error: MEMBERS_COPY.notSent(email) };
  }
  return { sent: true, email };
}

export async function removeMember(actor: Actor, userId: string): Promise<Refused | { removed: true }> {
  await requireRole(actor, "members.remove");
  const result = await members.removeKeepingOwner(actor.ws, userId);
  if (!result.ok) return { error: result.reason === "missing" ? MEMBERS_COPY.gone : MEMBERS_COPY.lastOwner };
  return { removed: true };
}

export async function setMemberRole(actor: Actor, userId: string, rawRole: unknown): Promise<Refused | { role: MemberRole }> {
  await requireRole(actor, "members.role");
  const role = z.enum(["owner", "member"]).safeParse(rawRole);
  if (!role.success) throw new NotFoundError();
  const result = await members.setRoleKeepingOwner(actor.ws, userId, role.data);
  if (!result.ok) return { error: result.reason === "missing" ? MEMBERS_COPY.gone : MEMBERS_COPY.lastOwner };
  return { role: role.data };
}
