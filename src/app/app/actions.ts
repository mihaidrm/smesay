"use server";
// Server actions of the workspace step (stories/E2-3, acceptance 1, 3 and 4). Every input is
// validated here, not only in the form (CLAUDE.md, PM side): the name on the server, the
// "no membership yet" rule on the server, and a workspace id that is not one of the person's
// memberships is 404 (requireWorkspace), never a switch. Server Functions and useActionState:
// node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md; redirect() throws,
// so it is called outside the try block (node_modules/next/dist/docs/01-app/03-api-reference/
// 04-functions/redirect.md).
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { setCurrentWorkspace } from "@/lib/current-workspace";
import { requireSession } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace";
import { slugFromName, workspaceNameSchema, WORKSPACE_NAME_ERROR } from "@/lib/workspace-name";

export type CreateWorkspaceState = { error: string | null };

export async function createWorkspace(_previous: CreateWorkspaceState, formData: FormData): Promise<CreateWorkspaceState> {
  const session = await requireSession("/app/new");
  if ((await workspaces.listForUser(session.user.id)).length > 0) redirect("/app");
  const parsed = workspaceNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: WORKSPACE_NAME_ERROR };
  const name = parsed.data;
  const created = await createWorkspaceWithSample({ name, slug: slugFromName(name) }, session.user.id);
  const ws = await requireWorkspace(await headers(), created.id);
  await setCurrentWorkspace(session, ws);
  redirect("/app");
}

export async function switchWorkspace(formData: FormData): Promise<void> {
  const session = await requireSession("/app/switch");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  let ws: WorkspaceId;
  try {
    ws = await requireWorkspace(await headers(), workspaceId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  await setCurrentWorkspace(session, ws);
  redirect("/app");
}
