"use server";
// The guide's writes (stories/E15-1, acceptances 3 and 4; E15-5, acceptance 1): Dismiss a tip for
// good, the Show tips switch, and the person pressing a card's action. All are the person's own
// (user.guide_state, every workspace); the session comes through requireWritableWorkspace, so an
// admin's view of a workspace changes nothing (E14-4). An id that is not one of
// docs/copy/guide.md's is refused. Dismiss and the action are counted as guide_dismissed and
// guide_acted in the workspace the person is in (E13-1), each at most once a day per tip and
// person like guide_shown, so pressing an action on three visits counts once and a loop of calls
// writes one row a day.
import { revalidatePath } from "next/cache";
import { guide } from "@/db/queries";
import { trackOncePerDay } from "@/lib/analytics";
import { requireWritableWorkspace } from "@/lib/current-workspace";
import { TIP_IDS, type TipId } from "@/lib/guide-lines";

const isTip = (id: string): id is TipId => (TIP_IDS as string[]).includes(id);

export async function dismissTipAction(tipId: string): Promise<void> {
  const { session, current } = await requireWritableWorkspace("/app");
  if (!isTip(tipId)) return;
  await guide.dismiss(session.user.id, tipId);
  await trackOncePerDay("guide_dismissed", { tip: tipId }, { workspaceId: current.ws, userId: session.user.id }, "tip");
  revalidatePath("/app", "layout");
}

export async function actedTipAction(tipId: string): Promise<void> {
  const { session, current } = await requireWritableWorkspace("/app");
  if (!isTip(tipId)) return;
  await trackOncePerDay("guide_acted", { tip: tipId }, { workspaceId: current.ws, userId: session.user.id }, "tip");
}

export async function setShowTipsAction(on: boolean): Promise<void> {
  const { session } = await requireWritableWorkspace("/app");
  await guide.setTipsOff(session.user.id, on !== true);
  revalidatePath("/app", "layout");
}
