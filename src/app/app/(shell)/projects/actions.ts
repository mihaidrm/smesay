"use server";
// Server actions of the project pages (stories/E3-1): create, save the context, archive,
// unarchive, delete the sample; of the upload (stories/E3-2): upload a file, pick a sheet
// or a header row; and of Build (stories/E5-1), at the end of the file. The workspace comes from the session (requireCurrentWorkspace);
// the project id from the form is only ever looked up inside that workspace, so another
// workspace's id is 404. Server Functions and useActionState: node_modules/next/dist/docs/
// 01-app/01-getting-started/07-mutating-data.md.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { NotFoundError } from "@/lib/errors";
import { createProject, deleteSample, saveContext, setArchived } from "@/lib/projects";
import { commitUpload } from "@/lib/imports";
import { buildOnLatest, saveClosing, saveFields, saveIntro, savePerspectives, saveScoring, tagItem } from "@/lib/instruments";
import { decideAllReaders, decideReader, dismissFlag, editReader, moveItemTo, shapeSet, type ReaderMove } from "@/lib/shaping";
import { rechoose, saveMapping, savePaste, saveUpload, UPLOAD_COPY } from "@/lib/uploads";

// retry (E4-2): the error is worth a "Try again" button.
export type ProjectFormState = { error: string | null; saved: boolean; retry?: boolean };
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
  // A literal path takes no type (node_modules/next/dist/docs/01-app/03-api-reference/
  // 04-functions/revalidatePath.md: "If path is a literal path like /product/1, omit type").
  revalidatePath(`/app/projects/${projectId}/import`);
  revalidatePath("/app");
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
    revalidatePath(`/app/projects/${result.upload.projectId}/import`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function chooseAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const uploadId = String(formData.get("uploadId") ?? "");
  const sheet = formData.has("sheet") ? String(formData.get("sheet")) : undefined;
  // 0 is "no header row"; anything that is not a whole number is treated as "find it again".
  const headerRow = formData.has("headerRow") ? (Number.isInteger(Number(formData.get("headerRow"))) ? Number(formData.get("headerRow")) : null) : undefined;
  try {
    const result = await rechoose(current.ws, uploadId, { sheet, headerRow });
    if ("error" in result) return { ...NONE, error: result.error };
    // The path comes from the row, not the form (E3-3 audit, finding 10).
    revalidatePath(`/app/projects/${result.upload.projectId}/import`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// The mapping card (stories/E3-3): every select of the card is in the form, named by the
// column key; the server cleans the set (src/lib/import/mapping.ts) and saves it.
export async function mapAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const uploadId = String(formData.get("uploadId") ?? "");
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) if (key.startsWith("col:")) raw[key.slice(4)] = value;
  try {
    const result = await saveMapping(current.ws, uploadId, raw);
    revalidatePath(`/app/projects/${result.upload.projectId}/import`);
    return { ...NONE, error: result.error, saved: result.error === null };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// The paste box (stories/E3-4): the text goes through the same checks and store as a file.
export async function pasteAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await savePaste({ ws: current.ws, userId: session.user.id }, projectId, String(formData.get("text") ?? ""));
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${result.upload.projectId}/import`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// The import commit (stories/E3-5, acceptance 3 and 5): the check runs again on the server,
// the set is written in one transaction, and the Import page re-renders with the stepper on
// Shape.
export async function commitAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const uploadId = String(formData.get("uploadId") ?? "");
  try {
    const result = await commitUpload(current.ws, uploadId, session.user.id);
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${result.set.projectId}`, "layout");
    revalidatePath("/app");
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// Shape (stories/E4-2): run the model over the latest set; move one item to another area.
// ForbiddenError (a member without the right) is thrown as the 403 page, like the others.
export async function shapeAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await shapeSet({ ws: current.ws, userId: session.user.id }, projectId);
    if ("error" in result) return { ...NONE, error: result.error, retry: result.retry };
    revalidatePath(`/app/projects/${projectId}`, "layout");
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function moveAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  try {
    const result = await moveItemTo({ ws: current.ws, userId: session.user.id }, projectId, itemId, formData.get("area"));
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${projectId}/shape`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// Reader versions (stories/E4-3): one item's Accept, Reject or Undo; an edit; Accept all or
// Reject all over the latest set.
export async function readerAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const move = String(formData.get("move") ?? "");
  if (move !== "accept" && move !== "reject" && move !== "undo") notFound();
  try {
    const result = await decideReader({ ws: current.ws, userId: session.user.id }, projectId, String(formData.get("itemId") ?? ""), move as ReaderMove);
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${projectId}/shape`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function editReaderAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await editReader({ ws: current.ws, userId: session.user.id }, projectId, String(formData.get("itemId") ?? ""), formData.get("text"));
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${projectId}/shape`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function readerAllAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const move = String(formData.get("move") ?? "");
  if (move !== "accept" && move !== "reject") notFound();
  try {
    const result = await decideAllReaders({ ws: current.ws, userId: session.user.id }, projectId, move);
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${projectId}/shape`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// Flags (stories/E4-4): dismiss one item's flags.
export async function dismissFlagAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await dismissFlag({ ws: current.ws, userId: session.user.id }, projectId, String(formData.get("itemId") ?? ""));
    if ("error" in result) return { ...NONE, error: result.error };
    revalidatePath(`/app/projects/${projectId}/shape`);
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// Build (stories/E5-1): the intro card, the fields card and "Build on version N". The
// instrument id from the form is looked up inside the workspace and checked against the
// project (src/lib/instruments.ts), so neither id can reach another workspace's rows.
export async function saveIntroAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveIntro(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("title"), formData.get("intro"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/build`);
  return { ...NONE, saved: true };
}

export async function saveFieldsAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveFields(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("fields"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/build`);
  return { ...NONE, saved: true };
}

export async function buildOnLatestAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await buildOnLatest(current.ws, projectId, String(formData.get("instrumentId") ?? ""));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  // The stepper in the project layout and the Build page both change: the route pattern with
  // "layout" (revalidatePath.md: a dynamic segment takes the pattern and the type).
  revalidatePath("/app/projects/[projectId]", "layout");
  return { ...NONE, saved: true };
}

export async function saveScoringAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveScoring(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("method"), formData.get("showProposed"), formData.get("labels"), formData.get("layout"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/build`);
  return { ...NONE, saved: true };
}

export async function saveClosingAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveClosing(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("closingQuestion"), formData.get("missingForm"), formData.get("signOffText"), formData.get("confidence"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/build`);
  return { ...NONE, saved: true };
}

export async function savePerspectivesAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await savePerspectives(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("perspectives"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/build`);
  revalidatePath(`/app/projects/${projectId}/shape`);
  return { ...NONE, saved: true };
}

// The chips on an item on Shape (stories/E5-4): the whole list of the item's tags.
export async function tagItemAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireCurrentWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await tagItem(current.ws, projectId, String(formData.get("itemId") ?? ""), formData.get("tags"));
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath(`/app/projects/${projectId}/shape`);
  revalidatePath(`/app/projects/${projectId}/build`);
  return { ...NONE, saved: true };
}

