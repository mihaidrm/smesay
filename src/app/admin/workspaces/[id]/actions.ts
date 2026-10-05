"use server";
// The support actions on a workspace (stories/E14-2, acceptances 3 and 4). Each one runs the
// admin check, finds the workspace by the id in the form (src/db/queries/admin.ts
// adminWorkspace), checks its input on the server, then runs through audited(), which writes the
// audit row first and the outcome after (E14-1), and through the product's own helper: the plan
// (workspaces.setPlan, E2-6), the AI budget (internal.setAiBudgetEur, decision 0036), the
// invitation (src/lib/members.ts resendInvite, the product's sender and limit), the kill switch
// (src/lib/sharing.ts revokeLink, E6-4), the restore (workspaces.restoreDeleted, E11-2) and the
// note. A refusal comes back as form state (useActionState). Copy: docs/copy/app.md, Admin
// workspace page. Server Functions: node_modules/next/dist/docs/01-app/01-getting-started/
// 07-mutating-data.md.
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { workspaces } from "@/db/queries";
import { AI_BUDGET_MAX_EUR, NOTE_MAX, adminNotes, adminWorkspace, audited, setAiBudget } from "@/db/queries/admin";
import type { PlanKey } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { WORKSPACE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { NotFoundError } from "@/lib/errors";
import { log } from "@/lib/log";
import { PLANS } from "@/lib/plans";
import { resendInvite } from "@/lib/members";
import { revokeLink } from "@/lib/sharing";

export type AdminActionState = { error: string | null; done: string | null };
type Result = { error: string } | { ok: true };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function target(formData: FormData) {
  const { proof } = await requireAdmin();
  const found = await adminWorkspace(proof, text(formData, "workspaceId"));
  return { proof, found };
}

// A throw from the action (its row reads failed) comes back as one line; it is logged with
// the workspace id.
async function attempt(workspaceId: string, run: () => Promise<AdminActionState>): Promise<AdminActionState> {
  try {
    const state = await run();
    if (state.done) revalidatePath(`/admin/workspaces/${workspaceId}`);
    return state;
  } catch (error) {
    if (error instanceof NotFoundError) return { error: C.gone, done: null };
    log("error", "admin:workspace action failed.", { workspace: workspaceId, error: error instanceof Error ? error.message : String(error) });
    return { error: C.failed, done: null };
  }
}

export async function changePlanAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const plan = text(formData, "plan");
  if (!Object.hasOwn(PLANS, plan)) return { error: C.badPlan, done: null };
  const from = found.workspace.plan;
  if (plan === from) return { error: C.samePlan, done: null };
  return attempt(found.workspace.id, async () => {
    const result = await audited(proof, { action: "plan_changed", targetWorkspaceId: found.workspace.id, changes: { from, to: plan } }, async (): Promise<Result> =>
      (await workspaces.setPlan(found.ws, plan as PlanKey)) ? { ok: true as const } : { error: C.deletedNoChange });
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.planDone(plan as PlanKey) };
  });
}

export async function setBudgetAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const raw = text(formData, "budget");
  const eur = /^\d{1,6}$/.test(raw) ? Number(raw) : Number.NaN;
  if (!Number.isInteger(eur) || eur > AI_BUDGET_MAX_EUR) return { error: C.badBudget, done: null };
  const from = found.workspace.aiBudgetEur;
  if (eur === from) return { error: C.sameBudget, done: null };
  return attempt(found.workspace.id, async () => {
    const result = await audited(proof, { action: "ai_budget_set", targetWorkspaceId: found.workspace.id, changes: { from, to: eur } }, async (): Promise<Result> =>
      (await setAiBudget(proof, found.ws, eur)) ? { ok: true as const } : { error: C.gone });
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.budgetDone(eur) };
  });
}

export async function resendInviteAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const inviteId = text(formData, "inviteId").slice(0, 40);
  const requestHeaders = await headers();
  return attempt(found.workspace.id, async () => {
    const result = await audited(proof, { action: "invite_resent", targetWorkspaceId: found.workspace.id, changes: { invite: inviteId } }, () => resendInvite(found.ws, inviteId, requestHeaders));
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.resent(result.email) };
  });
}

export async function revokeLinkAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const [projectId, instrumentId, inviteId] = ["projectId", "instrumentId", "inviteId"].map((k) => text(formData, k).slice(0, 40));
  return attempt(found.workspace.id, async () => {
    const result = await audited(proof, { action: "link_revoked", targetWorkspaceId: found.workspace.id, changes: { project: projectId, instrument: instrumentId, invite: inviteId } }, () => revokeLink(found.ws, projectId, instrumentId, inviteId));
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.revoked };
  });
}

export async function restoreAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  if (!found.workspace.deletedAt) return { error: C.notDeleted, done: null };
  return attempt(found.workspace.id, async () => {
    const result = await audited(proof, { action: "workspace_restored", targetWorkspaceId: found.workspace.id }, async (): Promise<Result> =>
      (await workspaces.restoreDeleted(found.ws)) ? { ok: true as const } : { error: C.notDeleted });
    return "error" in result ? { error: result.error, done: null } : { error: null, done: C.restored };
  });
}

export async function addNoteAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  const note = text(formData, "note");
  if (!note) return { error: C.emptyNote, done: null };
  if (note.length > NOTE_MAX) return { error: C.longNote, done: null };
  return attempt(found.workspace.id, async () => {
    // The note's text stays out of the audit row (E14-1: ids and fixed values only).
    await audited(proof, { action: "note_added", targetWorkspaceId: found.workspace.id, changes: { characters: note.length } }, () => adminNotes.add(proof, found.ws, proof.userId, note));
    return { error: null, done: C.noted };
  });
}
