// The first-project path on Projects (stories/E15-2; design note 39, question 1): the guide card
// with the title, the four steps ticked from the data (src/lib/guide.ts pathView) and the robot's
// line for the next one, above the projects table. Each step links to that step of the newest
// project of the workspace's own; with none yet, "Start a project" and, while the sample is
// there, "Try it on the sample first" (its Results, E8-8). Dismissing any of the path's lines
// hides the whole card for good, as does tips off (E15-1).
import Link from "next/link";
import { Check } from "lucide-react";
import { GuideCard } from "@/components/app/guide-card";
import type { PathView } from "@/lib/guide";
import { PATH_STEPS } from "@/lib/guide";
import { GUIDE_COPY, GUIDE_LINES } from "@/lib/guide-lines";

const label = (action: string | null) => (action ?? "").replace(/ \(.*\)$/, "");

export function FirstProjectPath({ view, sampleId }: { view: PathView; sampleId: string | null }) {
  const base = view.projectId ? `/app/projects/${view.projectId}` : null;
  const next = view.tip.replace("path.", "");
  const action = view.tip === "path.start" ? { label: label(GUIDE_LINES["path.start"].action), href: "/app/projects/new" }
    : view.tip === "path.done" ? { label: label(GUIDE_LINES["path.done"].action), href: `${base}/results` }
    : { label: label(GUIDE_LINES[view.tip].action), href: `${base}/${next}` };
  return (
    <GuideCard id={view.tip} action={action} secondary={view.tip === "path.start" && sampleId ? { label: GUIDE_COPY.sampleFirst, href: `/app/projects/${sampleId}/results` } : undefined}>
      <div className="flex flex-col gap-2" data-testid="first-project-path">
        <h2 className="text-lg font-bold tracking-[-0.02em]">{GUIDE_COPY.pathTitle}</h2>
        <ol className="flex flex-wrap gap-2">
          {PATH_STEPS.map((step, i) => {
            const done = view.ticked[step];
            const body = (
              <>
                <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-violet text-white" : "border border-hairline-strong bg-surface text-ink-muted"}`}>{done ? <Check className="size-3" /> : i + 1}</span>
                <span>{GUIDE_COPY.steps[step]}</span>
                {done ? <span className="sr-only">, {GUIDE_COPY.done}</span> : step === next ? <span className="sr-only">, {GUIDE_COPY.next}</span> : null}
              </>
            );
            return (
              <li key={step} data-testid="path-step" aria-current={step === next && !done ? "step" : undefined} data-step={step} data-done={done ? "true" : "false"}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${step === next ? "border-violet bg-surface font-semibold" : "border-hairline bg-surface/70"}`}>
                {base ? <Link href={`${base}/${step}`} className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-violet">{body}</Link> : body}
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-ink-muted">{GUIDE_COPY.then}</p>
      </div>
    </GuideCard>
  );
}
