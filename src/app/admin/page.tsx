// The admin Overview (stories/E13-2): served only to ADMIN_EMAILS (src/lib/admin.ts, 404 for
// anyone else); the totals with the paid-plan metric (src/lib/plans.ts PAID_PLAN_SWITCH), the
// funnel per ISO week for 12 weeks from the event table (E13-1), and the usage of every
// workspace by last activity. Every count comes from SQL in src/db/queries/admin.ts, the one
// module that reads across workspaces. No personal data: workspace names and counts only.
// Desktop only, as the PM side in R1 (decision 0020). E14-1 puts this page in the admin shell.
import { StatTile } from "@/components/app/tiles";
import { Suspense } from "react";
import { firstProjectFunnel, funnel, guideStats, totals, workspaceUsage } from "@/db/queries/admin";
import { FUNNEL_STEPS } from "@/db/types";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_COPY as C, GUIDE_ADMIN_COPY as G, actedRate, share } from "@/lib/admin-copy";
import { formatEur } from "@/lib/ai/prices";
import { PAID_PLAN_SWITCH, PLAN_METRICS } from "@/lib/plans";
import type { AdminProof } from "@/db/types";

// No page metadata: a title of its own would show in the 404 sent to anyone else (Next keeps
// the main render's metadata in the not-found HTML), so the page keeps the app's title.
export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// The check runs before anything is sent, so anyone else gets the 404 status and page; the
// counts then stream in behind a loading state (Suspense: react.dev/reference/react/Suspense).
export default async function AdminPage() {
  const { proof } = await requireAdmin();
  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 py-6" data-testid="admin">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] text-ink-muted">{C.crumb}</div>
        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.03em]">{C.title}</h1>
        <p className="text-ink-muted">{C.intro}</p>
      </div>
      <Suspense fallback={<p className="text-ink-muted" aria-busy="true" data-testid="admin-loading">{C.loading}</p>}>
        <Overview proof={proof} />
      </Suspense>
    </main>
  );
}

async function Overview({ proof }: { proof: AdminProof }) {
  const now = new Date();
  const [weeks, rows, all, firstWeeks, tips] = await Promise.all([funnel(proof, now), workspaceUsage(proof, now), totals(proof), firstProjectFunnel(proof, now), guideStats(proof, now)]);
  const metric = PLAN_METRICS[PAID_PLAN_SWITCH.metric];
  return (
    <>
      <div className="flex gap-3.5" data-testid="admin-totals">
        <StatTile value={all.workspaces} label={C.totals.workspaces} tone="violet" />
        <StatTile value={all.projects} label={C.totals.projects} />
        <StatTile value={all.published} label={C.totals.published} />
        <StatTile value={all.submitted} label={C.totals.submitted} tone="mint" />
      </div>
      <div className="card flex flex-col gap-1 px-5 py-4" data-testid="admin-metric">
        <span className="text-[13px] font-semibold text-ink-muted">{metric.label}</span>
        <span className="text-base">{C.metric(metric.value(rows), PAID_PLAN_SWITCH.threshold)}</span>
      </div>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{C.funnelTitle}</h2>
        <p className="text-sm text-ink-muted">{C.funnelNote}</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" data-testid="admin-funnel">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-muted">
                <th className="px-4 py-2.5">{C.week}</th>
                {FUNNEL_STEPS.map((s) => <th key={s} className="px-3 py-2.5 text-right">{C.steps[s]}</th>)}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week.toISOString()} className="border-t border-hairline">
                  <td className="whitespace-nowrap px-4 py-2">{DAY.format(w.week)}</td>
                  {FUNNEL_STEPS.map((s, i) => (
                    <td key={s} className="px-3 py-2 text-right font-mono">
                      {w.counts[s]}
                      {i > 0 && <div className="text-xs text-ink-muted">{share(w.counts[s], w.counts[FUNNEL_STEPS[i - 1]])}</div>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="flex flex-col gap-2" data-testid="admin-first-project">
        <h2 className="text-lg font-bold">{G.firstTitle}</h2>
        <p className="text-sm text-ink-muted">{G.firstNote}</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-muted">
                <th className="px-4 py-2.5">{G.firstColumns.week}</th>
                {(["signups", "imported", "shaped", "built", "shared"] as const).map((k) => <th key={k} className="px-3 py-2.5 text-right">{G.firstColumns[k]}</th>)}
                <th className="px-3 py-2.5 text-right">{G.firstColumns.median}</th>
              </tr>
            </thead>
            <tbody>
              {firstWeeks.map((w) => (
                <tr key={w.week.toISOString()} className="border-t border-hairline">
                  <td className="whitespace-nowrap px-4 py-2">{DAY.format(w.week)}</td>
                  <td className="px-3 py-2 text-right font-mono">{w.signups}</td>
                  {(["imported", "shaped", "built", "shared"] as const).map((k) => (
                    <td key={k} className="px-3 py-2 text-right font-mono">{w[k]}<div className="text-xs text-ink-muted">{share(w[k], w.signups)}</div></td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono">{w.medianHoursToLink ?? G.noMedian}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-muted" data-testid="admin-benchmark">{G.benchmark}</p>
      </section>
      <section className="flex flex-col gap-2" data-testid="admin-guide">
        <h2 className="text-lg font-bold">{G.guideTitle}</h2>
        <p className="text-sm text-ink-muted">{G.guideNote}</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink-muted">
                <th className="px-4 py-2.5">{G.guideColumns.tip}</th>
                <th className="px-3 py-2.5 text-right">{G.guideColumns.shown}</th>
                <th className="px-3 py-2.5 text-right">{G.guideColumns.dismissed}</th>
                <th className="px-3 py-2.5 text-right">{G.guideColumns.acted}</th>
                <th className="px-3 py-2.5 text-right">{G.guideColumns.rate}</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tips.map((t) => (
                <tr key={t.tip} className="border-t border-hairline" data-testid="admin-guide-row" data-tip={t.tip}>
                  <td className="px-4 py-2 font-mono text-xs">{t.tip}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.shown}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.dismissed}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.hasAction ? t.acted : G.noAction}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.hasAction ? actedRate(t.acted, t.shown) : ""}</td>
                  <td className="px-3 py-2">{t.toReview && <span className="font-semibold text-danger">{G.toReview}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{C.workspacesTitle}</h2>
        {rows.length === 0 ? <p className="card px-5 py-4 text-ink-muted" data-testid="admin-no-workspaces">{C.noWorkspaces}</p> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-workspaces">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-muted">
                  <th className="px-4 py-2.5">{C.columns.name}</th>
                  <th className="px-3 py-2.5">{C.columns.created}</th>
                  <th className="px-3 py-2.5">{C.columns.source}</th>
                  <th className="px-3 py-2.5 text-right">{C.columns.members}</th>
                  <th className="px-3 py-2.5 text-right">{C.columns.projects}</th>
                  <th className="px-3 py-2.5 text-right">{C.columns.published}</th>
                  <th className="px-3 py-2.5 text-right">{C.columns.responses}</th>
                  <th className="px-3 py-2.5 text-right">{C.columns.cost}</th>
                  <th className="px-3 py-2.5">{C.columns.last}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-hairline" data-testid="admin-workspace-row">
                    <td className="px-4 py-2 font-semibold">{r.name}</td>
                    <td className="whitespace-nowrap px-3 py-2">{DAY.format(r.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs" data-testid="admin-source">{r.firstSource ?? C.noSource}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.members}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.projects}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.published}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.responsesThisMonth}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatEur(r.aiCostCentsThisMonth)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{DAY.format(r.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
