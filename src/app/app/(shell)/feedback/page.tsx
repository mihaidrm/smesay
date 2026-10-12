// The Feedback page (stories/E17-1, acceptance 1 to 3): the form, and under it the
// workspace's reports with their status. Copy: docs/copy/app.md, Feedback. Empty state: one
// line; the loading state is the shell's; errors: src/app/error.tsx.
import { feedbackReports } from "@/db/queries";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { pagePath } from "@/lib/feedback";
import { FEEDBACK_COPY as C } from "@/lib/feedback-copy";
import { FeedbackForm } from "./form";

export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { session, current } = await requireCurrentWorkspace("/app/feedback");
  const raw = (await searchParams).from;
  const page = pagePath(Array.isArray(raw) ? raw[0] : raw);
  const reports = await feedbackReports.list(current.ws);
  return (
    <main className="flex flex-col gap-5 px-8 py-6" data-testid="feedback-page">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-ink-muted" data-testid="breadcrumb">{current.workspace.name}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.title}</h1>
        <p className="text-ink-muted">{C.intro}</p>
      </div>
      <FeedbackForm page={page} email={session.user.email} />
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{C.listTitle}</h2>
        {reports.length === 0 ? (
          <p className="text-ink-muted" data-testid="feedback-empty">{C.listEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="feedback-list">
            {reports.map((r) => (
              <li key={r.id} className="card flex flex-col gap-1 px-5 py-3" data-testid="feedback-item" data-status={r.status}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{C.kinds[r.kind]}{r.page ? ` · ${r.page}` : ""}</span>
                  {r.status === "solved" ? <StatusPill status="agree" data-testid="feedback-status">{C.status.solved}</StatusPill> : <NeutralPill data-testid="feedback-status">{C.status.open}</NeutralPill>}
                </div>
                <p className="whitespace-pre-wrap text-sm">{r.text}</p>
                <p className="text-xs text-ink-muted">{C.listLine(r.senderEmail, WHEN.format(r.createdAt))}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
