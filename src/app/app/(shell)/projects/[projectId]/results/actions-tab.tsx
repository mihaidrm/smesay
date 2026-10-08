// The Actions tab (stories/E9-1 and E9-2; the PM app board, Actions): Write actions (Write
// again once there are some), "How actions are chosen" (design note 123), then one tab per
// kind (Follow up, Rewrite, Groups disagree, Coverage; src/components/app/tabs.tsx) with its
// open count, the first with an open action selected: inside, the open actions of that
// kind, each with the title, why in one or two sentences and the citations, the answers
// grouped by item ("[Name] and [Name] on [REF]", a link to the item's detail, E8-5) and the
// missing items ("[Name], missing item"), with Mark done and Dismiss; then the kind's Done
// and Dismissed sections, greyed, each action with its state and date and Reopen. The tab's
// count is the open ones (E8-1 numbers). The sample
// shows its seeded actions with no controls (E9-1 acceptance 7, E9-2 acceptance 1). Under the
// actions, the cost line (E9-3): the project's last run of Write actions and the workspace's
// AI spend this month, the same sum as Settings' usage line (usage(), E2-6); not on the sample,
// whose seeded runs no month counts (usage() leaves the sample out). E4-8 (acceptance 4 and
// 6): before any press, when no response is submitted, the counts line says why a run has
// nothing to read; under the actions, "No AI run on this project yet." until the first
// answered run, and the stand-in line when that run was the stand-in's; the counts the
// thinking state reads (the set's items, the submitted answers) come from the same queries.
// Copy: docs/copy/app.md, Results, Actions.
import Link from "next/link";
import { NeutralPill } from "@/components/ui/status-pill";
import { aiRuns } from "@/db/queries/aiRuns";
import { insights, type InsightWithCitations } from "@/db/queries/insights";
import type { Instrument } from "@/db/queries/instruments";
import { items } from "@/db/queries/items";
import { results } from "@/db/queries/results";
import { usage } from "@/db/queries/usage";
import { formatEur, STAND_IN_MODEL } from "@/lib/ai/prices";
import type { WorkspaceId } from "@/db/types";
import { Tabs } from "@/components/app/tabs";
import type { InsightKind } from "@/db/types";
import { citationLines, COUNTED, KIND_ORDER } from "@/lib/insights";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { RESPONSES_COPY } from "@/lib/results-copy";
import { formatUtc } from "@/lib/sharing-format";
import { cn } from "cn";
import { ActionControls } from "./action-controls";
import { WriteActions } from "./write-actions";

// The Results body renders only once the project has an answer (E8-1), so Write actions is
// always there on a PM's project.
type Props = { ws: WorkspaceId; projectId: string; sample: boolean; instrument: Instrument; itemHref: (id: string) => string };

export async function ActionsTab({ ws, projectId, sample, instrument, itemHref }: Props) {
  // The counts under the default view (submitted responses only, decision 0030): the
  // started and submitted responses, the answers a run reads, the set's items.
  const [rows, last, used, n, setItems] = await Promise.all([insights.listWithCitations(ws, projectId), aiRuns.lastFor(ws, projectId, "insights"), usage(ws), results.numbers(ws, instrument.id, COUNTED), items.forSet(ws, instrument.itemSetId)]);
  const submitted = n?.submitted ?? 0;
  const started = submitted + (n?.inProgress ?? 0);
  const answers = (n?.answered ?? 0) + (n?.pick ?? 0);
  const card = (r: InsightWithCitations) => <ActionCard key={r.id} r={r} projectId={projectId} sample={sample} itemHref={itemHref} />;
  // One panel per kind: its open actions (or the kind's own empty line), then its Done and
  // Dismissed. An action with no kind (none since migration 0021) goes with the first kind.
  const ofKind = (kind: InsightKind) => rows.filter((r) => (r.kind ?? KIND_ORDER[0]) === kind);
  const tabs = KIND_ORDER.map((kind) => ({ kind, rows: ofKind(kind), open: ofKind(kind).filter((r) => r.state === "open").length }));
  const initial = (tabs.find((t) => t.open > 0) ?? tabs.find((t) => t.rows.length > 0) ?? tabs[0]).kind;
  const panel = (kind: InsightKind) => {
    const all = ofKind(kind);
    const open = all.filter((r) => r.state === "open");
    const closed = (["done", "dismissed"] as const).map((state) => ({ state, rows: all.filter((r) => r.state === state) })).filter((s) => s.rows.length > 0);
    return (
      <>
        <section className="flex flex-col gap-3" aria-labelledby={`actions-open-${kind}`}>
          <h3 id={`actions-open-${kind}`} className="sr-only">{ACTIONS_COPY.openHeading} ({open.length})</h3>
          {open.length > 0 ? <ol className="flex flex-col gap-3" data-testid="actions-list">{open.map(card)}</ol> : <p className="rounded-2xl border border-dashed border-hairline-strong bg-surface px-5 py-4 text-sm text-ink-muted" data-testid="actions-none-open">{ACTIONS_COPY.noneOfKind(ACTIONS_COPY.kindWhat[kind])}</p>}
        </section>
        {closed.map((s) => (
          <section key={s.state} className="flex flex-col gap-3" aria-labelledby={`actions-${s.state}-${kind}`} data-testid={`actions-${s.state}`}>
            <h3 id={`actions-${s.state}-${kind}`} className="text-sm font-semibold text-ink-muted">{s.state === "done" ? ACTIONS_COPY.doneHeading : ACTIONS_COPY.dismissedHeading} ({s.rows.length})</h3>
            <ol className="flex flex-col gap-3">{s.rows.map(card)}</ol>
          </section>
        ))}
      </>
    );
  };
  return (
    <div className="flex flex-col gap-4" data-testid="actions-tab">
      {sample ? (
        <p className="text-sm text-ink-muted" data-testid="actions-sample">{ACTIONS_COPY.sample}</p>
      ) : (
        <>
          {submitted === 0 && <p className="text-sm text-ink-muted" data-testid="actions-counts">{ACTIONS_COPY.submittedCounts(submitted, started)}</p>}
          <WriteActions projectId={projectId} again={rows.length > 0} items={setItems.length} answers={answers} />
        </>
      )}
      <details className="text-sm text-ink-muted" data-testid="actions-how">
        <summary className="w-fit cursor-pointer list-none rounded-sm text-[13px] font-semibold text-violet-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground [&::-webkit-details-marker]:hidden">{ACTIONS_COPY.howTitle}</summary>
        <div className="mt-2 flex max-w-[64ch] flex-col gap-2">
          {ACTIONS_COPY.how.map((line) => <p key={line}>{line}</p>)}
        </div>
      </details>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline-strong bg-surface px-5 py-6 text-sm text-ink-muted" data-testid="actions-empty">{sample ? ACTIONS_COPY.sampleEmpty : ACTIONS_COPY.empty}</p>
      ) : (
        <Tabs label={ACTIONS_COPY.kindsLabel} tabs={tabs.map((t) => ({ key: t.kind, label: ACTIONS_COPY.kinds[t.kind], count: t.open }))} initial={initial} panels={Object.fromEntries(KIND_ORDER.map((kind) => [kind, panel(kind)])) as Record<InsightKind, React.ReactNode>} testId="actions-kinds" />
      )}
      {!sample && (last ? (
        <p className="text-xs text-ink-muted" data-testid="actions-cost">
          {last.model === STAND_IN_MODEL && <><span data-testid="actions-stand-in">{ACTIONS_COPY.standIn}</span> </>}
          {ACTIONS_COPY.lastRun(formatUtc(last.createdAt), last.tokensIn + last.tokensOut, formatEur(last.costEurCents))} {ACTIONS_COPY.thisMonth(formatEur(used.aiCostCentsThisMonth))}
        </p>
      ) : (
        <p className="text-xs text-ink-muted" data-testid="actions-no-run">{ACTIONS_COPY.noRun}</p>
      ))}
    </div>
  );
}

function ActionCard({ r, projectId, sample, itemHref }: { r: InsightWithCitations; projectId: string; sample: boolean; itemHref: (id: string) => string }) {
  const closed = r.state !== "open";
  return (
    <li className={cn("card flex flex-col gap-2 p-4", closed && "shadow-none")} data-testid="action" data-state={r.state}>
      <div className="flex flex-wrap items-center gap-2">
        {r.kind && <NeutralPill data-testid="action-kind">{ACTIONS_COPY.kinds[r.kind]}</NeutralPill>}
        {r.state !== "open" && <NeutralPill data-testid="action-closed">{r.closedAt ? ACTIONS_COPY.closedOn(r.state, formatUtc(r.closedAt)) : ACTIONS_COPY.states[r.state]}</NeutralPill>}
      </div>
      <h4 className={cn("text-[15px] font-bold", closed && "text-ink-muted")} data-testid="action-title">{r.title}</h4>
      {r.why && <p className={cn("text-sm", closed && "text-ink-muted")} data-testid="action-why">{r.why}</p>}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-ink-muted">
        <span aria-hidden="true">{ACTIONS_COPY.citedBy}:</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label={ACTIONS_COPY.citedBy} data-testid="action-citations">
          {citationLines(r.answers, r.missing, RESPONSES_COPY.anonymous).map((c, i) => (
            <li key={i} data-testid="action-citation">
              {c.itemId ? <Link href={itemHref(c.itemId)} scroll={false} data-item-link={c.itemId} className="rounded-sm underline underline-offset-4 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">{c.text}</Link> : c.text}
            </li>
          ))}
        </ul>
      </div>
      {!sample && <ActionControls projectId={projectId} insightId={r.id} state={r.state} />}
    </li>
  );
}
