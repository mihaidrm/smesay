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
import { inviteMember, removeMember, setMemberRole } from "@/lib/members";

export type MembersState = { error: string | null; sent?: string | null };

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
