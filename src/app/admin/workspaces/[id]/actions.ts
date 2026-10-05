"use server";
// The support actions on a workspace (stories/E14-2, acceptances 3 and 4). Each one runs the
// admin check, finds the workspace by the id in the form (src/db/queries/admin.ts
// adminWorkspace) and checks the form's input (a plan from the list, a whole number, ids that
// are uuids, a note's length): a malformed form is not an action and writes no row. Everything
// that depends on the workspace's state is decided inside audited() (E14-1: the row first, the
// outcome after), so a refusal there is recorded as refused: the plan or budget it already has,
// a workspace marked deleted, a restore of a live one. The action itself is the product's own
// helper: the plan (workspaces.setPlan, E2-6), the AI budget (internal.setAiBudgetEur,
// decision 0036), the invitation (src/lib/members.ts resendInvite, the product's sender and
// limit), the kill switch (src/lib/sharing.ts revokeLink, E6-4, whose own refusals hold), the
// restore (workspaces.restoreDeleted, E11-2) and the note. A workspace marked deleted takes
// only the restore, the budget and a note, as a PM can do nothing in one. Copy: docs/copy/
// app.md, Admin workspace page; refusals in docs/copy/errors.md, Admin. Server Functions:
// node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md.
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { workspaces } from "@/db/queries";
import { AI_BUDGET_MAX_EUR, NOTE_MAX, adminNotes, adminWorkspace, audited, setAiBudget } from "@/db/queries/admin";
import type { AdminProof, PlanKey } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { NotFoundError } from "@/lib/errors";
import { log } from "@/lib/log";
import { resendInvite } from "@/lib/members";
import { PLANS } from "@/lib/plans";
import { revokeLink } from "@/lib/sharing";
import type { AdminActionState } from "../../confirm-form";

type Result = { error: string } | { ok: true };
const ok = { ok: true as const };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function target(formData: FormData) {
  const { proof } = await requireAdmin();
  const found = await adminWorkspace(proof, text(formData, "workspaceId"));
  return { proof, found };
}

// The workspace as it is now, read inside the action, for the checks that depend on it.
async function fresh(proof: AdminProof, id: string) {
  return (await adminWorkspace(proof, id))?.workspace ?? null;
}

// A throw from the action (its row reads failed) is logged with the workspace id and comes back
// as one line.
async function attempt(workspaceId: string, run: () => Promise<AdminActionState>): Promise<AdminActionState> {
  try {
    const state = await run();
    if (state.done) revalidatePath(`/admin/workspaces/${workspaceId}`);
    return state;
  } catch (error) {
    log("error", "admin:workspace action failed.", { workspace: workspaceId, error: error instanceof Error ? error.message : String(error) });
    return { error: C.failed, done: null };
  }
}

const answer = (result: Result, done: string): AdminActionState => ("error" in result ? { error: result.error, done: null } : { error: null, done });

export async function changePlanAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const plan = text(formData, "plan");
  if (!Object.hasOwn(PLANS, plan)) return { error: C.badPlan, done: null };
  const id = found.workspace.id;
  return attempt(id, async () => answer(await audited(proof, { action: "plan_changed", targetWorkspaceId: id, changes: { from: found.workspace.plan, to: plan } }, async (): Promise<Result> => {
    const now = await fresh(proof, id);
    if (!now) return { error: C.missing };
    if (now.deletedAt) return { error: C.deletedNoChange };
    if (now.plan === plan) return { error: C.samePlan };
    return (await workspaces.setPlan(found.ws, plan as PlanKey)) ? ok : { error: C.deletedNoChange };
  }), C.planDone(plan as PlanKey)));
}

export async function setBudgetAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const raw = text(formData, "budget");
  const eur = /^\d{1,6}$/.test(raw) ? Number(raw) : Number.NaN;
  if (!Number.isInteger(eur) || eur > AI_BUDGET_MAX_EUR) return { error: C.badBudget, done: null };
  const id = found.workspace.id;
  return attempt(id, async () => answer(await audited(proof, { action: "ai_budget_set", targetWorkspaceId: id, changes: { from: found.workspace.aiBudgetEur, to: eur } }, async (): Promise<Result> => {
    const now = await fresh(proof, id);
    if (!now) return { error: C.missing };
    if (now.aiBudgetEur === eur) return { error: C.sameBudget };
    return (await setAiBudget(proof, found.ws, eur)) ? ok : { error: C.missing };
  }), C.budgetDone(eur)));
}

export async function resendInviteAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const inviteId = text(formData, "inviteId");
  if (!UUID.test(inviteId)) return { error: C.gone, done: null };
  const requestHeaders = await headers();
  const id = found.workspace.id;
  let email = "";
  return attempt(id, async () => answer(await audited(proof, { action: "invite_resent", targetWorkspaceId: id, changes: { invite: inviteId } }, async (): Promise<Result> => {
    if ((await fresh(proof, id))?.deletedAt !== null) return { error: C.deletedNoChange };
    const result = await resendInvite(found.ws, inviteId, requestHeaders);
    if ("error" in result) return result;
    email = result.email;
    return ok;
  }), C.resent(email)));
}

export async function revokeLinkAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const [projectId, instrumentId, inviteId] = ["projectId", "instrumentId", "inviteId"].map((k) => text(formData, k));
  if (![projectId, instrumentId, inviteId].every((v) => UUID.test(v))) return { error: C.gone, done: null };
  const id = found.workspace.id;
  return attempt(id, async () => answer(await audited(proof, { action: "link_revoked", targetWorkspaceId: id, changes: { project: projectId, instrument: instrumentId, invite: inviteId } }, async (): Promise<Result> => {
    if ((await fresh(proof, id))?.deletedAt !== null) return { error: C.deletedNoChange };
    try {
      const result = await revokeLink(found.ws, projectId, instrumentId, inviteId);
      return "error" in result ? result : ok;
    } catch (error) {
      // The project or instrument is not this workspace's (or no longer exists): a refusal.
      if (error instanceof NotFoundError) return { error: C.gone };
      throw error;
    }
  }), C.revoked));
}

export async function restoreAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const id = found.workspace.id;
  return attempt(id, async () => answer(await audited(proof, { action: "workspace_restored", targetWorkspaceId: id }, async (): Promise<Result> =>
    (await workspaces.restoreDeleted(found.ws)) ? ok : { error: C.notDeleted }), C.restored));
}

export async function addNoteAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const note = text(formData, "note");
  if (!note) return { error: C.emptyNote, done: null };
  if (note.length > NOTE_MAX) return { error: C.longNote, done: null };
  const id = found.workspace.id;
  // The note's text stays out of the audit row (E14-1: ids and fixed values only).
  return attempt(id, async () => {
    await audited(proof, { action: "note_added", targetWorkspaceId: id, changes: { characters: note.length } }, () => adminNotes.add(proof, found.ws, proof.userId, note));
    return { error: null, done: C.noted };
  });
}
