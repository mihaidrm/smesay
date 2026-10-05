"use server";
// Start and stop an admin's view of a workspace (stories/E14-4, acceptances 1, 3 and 4). Both
// run the admin check and write an audit row through src/lib/view-as.ts. Starting sends the
// admin to the PM app (/app), which then serves the workspace read-only; stopping sends them
// back to the workspace's admin page. redirect() runs after the audited work, never inside it
// (design note 85). Server Functions: node_modules/next/dist/docs/01-app/01-getting-started/
// 07-mutating-data.md.
import { redirect } from "next/navigation";
import { adminWorkspace } from "@/db/queries/admin";
import { requireAdmin } from "@/lib/admin";
import { startView, stopView, viewFields } from "@/lib/view-as";
import { VIEW_AS_COPY } from "@/lib/view-as-copy";
import type { AdminActionState } from "../confirm-form";

export async function startViewAction(_previous: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { session, proof } = await requireAdmin();
  const found = await adminWorkspace(proof, String(formData.get("workspaceId") ?? ""));
  if (!found) return { error: "This workspace no longer exists. Go back to the list.", done: null };
  if (found.workspace.deletedAt) return { error: VIEW_AS_COPY.notDeleted, done: null };
  await startView(proof, session, found.ws);
  redirect("/app");
}

export async function stopViewAction(): Promise<void> {
  const { session, proof } = await requireAdmin();
  const id = viewFields(session).workspaceId;
  await stopView(proof, session);
  redirect(id ? `/admin/workspaces/${id}` : "/admin/workspaces");
}
