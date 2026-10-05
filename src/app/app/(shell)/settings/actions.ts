"use server";
// Server actions of the Members section (stories/E2-4). Each one takes the workspace from the
// session (requireCurrentWorkspace) and the actor from it, then calls src/lib/members.ts, which
// checks the role on the server and refuses with 403; a refusal or a message comes back as
// form state (useActionState), never as library text. Server Functions: node_modules/next/
// dist/docs/01-app/01-getting-started/07-mutating-data.md.
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { ForbiddenError } from "@/lib/errors";
import { saveBrand } from "@/lib/brand";
import { inviteMember, removeMember, setMemberRole } from "@/lib/members";
import { redirect } from "next/navigation";
import { deleteWorkspace } from "@/lib/workspace-data";
import { track } from "@/lib/analytics";
import { WORKSPACE_DATA_COPY } from "@/lib/workspace-data-copy";

export type MembersState = { error: string | null; sent?: string | null };
export type BrandState = { error: string | null; field: "name" | "accentHex" | "logo" | null; saved: boolean; tooLight: boolean };

async function actor() {
  const { session, current } = await requireCurrentWorkspace("/app/settings");
  return { ws: current.ws, userId: session.user.id, headers: await headers() };
}

function refused(error: unknown): MembersState {
  if (error instanceof ForbiddenError) return { error: error.message };
  throw error;
}

export async function inviteAction(_previous: MembersState, formData: FormData): Promise<MembersState> {
  try {
    const result = await inviteMember(await actor(), formData.get("email"));
    if ("error" in result) return { error: result.error };
    revalidatePath("/app/settings");
    return { error: null, sent: result.email };
  } catch (error) {
    return refused(error);
  }
}

export async function removeAction(_previous: MembersState, formData: FormData): Promise<MembersState> {
  try {
    const result = await removeMember(await actor(), String(formData.get("userId") ?? ""));
    if ("error" in result) return { error: result.error };
    revalidatePath("/app/settings");
    return { error: null };
  } catch (error) {
    return refused(error);
  }
}

export async function roleAction(_previous: MembersState, formData: FormData): Promise<MembersState> {
  try {
    const result = await setMemberRole(await actor(), String(formData.get("userId") ?? ""), formData.get("role"));
    if ("error" in result) return { error: result.error };
    revalidatePath("/app/settings");
    return { error: null };
  } catch (error) {
    return refused(error);
  }
}

// The brand save (stories/E2-5): the file comes as a File in the form data
// (developer.mozilla.org/docs/Web/API/FormData/get); an empty file input is a File of size 0.
export async function saveBrandAction(_previous: BrandState, formData: FormData): Promise<BrandState> {
  const none: BrandState = { error: null, field: null, saved: false, tooLight: false };
  try {
    const file = formData.get("logo");
    const logo = file instanceof File && file.size > 0 ? { bytes: new Uint8Array(await file.arrayBuffer()) } : null;
    const result = await saveBrand(await actor(), { name: formData.get("name"), accentHex: formData.get("accentHex"), logo, removeLogo: formData.get("removeLogo") === "1" });
    if (!result.ok) return { ...none, error: result.error, field: result.field };
    revalidatePath("/app", "layout");
    return { ...none, saved: true, tooLight: result.tooLight };
  } catch (error) {
    if (error instanceof ForbiddenError) return { ...none, error: error.message };
    throw error;
  }
}

// Delete this workspace (stories/E11-2, acceptance 2): owner only (403 as form state for a
// member), the typed name checked on the server; then the deleted page.
export type DeleteState = { error: string | null };
export async function deleteWorkspaceAction(_previous: DeleteState, formData: FormData): Promise<DeleteState> {
  try {
    const who = await actor();
    const result = await deleteWorkspace(who, formData.get("name"));
    if ("error" in result) return { error: result.error };
    // Kept without the workspace: its own events go with it (stories/E13-1, acceptance 5).
    await track("workspace_deleted", {}, { workspaceId: null, userId: who.userId });
  } catch (error) {
    if (error instanceof ForbiddenError) return { error: WORKSPACE_DATA_COPY.ownerOnly };
    throw error;
  }
  revalidatePath("/app", "layout");
  redirect("/app/deleted");
}
