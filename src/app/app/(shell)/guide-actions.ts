"use server";
// The guide's two writes (stories/E15-1, acceptances 3 and 4): Dismiss a tip for good, and the
// Show tips switch. Both are the person's own (user.guide_state, every workspace); the session
// comes through requireWritableWorkspace, so an admin's view of a workspace changes nothing
// (E14-4). An id that is not one of docs/copy/guide.md's is refused.
import { revalidatePath } from "next/cache";
import { guide } from "@/db/queries";
import { requireWritableWorkspace } from "@/lib/current-workspace";
import { TIP_IDS, type TipId } from "@/lib/guide-lines";

export async function dismissTipAction(tipId: string): Promise<void> {
  const { session } = await requireWritableWorkspace("/app");
  if (!(TIP_IDS as string[]).includes(tipId)) return;
  await guide.dismiss(session.user.id, tipId as TipId);
  revalidatePath("/app", "layout");
}

export async function setShowTipsAction(on: boolean): Promise<void> {
  const { session } = await requireWritableWorkspace("/app");
  await guide.setTipsOff(session.user.id, on !== true);
  revalidatePath("/app", "layout");
}
