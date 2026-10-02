// The project stepper (stories/E3-1, acceptance 2; the PM app board after the canvas comment of
// 2026-10-01): Import, Shape, Build, Share, Results as pills on a grey track (4 px padding,
// radius 999, grey 50, hairline border, PmApp.dc.html). The current step is an ink pill with a
// white circle and an ink number; a done step has an ink circle with a white number; a coming
// step is muted with a hairline-strong circle. A step with no page yet is not a link. New to
// the design system, recorded in design note 19.
import Link from "next/link";
import { cn } from "cn";

export const STEPS = [
  { key: "import", label: "Import" },
  { key: "shape", label: "Shape" },
  { key: "build", label: "Build" },
  { key: "share", label: "Share" },
  { key: "results", label: "Results" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

export function Stepper({ current, done, href }: { current: StepKey; done: StepKey[]; href: (step: StepKey) => string | null }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Steps" className="flex flex-wrap gap-1 rounded-full border border-hairline bg-grey-50 p-1">
      {STEPS.map((step, i) => {
        const active = step.key === current;
        const finished = done.includes(step.key) || i < currentIndex;
        const target = href(step.key);
        const className = cn(
          "inline-flex min-h-9 items-center gap-2 rounded-full py-0 pl-2 pr-3.5 text-sm font-medium",
          active ? "bg-ink text-white" : finished ? "text-ink" : "text-ink-muted",
        );
        const number = (
          <span aria-hidden="true" className={cn("inline-block size-[22px] rounded-full border text-center text-xs leading-5",
            active ? "border-white bg-white text-ink" : finished ? "border-ink bg-ink text-white" : "border-hairline-strong bg-transparent text-ink-muted")}>{i + 1}</span>
        );
        return target && !active
          ? <Link key={step.key} href={target} className={className}>{number}<span>{step.label}</span></Link>
          : <span key={step.key} aria-current={active ? "step" : undefined} className={className}>{number}<span>{step.label}</span></span>;
      })}
    </nav>
  );
}
