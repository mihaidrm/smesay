// One guide card on a step page (stories/E15-3, E15-4), under the step's title where the page's
// banners are: the tip the page chose from its data (src/lib/guide.ts), drawn only when it is
// visible for the person (tips on, not dismissed: E15-1), never on the sample's steps but
// Results, and never during an admin's view (E14-4), whose disabled content could not dismiss
// it anyway.
import { GuideCard, type GuideAction } from "@/components/app/guide-card";
import { guide } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { tipVisible } from "@/lib/guide";
import { guideShown } from "@/lib/analytics";
import type { TipId } from "@/lib/guide-lines";

export async function StepTip({ tip, action, path }: { tip: TipId | null; action?: GuideAction; path: string }) {
  if (!tip) return null;
  const { session, current, viewing } = await requireCurrentWorkspace(path);
  if (viewing) return null;
  const state = await guide.state(session.user.id);
  if (!tipVisible(state, tip)) return null;
  await guideShown(tip, action !== undefined, { workspaceId: current.ws, userId: session.user.id });
  return <GuideCard id={tip} action={action} />;
}
