// What an admin can do to a person's account (stories/E14-3, acceptance 3), through
// better-auth's own adapter so its tables stay consistent: internalAdapter.deleteUserSessions
// ends every session, internalAdapter.deleteUser removes the sessions, the accounts and the user
// row (node_modules/better-auth/dist/db/internal-adapter.mjs; auth.$context:
// node_modules/better-auth/dist/types/auth.d.mts). The user row's removal carries the schema's
// own rules: memberships go (cascade), created_by, invited_by, deleted_by and the events' user id
// go null, and everything in the workspaces stays. Respondents are not users, so their names on
// sign-off records stay as they gave them.
import { workspaces } from "@/db/queries";
import { PEOPLE_ADMIN_COPY } from "@/lib/admin-copy";
import { auth } from "@/lib/auth";

export type Refused = { error: string };

// A user agent as its browser and system family, never the raw string (acceptance 4). The order
// matters: Edge and Opera carry "Chrome", Chrome carries "Safari", iOS carries "Mac OS X".
export function userAgentFamily(ua: string | null | undefined): { browser: string; os: string } {
  const s = ua ?? "";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\/|Opera/.test(s) ? "Opera" : /Firefox\/|FxiOS/.test(s) ? "Firefox" : /Chrome\/|CriOS/.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "Other";
  const os = /iPhone|iPad|iPod/.test(s) ? "iOS" : /Android/.test(s) ? "Android" : /Windows/.test(s) ? "Windows" : /Mac OS X|Macintosh/.test(s) ? "macOS" : /Linux|X11/.test(s) ? "Linux" : "Other";
  return { browser, os };
}

// Ends every session of the person; the number ended comes back for the audit row.
export async function signOutEverywhere(userId: string): Promise<number> {
  const ctx = await auth.$context;
  const n = (await ctx.internalAdapter.listSessions(userId)).length;
  await ctx.internalAdapter.deleteUserSessions(userId);
  return n;
}

// The live workspaces where the person is the only owner: deleting the account would leave
// them with none (the rule src/lib/members.ts keeps for removals).
export async function lastOwnerOf(userId: string): Promise<string[]> {
  return (await workspaces.soleOwnedBy(userId)).map((w) => w.name);
}

// Deletes the account at the person's request (acceptance 3), refused while it is a workspace's
// only owner: someone else becomes owner first, or the owner deletes the workspace (E11-2).
export async function deleteAccount(userId: string): Promise<Refused | { deleted: true }> {
  const sole = await lastOwnerOf(userId);
  if (sole.length > 0) return { error: PEOPLE_ADMIN_COPY.soleOwner(sole) };
  await (await auth.$context).internalAdapter.deleteUser(userId);
  return { deleted: true };
}
