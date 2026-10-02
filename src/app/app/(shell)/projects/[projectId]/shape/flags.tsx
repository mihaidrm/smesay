"use client";
// The flag banners (stories/E4-4, acceptance 1 and 2; PM app board, Shape): one per flagged
// flag, stacked above the areas (an item with both flags has two), in the unclear tint with
// a Dismiss pill (the Banner of the design system, with its action slot). An ambiguity banner names the item and what it does not say; a duplicate
// banner names both items. The refs link to the rows. Dismiss is a form on dismissFlagAction;
// the sample shows its banners without it.
import { useActionState } from "react";
import { Banner, bannerButtonClass } from "@/components/ui/banner";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import type { ItemFlag } from "@/lib/shaping";
import { dismissFlagAction, type ProjectFormState } from "../../actions";

const NONE: ProjectFormState = { error: null, saved: false };
const link = (id: string, ref: string) => <a href={`#item-${id}`} className="font-medium underline underline-offset-4">{ref}</a>;

export function FlagBanners({ projectId, flags, readOnly }: { projectId: string; flags: ItemFlag[]; readOnly: boolean }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="flags">
      {flags.map((flag) => <FlagBanner key={`${flag.kind}-${flag.itemId}`} projectId={projectId} flag={flag} readOnly={readOnly} />)}
    </div>
  );
}

function FlagBanner({ projectId, flag, readOnly }: { projectId: string; flag: ItemFlag; readOnly: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(dismissFlagAction, NONE);
  const dismiss = !readOnly && (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="itemId" value={flag.itemId} />
      <button type="submit" disabled={pending} className={bannerButtonClass}>{SHAPE_COPY.dismiss}</button>
    </form>
  );
  return (
    <Banner data-testid={`flag-${flag.kind}`} action={dismiss || undefined}>
      {flag.kind === "ambiguity"
        ? <><span className="font-medium">Ambiguity in {link(flag.itemId, flag.ref)}.</span> {SHAPE_COPY.sentence(flag.what)} {SHAPE_COPY.mayMarkUnclear}</>
        : <><span className="font-medium">{link(flag.itemId, flag.ref)} may duplicate {link(flag.otherId, flag.otherRef)}.</span> {SHAPE_COPY.duplicateNote}</>}
      {state.error && <span role="alert" className="ml-2 text-danger">{state.error}</span>}
    </Banner>
  );
}
