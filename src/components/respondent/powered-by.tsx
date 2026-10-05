// "Powered by SMEsay" on the respondent side (stories/E7-7, acceptance 5; docs/design-system.md,
// Identity): shown while the workspace is on the Free plan, gone on a paid one. One component,
// so the respondent screens (About you, the chapters, the Wrap up, Done, nothing to rate), the
// link pages and the Build preview cannot drift. With privacy (stories/E11-3, acceptance 3: About
// you and Done) the line carries "How your answers are used", a link to the privacy notice that
// opens in a new tab so the respondent's screen stays; it shows on every plan.
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";

export function PoweredBy({ show = true, privacy = false, className }: { show?: boolean; privacy?: boolean; className?: string }) {
  if (!show && !privacy) return null;
  const link = privacy ? <a href="/legal/privacy" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-ink" data-testid="privacy-link">{ABOUT_YOU_COPY.privacy}<span className="sr-only"> {ABOUT_YOU_COPY.newTab}</span></a> : null;
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-[13px] text-ink-muted", className)}>
      {show && <span className="flex items-center gap-1.5" data-testid="powered-by">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></span>}
      {show && link && <span aria-hidden="true">·</span>}
      {link}
    </div>
  );
}
