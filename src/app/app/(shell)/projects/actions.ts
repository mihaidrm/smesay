"use server";
// Server actions of the project pages (stories/E3-1): create, save the context, archive,
// unarchive, delete the sample. The workspace comes from the session (requireCurrentWorkspace);
// the project id from the form is only ever looked up inside that workspace, so another
// workspace's id is 404. Server Functions and useActionState: node_modules/next/dist/docs/
// 01-app/01-getting-started/07-mutating-data.md.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { NotFoundError } from "@/lib/errors";
import { createProject, deleteSample, saveContext, setArchived } from "@/lib/projects";

export type ProjectFormState = { error: string | null; saved: boolean };
const NONE: ProjectFormState = { error: null, saved: false };

export async function createProjectAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app/projects/new");
  const result = await createProject({ ws: current.ws, userId: session.user.id }, formData.get("name"));
  if ("error" in result) return { ...NONE, error: result.error };
  revalidatePath("/app", "layout");
  redirect(`/app/projects/${result.project.id}/import`);
}

export async function saveContextAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveContext(current.ws, projectId, formData.get("goal"), formData.get("terms"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}`, "layout");
  return { ...NONE, saved: true };
}

export async function archiveAction(formData: FormData): Promise<void> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const archived = formData.get("archived") === "1";
  try {
    await setArchived(current.ws, projectId, archived);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath("/app", "layout");
  redirect(archived ? "/app" : `/app/projects/${projectId}/import`);
}

export async function deleteSampleAction(formData: FormData): Promise<void> {
  const { current } = await requireCurrentWorkspace("/app");
  if (!(await deleteSample(current.ws, String(formData.get("projectId") ?? "")))) notFound();
  revalidatePath("/app", "layout");
  redirect("/app");
}
