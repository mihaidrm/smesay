"use server";
// The actions on a person (stories/E14-3, acceptance 3). Each runs the admin check, finds the
// person by the id in the form (a missing person or workspace is a malformed form and writes no
// row), then runs through audited() (the row first, the outcome after,
// E14-1) and the product's own code: the sign-in link is better-auth's sender
// (auth.api.signInMagicLink, the link works once and expires in 15 minutes, E2-1), the sign-out
// and the deletion go through better-auth's adapter (src/lib/accounts.ts), and the removal
// through src/lib/members.ts, which keeps the last owner. Copy: docs/copy/app.md, Admin person
// page; refusals in docs/copy/errors.md, Admin.
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminPerson, adminWorkspace, audited } from "@/db/queries/admin";
import { deleteAccount, signOutEverywhere } from "@/lib/accounts";
import { requireAdmin } from "@/lib/admin";
import { PEOPLE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { auth } from "@/lib/auth";
import { log } from "@/lib/log";
import { removeMemberAsAdmin } from "@/lib/members";
import type { AdminActionState } from "../../confirm-form";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function target(formData: FormData) {
  const { proof } = await requireAdmin();
  const person = await adminPerson(proof, text(formData, "userId"));
  return { proof, person };
}

// The page is read again after a change, except after a deletion, where it would turn into the
// 404 under the admin's done line.
async function attempt(userId: string, run: () => Promise<AdminActionState>, reload = true): Promise<AdminActionState> {
  try {
    const state = await run();
    if (state.done && reload) revalidatePath(`/admin/people/${userId}`);
    return state;
  } catch (error) {
    log("error", "admin:person action failed.", { detail: userId, error: error instanceof Error ? error.message : String(error) });
    return { error: C.failed, done: null };
  }
}

export async function sendLinkAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, person } = await target(formData);
  if (!person) return { error: C.missing, done: null };
  const requestHeaders = await headers();
  return attempt(person.id, async () => {
    const result = await audited(proof, { action: "magic_link_sent", targetUserId: person.id }, async (): Promise<{ error: string } | { ok: true }> => {
      try {
        await auth.api.signInMagicLink({ headers: requestHeaders, body: { email: person.email, callbackURL: "/app", errorCallbackURL: "/sign-in/link-used" } });
        return { ok: true };
      } catch {
        return { error: C.notSent };
      }
    });
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.linkSent(person.email) };
  });
}

export async function signOutAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, person } = await target(formData);
  if (!person) return { error: C.missing, done: null };
  return attempt(person.id, async () => {
    const n = await audited(proof, { action: "signed_out_everywhere", targetUserId: person.id, changes: { open: person.openSessions } }, () => signOutEverywhere(person.id));
    return { error: null, done: C.signedOut(n) };
  });
}

export async function removeAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, person } = await target(formData);
  if (!person) return { error: C.missing, done: null };
  const found = await adminWorkspace(proof, text(formData, "workspaceId"));
  if (!found) return { error: C.notMember, done: null };
  const role = person.workspaces.find((w) => w.id === found.workspace.id)?.role ?? null;
  // Whether the person is a member is the workspace's state, so it is decided inside the action
  // (removeMemberAsAdmin refuses a non-member) and recorded as refused.
  return attempt(person.id, async () => {
    const result = await audited(proof, { action: "member_removed", targetUserId: person.id, targetWorkspaceId: found.workspace.id, changes: { role } }, () => removeMemberAsAdmin(found.ws, person.id));
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.removed(found.workspace.name) };
  });
}

export async function deleteAccountAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, person } = await target(formData);
  if (!person) return { error: C.missing, done: null };
  if (person.id === proof.userId) return { error: C.self, done: null };
  return attempt(person.id, async () => {
    const result = await audited(proof, { action: "account_deleted", targetUserId: person.id, changes: { workspaces: person.workspaces.length } }, () => deleteAccount(person.id));
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.deleted };
  }, false);
}
