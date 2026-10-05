// What an admin can do to a person's account (stories/E14-3, acceptance 3), through
// better-auth's own adapter so its tables stay consistent: internalAdapter.deleteUserSessions
// ends every session, internalAdapter.deleteUser removes the sessions, the accounts and the user
// row (node_modules/better-auth/dist/db/internal-adapter.mjs; auth.$context:
// node_modules/better-auth/dist/types/auth.d.mts). Before the user row goes, the address is
// forgotten where it has no foreign key: the workspace invitations to it, accepted or not, and
// the sign-in links not yet used (src/db/queries/admin.ts forgetEmail). The user row's removal
// then carries the schema's own rules: memberships, sessions and accounts go (cascade); every
// column that names who made something (created_by, invited_by, imported_by, closed_by,
// made_by, deleted_by) and the events' user id go null; everything in the workspaces stays.
// Respondents are not users, so their names on sign-off records stay as they gave them. Each
// function takes the AdminProof (src/lib/admin.ts): only the admin area can call them.
import { members } from "@/db/queries";
import { assertAdmin, forgetEmail, soleOwnedBy } from "@/db/queries/admin";
import type { AdminProof, WorkspaceId } from "@/db/types";
import { PEOPLE_ADMIN_COPY } from "@/lib/admin-copy";
import { auth } from "@/lib/auth";
import { MEMBERS_COPY } from "@/lib/members-copy";

export type Refused = { error: string };

// A user agent as its browser and system family, never the raw string (acceptance 4). The order
// matters: Edge and Opera carry "Chrome", Chrome carries "Safari", iOS carries "Mac OS X". An
// iPad asking for the desktop site says Macintosh and reads as macOS.
export function userAgentFamily(ua: string | null | undefined): { browser: string; os: string } {
  const s = ua ?? "";
  const browser = /Edg\/|EdgiOS\/|EdgA\//.test(s) ? "Edge" : /OPR\/|Opera/.test(s) ? "Opera" : /Firefox\/|FxiOS/.test(s) ? "Firefox" : /Chrome\/|CriOS/.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "Other";
  const os = /iPhone|iPad|iPod/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Windows/.test(s) ? "Windows" : /Mac OS X|Macintosh/.test(s) ? "macOS" : /Linux|X11/.test(s) ? "Linux" : "Other";
  return { browser, os };
}

// Ends every session of the person; the number of sessions that were still open comes back for
// the done line, so it matches the page's count.
export async function signOutEverywhere(proof: AdminProof, userId: string, now = new Date()): Promise<number> {
  assertAdmin(proof);
  const ctx = await auth.$context;
  const open = (await ctx.internalAdapter.listSessions(userId)).filter((s) => new Date(s.expiresAt) > now).length;
  await ctx.internalAdapter.deleteUserSessions(userId);
  return open;
}

// Removes the person from a workspace (acceptance 3): no role check (the admin is not a member),
// the same last-owner rule and messages a PM meets (src/lib/members.ts removeMember).
export async function removeMemberAsAdmin(proof: AdminProof, ws: WorkspaceId, userId: string): Promise<Refused | { removed: true }> {
  assertAdmin(proof);
  const result = await members.removeKeepingOwner(ws, userId);
  if (!result.ok) return { error: result.reason === "missing" ? MEMBERS_COPY.gone : MEMBERS_COPY.lastOwner };
  return { removed: true };
}

// Deletes the account at the person's request (acceptance 3), refused while it is the only owner
// of a workspace, deleted ones waiting for removal included (a restore must not bring one back
// with no owner).
export async function deleteAccount(proof: AdminProof, userId: string, email: string): Promise<Refused | { deleted: true }> {
  const sole = await soleOwnedBy(proof, userId);
  if (sole.length > 0) return { error: PEOPLE_ADMIN_COPY.soleOwner(sole.map((w) => w.name)) };
  await forgetEmail(proof, email);
  await (await auth.$context).internalAdapter.deleteUser(userId);
  return { deleted: true };
}
