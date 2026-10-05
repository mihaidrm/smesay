// "Powered by SMEsay" on the respondent side (stories/E7-7, acceptance 5; docs/design-system.md,
// Identity): shown while the workspace is on the Free plan, gone on a paid one. One component,
// so the respondent screens (About you, the chapters, the Wrap up, Done, nothing to rate), the
// link pages and the Build preview cannot drift. With privacy (stories/E11-3, acceptance 3: About
// you and Done) the line carries "How your answers are used", a link to the privacy notice that
// opens in a new tab so the respondent's screen stays; it shows on every plan. Both links send
// no referrer, so a respondent's link token never reaches the page they open, or its visit
// counts (stories/E13-3; rel=noreferrer: developer.mozilla.org/docs/Web/HTML/Attributes/rel/noreferrer).
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { LANDING_PATH } from "@/lib/sample-copy";

// "landing": the lockup links to the landing page (the visitors' sample, stories/E12-4,
// acceptance 2); on a workspace's link it is text.
export type PoweredByShow = boolean | "landing";

export function PoweredBy({ show = true, privacy = false, className }: { show?: PoweredByShow; privacy?: boolean; className?: string }) {
  if (!show && !privacy) return null;
  const link = privacy ? <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink" data-testid="privacy-link">{ABOUT_YOU_COPY.privacy}<span className="sr-only"> {ABOUT_YOU_COPY.newTab}</span></a> : null;
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-[13px] text-ink-muted", className)}>
      {show === "landing" ? (
        <a href={LANDING_PATH} rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink" data-testid="powered-by">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink underline underline-offset-4">SMEsay</span></a>
      ) : show && <span className="flex items-center gap-1.5" data-testid="powered-by">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></span>}
      {show && link && <span aria-hidden="true">·</span>}
      {link}
    </div>
  );
}
