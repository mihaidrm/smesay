// The quickstart (stories/E12-2, acceptances 1 and 2; docs/copy/quickstart.md): the four steps
// that match the project stepper (Import, Shape, Build, Share), then the results, with Start a
// project (New project, E3-1) and Open the sample project (the sample on Results, E8-8; shown
// while the sample exists). Projects sends a member here until quickstart_seen_at is set
// (src/app/app/(shell)/page.tsx), so it follows naming the first workspace; Help in the sidebar
// opens it any time. The page stamps quickstart_seen_at once its data has loaded, so a failed
// load does not count as seen (src/db/queries/members.ts). PM side, desktop only in R1 (decision 0020).
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { members, projects } from "@/db/queries";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { track } from "@/lib/analytics";
import { QUICKSTART_COPY as Q } from "@/lib/quickstart-copy";

export default async function QuickstartPage() {
  const { session, current, viewing } = await requireCurrentWorkspace("/app/quickstart");
  const list = await projects.list(current.ws);
  // Nothing is stamped or counted during an admin's view (E14-4), even when the admin is also a
  // member of the workspace.
  if (!viewing && await members.markQuickstartSeen(current.ws, session.user.id, new Date())) await track("quickstart_seen", {}, { workspaceId: current.ws, userId: session.user.id });
  const sample = list.find((p) => p.isSample && p.archivedAt === null) ?? null;
  return (
    <main className="flex max-w-[880px] flex-col gap-8 px-8 py-8" data-testid="quickstart">
      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{Q.title}</h1>
        <p className="max-w-[640px] text-[15px] leading-6 text-ink-muted">{Q.intro}</p>
      </div>
      {/* Each card: the number beside the title, then what you do and what you get, one line each
          (design note 102). The number badge and the title share one 32 px row. */}
      <ol className="grid grid-cols-2 gap-5" data-testid="quickstart-steps">
        {Q.steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-soft font-mono text-sm font-bold text-violet-text" aria-hidden="true">{i + 1}</span>
              <h2 className="text-[17px] font-bold leading-8">{step.title}</h2>
            </div>
            <div className="flex flex-col gap-1.5 text-[15px] leading-6">
              <p>{step.you}</p>
              <p className="text-ink-muted">{step.get}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="flex flex-col gap-4 rounded-2xl border border-hairline bg-tint p-6">
        <h2 className="text-[17px] font-bold leading-8">{Q.then.title}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-6 text-ink-muted" data-testid="quickstart-then">
          {Q.then.lines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
      <div className="flex items-center gap-4">
        <Link href="/app/projects/new" className={buttonVariants()}>{Q.start}</Link>
        {sample && <Link href={`/app/projects/${sample.id}/results`} className="text-sm font-semibold text-violet-text underline-offset-4 hover:underline">{Q.sample}</Link>}
      </div>
    </main>
  );
}
