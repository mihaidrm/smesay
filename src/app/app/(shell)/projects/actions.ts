"use server";
// Server actions of the project pages (stories/E3-1): create, save the context, archive,
// unarchive, delete the sample; of the upload (stories/E3-2): upload a file, pick a sheet
// or a header row; and of Build (stories/E5-1), at the end of the file. The workspace comes from the session (requireWritableWorkspace);
// the project id from the form is only ever looked up inside that workspace, so another
// workspace's id is 404. Server Functions and useActionState: node_modules/next/dist/docs/
// 01-app/01-getting-started/07-mutating-data.md.
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireWritableWorkspace } from "@/lib/current-workspace";
import { NotFoundError } from "@/lib/errors";
import { createProject, deleteSample, saveContext, setArchived } from "@/lib/projects";
import { EXPORT_COPY } from "@/lib/export/copy";
import { importProject, PROJECT_FILE_MAX } from "@/lib/export/project";
import { commitUpload } from "@/lib/imports";
import { buildOnLatest, saveClosing, saveFields, saveIntro, savePerspectives, saveScoring, tagItem } from "@/lib/instruments";
import { decideAllReaders, decideReader, dismissFlag, editReader, moveItemTo, shapeSet, type ReaderMove } from "@/lib/shaping";
import { renewInvitee, revokeInvitee, sendInvites } from "@/lib/invitees";
import { remindAll, remindInvitee } from "@/lib/reminders";
import { publishLink, revokeLink, saveLink } from "@/lib/sharing";
import { readAuthEnv } from "@/lib/auth";
import { signedIn } from "@/lib/session";
import { track, wasFirst } from "@/lib/analytics";
import { GOALS, goalRequest, plausibleConfig, sendGoal } from "@/lib/plausible";
import { rechoose, saveMapping, savePaste, saveUpload, UPLOAD_COPY } from "@/lib/uploads";

// retry (E4-2): the error is worth a "Try again" button. signedOut (E11-6): the session had ended;
// the form keeps its text and shows the banner.
export type ProjectFormState = { error: string | null; saved: boolean; retry?: boolean; signedOut?: boolean };
const NONE: ProjectFormState = { error: null, saved: false };

export async function createProjectAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireWritableWorkspace("/app/projects/new");
  const result = await createProject({ ws: current.ws, userId: session.user.id }, formData.get("name"));
  if ("error" in result) return { ...NONE, error: result.error };
  await track("project_created", { from: "new" }, { workspaceId: current.ws, userId: session.user.id });
  if (plausibleConfig() && await wasFirst("project_created", current.ws)) sendGoal(GOALS.firstProject, await goalRequest("/app/projects/new"));
  revalidatePath("/app", "layout");
  redirect(`/app/projects/${result.project.id}/import`);
}

// Import a project (stories/E10-2): the file's text to importProject, then the new project's
// Results. A file over the limit is refused before it is read.
export async function importProjectAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireWritableWorkspace("/app/projects/import");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ...NONE, error: EXPORT_COPY.importErrors.noFile };
  if (file.size > PROJECT_FILE_MAX) return { ...NONE, error: EXPORT_COPY.importErrors.tooLarge };
  const result = await importProject({ ws: current.ws, userId: session.user.id }, await file.text());
  if ("error" in result) return { ...NONE, error: result.error };
  await track("project_created", { from: "import" }, { workspaceId: current.ws, userId: session.user.id });
  if (plausibleConfig() && await wasFirst("project_created", current.ws)) sendGoal(GOALS.firstProject, await goalRequest("/app/projects/import"));
  revalidatePath("/app", "layout");
  redirect(`/app/projects/${result.projectId}/results`);
}

export async function saveContextAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  if (!(await signedIn())) return { ...NONE, signedOut: true };
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
  if (!(await deleteSample(current.ws, String(formData.get("projectId") ?? "")))) notFound();
  await track("sample_deleted", {}, { workspaceId: current.ws, userId: session.user.id });
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { session, current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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
  const { current } = await requireWritableWorkspace("/app");
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


// Share (stories/E6-1): Publish creates the public link; Save changes its dates and passcode.
// The project list's status and the stepper follow the link, so the layout is revalidated.
export async function publishAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { session, current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await publishLink(current.ws, projectId, String(formData.get("instrumentId") ?? ""), formData.get("opensAt"), formData.get("closesAt"), formData.get("passcode"));
    if ("error" in result) return { ...NONE, error: result.error };
    const who = { workspaceId: current.ws, userId: session.user.id };
    await track("instrument_published", { method: result.instrument.method, layout: result.instrument.layout }, who);
    if (plausibleConfig() && await wasFirst("instrument_published", current.ws)) sendGoal(GOALS.firstPublished, await goalRequest(`/app/projects/${projectId}/share`));
    await track("invite_sent", { kind: "public", project: projectId }, who);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ...NONE, saved: true };
}

export async function saveLinkAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await saveLink(current.ws, projectId, String(formData.get("instrumentId") ?? ""), String(formData.get("inviteId") ?? ""), formData.get("opensAt"), formData.get("closesAt"), formData.get("passcode"), formData.get("removePasscode") === "1");
    if ("error" in result) return { ...NONE, error: result.error };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ...NONE, saved: true };
}

// Personal invites (stories/E6-2): the sender is the signed-in PM (the email's reply-to);
// the base URL of the links is the app's own (BETTER_AUTH_URL). The result carries one
// line per address that was not sent (acceptance 5) and the count sent.
// failed: one message per address not sent; again: those addresses as lines for the box.
export type InvitesFormState = ProjectFormState & { sent: number; failed: string[]; again: string[] };
export async function sendInvitesAction(_previous: InvitesFormState, formData: FormData): Promise<InvitesFormState> {
  const { session, current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  try {
    const result = await sendInvites(current.ws, projectId, instrumentId, formData.get("people"), { name: session.user.name ?? null, email: session.user.email }, readAuthEnv().baseURL);
    revalidatePath(`/app/projects/${projectId}/share`);
    if ("error" in result) return { ...NONE, error: result.error, sent: 0, failed: [], again: [] };
    const failed = result.outcomes.filter((o) => !o.sent);
    for (const o of result.outcomes) if (o.sent) await track("invite_sent", { kind: "personal", project: projectId }, { workspaceId: current.ws, userId: session.user.id });
    return { ...NONE, saved: true, sent: result.outcomes.length - failed.length, failed: failed.map((o) => o.error ?? ""), again: failed.map((o) => o.line) };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// Reminders (stories/E6-3): one row, or everyone who has not submitted and is due. The
// result lists the people not sent (and why) under the count.
export type RemindFormState = ProjectFormState & { sent: number; failed: string[] };
const REMIND_NONE: RemindFormState = { ...NONE, sent: 0, failed: [] };
export async function remindAction(_previous: RemindFormState, formData: FormData): Promise<RemindFormState> {
  const { session, current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  try {
    const result = await remindInvitee(current.ws, projectId, instrumentId, inviteId, { name: session.user.name ?? null, email: session.user.email }, readAuthEnv().baseURL);
    revalidatePath(`/app/projects/${projectId}/share`);
    if ("error" in result) return { ...REMIND_NONE, error: result.error };
    if (result.outcome.sent) await track("reminder_sent", {}, { workspaceId: current.ws, userId: session.user.id });
    return { ...REMIND_NONE, saved: true, sent: result.outcome.sent ? 1 : 0, failed: result.outcome.error ? [result.outcome.error] : [] };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
export async function remindAllAction(_previous: RemindFormState, formData: FormData): Promise<RemindFormState> {
  const { session, current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  try {
    const result = await remindAll(current.ws, projectId, instrumentId, { name: session.user.name ?? null, email: session.user.email }, readAuthEnv().baseURL);
    revalidatePath(`/app/projects/${projectId}/share`);
    if ("error" in result) return { ...REMIND_NONE, error: result.error };
    for (const o of result.outcomes) if (o.sent) await track("reminder_sent", {}, { workspaceId: current.ws, userId: session.user.id });
    const failed = result.outcomes.filter((o) => !o.sent);
    return { ...REMIND_NONE, saved: true, sent: result.outcomes.length - failed.length, failed: failed.map((o) => o.error ?? "") };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

// The kill switch (stories/E6-4): revoke the public link, revoke one personal link, or
// make a new personal link and send it.
export async function revokeLinkAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  try {
    const result = await revokeLink(current.ws, projectId, instrumentId, inviteId);
    revalidatePath(`/app/projects/${projectId}/share`);
    revalidatePath("/app");
    if ("error" in result) return { ...NONE, error: result.error };
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
export async function revokeInviteAction(_previous: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  const mark = String(formData.get("mark") ?? "");
  try {
    const result = await revokeInvitee(current.ws, projectId, instrumentId, inviteId, mark);
    revalidatePath(`/app/projects/${projectId}/share`);
    if ("error" in result) return { ...NONE, error: result.error };
    return { ...NONE, saved: true };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
export async function renewInviteAction(_previous: InvitesFormState, formData: FormData): Promise<InvitesFormState> {
  const { session, current } = await requireWritableWorkspace("/app");
  const projectId = String(formData.get("projectId") ?? "");
  const instrumentId = String(formData.get("instrumentId") ?? "");
  const inviteId = String(formData.get("inviteId") ?? "");
  try {
    const result = await renewInvitee(current.ws, projectId, instrumentId, inviteId, { name: session.user.name ?? null, email: session.user.email }, readAuthEnv().baseURL);
    revalidatePath(`/app/projects/${projectId}/share`);
    if ("error" in result) return { ...NONE, error: result.error, sent: 0, failed: [], again: [] };
    const o = result.outcome;
    if (o.sent) await track("invite_sent", { kind: "personal", project: projectId }, { workspaceId: current.ws, userId: session.user.id });
    return { ...NONE, saved: true, sent: o.sent ? 1 : 0, failed: o.error ? [o.error] : [], again: o.sent ? [] : [o.line] };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
