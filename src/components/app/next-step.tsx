// The next-step panel (design note 121; Mihai, 2026-10-08: "Clicking import needs to actually
// feel like import is happening... After import we make a big button appear on screen ->
// continue to shaping the list", "same for when shaping is done"): once a step's work is done,
// a panel under the page title says so in one line, with a second line on what comes next, and
// carries a big primary link to the next step. The tick is Lucide's CircleCheck in the agree
// colour on the agree tint. Server component; copy from the step's own copy module.
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function NextStep({ done, detail, href, label }: { done: string; detail?: string | null; href: string; label: string }) {
  return (
    <div data-testid="next-step" className="flex flex-wrap items-center gap-4 rounded-xl border border-hairline bg-agree-tint px-5 py-4">
      <CircleCheck aria-hidden="true" className="size-6 shrink-0 text-agree" />
      <div className="flex min-w-0 grow basis-60 flex-col gap-0.5">
        <span className="font-semibold">{done}</span>
        {detail && <span className="text-[13px] text-ink-muted">{detail}</span>}
      </div>
      <Link href={href} className={buttonVariants({ variant: "primary", size: "respondent" })}>{label}<span aria-hidden="true" className="ml-2">→</span></Link>
    </div>
  );
}
