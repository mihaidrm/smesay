"use server";
// Server actions of the workspace step (stories/E2-3, acceptance 1, 3 and 4). Every input is
// validated here, not only in the form (CLAUDE.md, PM side). A workspace id that is not one of
// the person's memberships is 404 (requireWorkspace), never a switch. Server actions and
// useActionState: node_modules/next/dist/docs/01-app/01-getting-started/10-updating-data.md;
// redirect() throws, so it is called outside the try block.
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { setCurrentWorkspace } from "@/lib/current-workspace";
import { requireSession } from "@/lib/session";
import { requireWorkspace } from "@/lib/workspace";
import { slugFromName, workspaceNameSchema, WORKSPACE_NAME_ERROR } from "@/lib/workspace-name";

export type CreateWorkspaceState = { error: string | null };

// Postgres reports a taken slug as unique_violation, SQLSTATE 23505
// (postgresql.org/docs/current/errcodes-appendix.html); the next try adds a 4 character suffix.
// Drizzle wraps the driver's error in its own ("Failed query"), with the PostgresError as
// `cause` (node_modules/drizzle-orm/errors.js, DrizzleQueryError), so the chain is walked.
function isUniqueViolation(error: unknown): boolean {
  for (let e = error, depth = 0; typeof e === "object" && e !== null && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

export async function createWorkspace(_previous: CreateWorkspaceState, formData: FormData): Promise<CreateWorkspaceState> {
  const session = await requireSession("/app/new");
  const parsed = workspaceNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: WORKSPACE_NAME_ERROR };
  const name = parsed.data;
  const base = slugFromName(name);
  let created: { id: string } | null = null;
  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    try {
      created = await createWorkspaceWithSample({ name, slug }, session.user.id);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  const ws = await requireWorkspace(await headers(), created!.id);
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
