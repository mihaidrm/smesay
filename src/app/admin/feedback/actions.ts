"use server";
// The feedback inbox's actions (stories/E17-1, acceptance 6): Mark solved, Reopen, Remove,
// each inside audited() with the report's workspace as the target and the report's id in the
// changes; the text never enters the audit row. Copy: src/lib/admin-copy.ts.
import { revalidatePath } from "next/cache";
import { audited, feedbackReport, removeFeedback, setFeedbackStatus } from "@/db/queries/admin";
import type { AdminProof } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { FEEDBACK_ADMIN_COPY as C } from "@/lib/admin-copy";
import { log } from "@/lib/log";
import type { AdminActionState } from "../confirm-form";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function target(formData: FormData) {
  const { proof } = await requireAdmin();
  const found = await feedbackReport(proof, text(formData, "id"));
  return { proof, found };
}

async function attempt(run: () => Promise<AdminActionState>): Promise<AdminActionState> {
  try {
    const state = await run();
    if (state.done) revalidatePath("/admin/feedback");
    return state;
  } catch (error) {
    log("error", "admin:feedback action failed.", { error: error instanceof Error ? error.message : String(error) });
    return { error: C.failed, done: null };
  }
}

async function setStatus(proof: AdminProof, found: NonNullable<Awaited<ReturnType<typeof feedbackReport>>>, status: "open" | "solved"): Promise<AdminActionState> {
  if (found.status === status) return { error: C.same, done: null };
  const action = status === "solved" ? "feedback_solved" : "feedback_reopened";
  const done = await audited(proof, { action, targetWorkspaceId: found.ws, changes: { feedback: found.id } }, () => setFeedbackStatus(proof, found.id, status, proof.userId));
  if (!done) return { error: C.missing, done: null };
  return { error: null, done: status === "solved" ? C.solved : C.reopened };
}

export async function solveAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  return attempt(() => setStatus(proof, found, "solved"));
}

export async function reopenAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  return attempt(() => setStatus(proof, found, "open"));
}

export async function removeAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { proof, found } = await target(formData);
  if (!found) return { error: C.missing, done: null };
  return attempt(async () => {
    const done = await audited(proof, { action: "feedback_removed", targetWorkspaceId: found.ws, changes: { feedback: found.id } }, () => removeFeedback(proof, found.id));
    if (!done) return { error: C.missing, done: null };
    return { error: null, done: C.removed };
  });
}
