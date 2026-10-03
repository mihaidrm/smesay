// The project stepper (stories/E3-1, acceptance 2; the PM app board, design v2): Import,
// Shape, Build, Share, Results as pills on a surface track (4 px padding, radius 999, hairline
// border). The current step is a violet pill with a white circle and a violet number; a done
// step has a mint circle with a dark tick; a coming step is muted with a strong hairline
// circle. The active pill's text is the on-violet token (white on light, the dark ground on
// dark), so it reads at 5.25 and 6.17. A step with no page yet is not a link; one with a page is, current or not. Design
// notes 19 and 34.
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
    <nav aria-label="Steps" className="flex flex-wrap gap-1 rounded-full border border-hairline bg-surface p-1">
      {STEPS.map((step, i) => {
        const active = step.key === current;
        const finished = done.includes(step.key) || i < currentIndex;
        const target = href(step.key);
        const className = cn(
          "inline-flex h-[34px] items-center gap-2 rounded-full py-0 pl-2 pr-3.5 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          active ? "bg-violet text-on-violet" : finished ? "text-ink" : "text-ink-muted",
          target && !active && "hover:bg-tint",
        );
        const number = (
          <span aria-hidden="true" className={cn("inline-flex size-[22px] items-center justify-center rounded-full border text-[11px] leading-none",
            active ? "border-on-violet bg-on-violet text-violet" : finished ? "border-mint bg-mint text-[#16152A]" : "border-hairline-strong bg-transparent text-ink-muted")}>{finished && !active ? "✓" : i + 1}</span>
        );
        // The current step is a link too once its page exists (E4-2: Shape is the current
        // step from the import on, and the only way to it is this pill).
        return target
          ? <Link key={step.key} href={target} aria-current={active ? "step" : undefined} className={className}>{number}<span>{step.label}</span></Link>
          : <span key={step.key} aria-current={active ? "step" : undefined} className={className}>{number}<span>{step.label}</span></span>;
      })}
    </nav>
  );
}
