// "Powered by SMEsay" on the respondent side (stories/E7-7, acceptance 5; docs/design-system.md,
// Identity): shown while the workspace is on the Free plan, gone on a paid one. One component,
// so the respondent screens (About you, the chapters, the Wrap up, Done, nothing to rate), the
// link pages and the Build preview cannot drift.
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";

export function PoweredBy({ show = true, className }: { show?: boolean; className?: string }) {
  if (!show) return null;
  return <div className={cn("flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted", className)} data-testid="powered-by">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>;
}
