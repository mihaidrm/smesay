// Membership actions (stories/E2-4): invite, remove, change a role. Each takes the WorkspaceId
// from requireWorkspace() and the actor's user id from the session, reads the actor's own
// membership and refuses with 403 when can() says no (src/lib/permissions.ts), so the server
// refuses whatever the UI showed. An invite is a better-auth magic link sent to the address
// through the server API (auth.api.signInMagicLink, node_modules/better-auth/dist/plugins/
// magic-link/index.d.mts; E2-1's email) plus an open workspace_invite row, which the invitee's
// first signed-in request turns into a membership (acceptPendingInvites in
// src/db/queries/onboarding.ts). Inviting again replaces the row and sends a new link. Messages
// come from docs/copy/errors.md.
import { z } from "zod";
import { members, workspaceInvites } from "@/db/queries";
import type { MemberWithUser } from "@/db/queries/members";
import type { WorkspaceInvite } from "@/db/queries/workspaceInvites";
import { INVITE_VALID_MINUTES } from "@/lib/invites";
import type { MemberRole, WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { can, type Action } from "@/lib/permissions";

// headers: the request's, so better-auth's rate limiter sees the real client; the tests pass none.
export type Actor = { ws: WorkspaceId; userId: string; headers?: Headers };
export type Refused = { error: string };

export const MEMBERS_COPY = {
  alreadyMember: (email: string) => `${email} is already a member of this workspace.`,
  badAddress: (text: string) => `${text || "This"} is not an email address. Check it and try again.`,
  lastOwner: "This workspace needs at least one owner. Make someone else an owner first.",
  sent: `Invite sent. They get a sign-in link that works once and expires in ${INVITE_VALID_MINUTES} minutes.`,
};

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
  const parsed = z.email().safeParse(String(rawEmail ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: MEMBERS_COPY.badAddress(String(rawEmail ?? "").trim()) };
  const email = parsed.data;
  if ((await members.listWithUsers(actor.ws)).some((m) => m.email.toLowerCase() === email)) return { error: MEMBERS_COPY.alreadyMember(email) };
  for (const old of (await workspaceInvites.list(actor.ws)).filter((i) => i.email.toLowerCase() === email)) await workspaceInvites.remove(actor.ws, old.id);
  await workspaceInvites.create(actor.ws, { email, role: "member", invitedBy: actor.userId });
  await auth.api.signInMagicLink({ headers: actor.headers ?? new Headers(), body: { email, callbackURL: "/app", errorCallbackURL: "/sign-in/link-used" } });
  return { sent: true, email };
}

export async function removeMember(actor: Actor, userId: string): Promise<Refused | { removed: true }> {
  await requireRole(actor, "members.remove");
  const target = await members.get(actor.ws, userId);
  if (!target) throw new NotFoundError();
  if (target.role === "owner" && (await members.countOwners(actor.ws)) <= 1) return { error: MEMBERS_COPY.lastOwner };
  await members.remove(actor.ws, userId);
  return { removed: true };
}

export async function setMemberRole(actor: Actor, userId: string, rawRole: unknown): Promise<Refused | { role: MemberRole }> {
  await requireRole(actor, "members.role");
  const role = z.enum(["owner", "member"]).safeParse(rawRole);
  if (!role.success) throw new NotFoundError();
  const target = await members.get(actor.ws, userId);
  if (!target) throw new NotFoundError();
  if (target.role === "owner" && role.data === "member" && (await members.countOwners(actor.ws)) <= 1) return { error: MEMBERS_COPY.lastOwner };
  await members.setRole(actor.ws, userId, role.data);
  return { role: role.data };
}
