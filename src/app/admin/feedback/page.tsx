// The feedback inbox (stories/E17-1, acceptance 6): every workspace's reports, newest first,
// filtered by status, with Mark solved or Reopen and Remove on each row through the confirm
// line. Empty, loading and error states: the line below, the Suspense fallback of the admin
// shell, src/app/error.tsx. Copy: docs/copy/app.md, Admin feedback.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { feedbackInbox } from "@/db/queries/admin";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { FEEDBACK_ADMIN_COPY as C } from "@/lib/admin-copy";
import { FEEDBACK_COPY } from "@/lib/feedback-copy";
import { ConfirmForm } from "../confirm-form";
import { reopenAction, removeAction, solveAction } from "./actions";

export const dynamic = "force-dynamic";

const TIME = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const FILTERS = [...FEEDBACK_STATUSES, "all"] as const;
type Filter = (typeof FILTERS)[number];

export default async function FeedbackInboxPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { proof } = await requireAdmin();
  const raw = (await searchParams).status;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const filter: Filter = (FILTERS as readonly string[]).includes(value ?? "") ? (value as Filter) : "open";
  const rows = await feedbackInbox(proof, filter as FeedbackStatus | "all");
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin-feedback-page">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] text-ink-muted">{C.crumb}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.title}</h1>
        <p className="text-ink-muted">{C.intro}</p>
      </div>
      <nav aria-label={C.title} className="flex items-center gap-2" data-testid="feedback-filters">
        {FILTERS.map((f) => (
          <Link key={f} href={f === "open" ? "/admin/feedback" : `/admin/feedback?status=${f}`} aria-current={f === filter ? "page" : undefined} className={buttonVariants({ variant: f === filter ? "primary" : "secondary", size: "small" })}>{C.filters[f]}</Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="card px-5 py-4 text-ink-muted" data-testid="feedback-inbox-empty">{C.empty[filter]}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" data-testid="feedback-inbox">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-muted">
                <th className="px-4 py-2.5">{C.columns.when}</th>
                <th className="px-3 py-2.5">{C.columns.workspace}</th>
                <th className="px-3 py-2.5">{C.columns.person}</th>
                <th className="px-3 py-2.5">{C.columns.kind}</th>
                <th className="px-3 py-2.5">{C.columns.text}</th>
                <th className="px-3 py-2.5">{C.columns.status}</th>
                <th className="px-3 py-2.5">{C.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline align-top" data-testid="feedback-row" data-status={r.status}>
                  <td className="whitespace-nowrap px-4 py-2">{TIME.format(r.createdAt)}</td>
                  <td className="px-3 py-2">{r.workspaceName === null ? C.gone : <Link href={`/admin/workspaces/${r.workspaceId}`} className="font-semibold text-violet-text underline-offset-2 hover:underline">{r.workspaceName}</Link>}</td>
                  <td className="px-3 py-2">{r.senderEmail ?? C.gone}</td>
                  <td className="whitespace-nowrap px-3 py-2">{FEEDBACK_COPY.kinds[r.kind]}</td>
                  <td className="min-w-[320px] px-3 py-2">
                    <div className="text-xs text-ink-muted">{r.page ?? C.noPage}</div>
                    <p className="whitespace-pre-wrap" data-testid="feedback-text">{r.text}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {r.status === "solved" ? <StatusPill status="agree">{FEEDBACK_COPY.status.solved}</StatusPill> : <NeutralPill>{FEEDBACK_COPY.status.open}</NeutralPill>}
                    {r.solvedAt && <div className="mt-1 text-xs text-ink-muted">{C.solvedLine(TIME.format(r.solvedAt), r.solvedByEmail ?? C.gone)}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-2">
                      {r.status === "solved"
                        ? <ConfirmForm action={reopenAction} hidden={{ id: r.id }} label={C.reopen} confirmLine={C.confirmReopen} testId="reopen-form" />
                        : <ConfirmForm action={solveAction} hidden={{ id: r.id }} label={C.solve} confirmLine={C.confirmSolve} testId="solve-form" />}
                      <ConfirmForm action={removeAction} hidden={{ id: r.id }} label={C.remove} confirmLine={C.confirmRemove} testId="remove-form" variant="destructive" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
