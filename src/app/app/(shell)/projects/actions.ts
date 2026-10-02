"use server";
// Server actions of the project pages (stories/E3-1): create, save the context, archive,
// unarchive, delete the sample; and of the upload (stories/E3-2): upload a file, pick a sheet
// or a header row. The workspace comes from the session (requireCurrentWorkspace);
// the project id from the form is only ever looked up inside that workspace, so another
// workspace's id is 404. Server Functions and useActionState: node_modules/next/dist/docs/
// 01-app/01-getting-started/07-mutating-data.md.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { NotFoundError } from "@/lib/errors";
import { createProject, deleteSample, saveContext, setArchived } from "@/lib/projects";
import { rechoose, saveUpload, UPLOAD_COPY } from "@/lib/uploads";

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

// The file comes as a File in the form data (developer.mozilla.org/docs/Web/API/FormData/get);
// an empty file input is a File of size 0, so Upload without a file gets its own message. A
// connection that drops mid-upload never reaches the action: the rejected call goes to the
// segment's error page (node_modules/next/dist/docs/01-app/01-getting-started/
// 10-error-handling.md, "Uncaught exceptions"), and nothing is stored. The checks and the
// store are in src/lib/uploads.ts.
export async function uploadAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ...NONE, error: UPLOAD_COPY.noFile };
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const result = await saveUpload({ ws: current.ws, userId: session.user.id }, projectId, { name: file.name, bytes });
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/import`);
  return { ...NONE, saved: true };
}

export async function chooseAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const uploadId = String(formData.get("uploadId") ?? "");
  const sheet = formData.has("sheet") ? String(formData.get("sheet")) : undefined;
  // 0 is "no header row"; anything that is not a whole number is treated as "find it again".
  const headerRow = formData.has("headerRow") ? (Number.isInteger(Number(formData.get("headerRow"))) ? Number(formData.get("headerRow")) : null) : undefined;
  try {
    const result = await rechoose(current.ws, uploadId, { sheet, headerRow });
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/import`);
  return { ...NONE, saved: true };
}
