// The sample's watermark band (stories/E8-8, acceptance 1): the dashed outline on the tint, the
// line from docs/copy/app.md in soft ink, never dismissed. One component for the project frame
// (src/app/app/(shell)/projects/[projectId]/layout.tsx), the sample's link page
// (src/app/r/[token]/page.tsx) and the visitors' sample (src/app/sample/page.tsx).
import { cn } from "cn";
import { PROJECTS_COPY } from "@/lib/projects-copy";

// text: the visitors' sample (stories/E12-4) says nothing is saved instead.
export function SampleBand({ className, text = PROJECTS_COPY.sampleBand }: { className?: string; text?: string }) {
  return <p className={cn("rounded-xl border border-dashed border-hairline-strong bg-tint px-4 py-2 text-sm font-semibold text-ink-soft", className)} data-testid="sample-band">{text}</p>;
}
