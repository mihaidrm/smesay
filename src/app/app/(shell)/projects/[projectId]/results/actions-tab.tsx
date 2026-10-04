// The Actions tab (stories/E9-1; the PM app board, Actions): Write actions (Write again once
// there are some), then each action: its kind, the title, why in one or two sentences, and
// the citations, the answers grouped by item ("[Name] and [Name] on [REF]", a link to the
// item's detail, E8-5) and the missing items ("[Name], missing item"). Open actions first,
// then done and dismissed (E9-2 adds their controls). The sample shows its seeded actions and
// no Write actions (acceptance 7). Copy: docs/copy/app.md, Results, Actions.
import Link from "next/link";
import { NeutralPill } from "@/components/ui/status-pill";
import { insights } from "@/db/queries/insights";
import type { WorkspaceId } from "@/db/types";
import { citationLines } from "@/lib/insights";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { RESPONSES_COPY } from "@/lib/results-copy";
import { WriteActions } from "./write-actions";

// The Results body renders only once the project has an answer (E8-1), so Write actions is
// always there on a PM's project.
type Props = { ws: WorkspaceId; projectId: string; sample: boolean; itemHref: (id: string) => string };

export async function ActionsTab({ ws, projectId, sample, itemHref }: Props) {
  const rows = await insights.listWithCitations(ws, projectId);
  return (
    <div className="flex flex-col gap-4" data-testid="actions-tab">
      {sample ? (
        <p className="text-sm text-ink-muted" data-testid="actions-sample">{ACTIONS_COPY.sample}</p>
      ) : (
        <WriteActions projectId={projectId} again={rows.length > 0} />
      )}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline-strong bg-surface px-5 py-6 text-sm text-ink-muted" data-testid="actions-empty">{sample ? ACTIONS_COPY.none : ACTIONS_COPY.empty}</p>
      ) : (
        <ol className="flex flex-col gap-3" data-testid="actions-list">
          {rows.map((r) => (
            <li key={r.id} className="card flex flex-col gap-2 p-4" data-testid="action" data-state={r.state}>
              <div className="flex flex-wrap items-center gap-2">
                {r.kind && <NeutralPill data-testid="action-kind">{ACTIONS_COPY.kinds[r.kind]}</NeutralPill>}
                {r.state !== "open" && <NeutralPill>{ACTIONS_COPY.states[r.state]}</NeutralPill>}
              </div>
              <h3 className="text-[15px] font-bold" data-testid="action-title">{r.title}</h3>
              {r.why && <p className="text-sm" data-testid="action-why">{r.why}</p>}
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted" aria-label={ACTIONS_COPY.citedBy} data-testid="action-citations">
                {citationLines(r.answers, r.missing, RESPONSES_COPY.anonymous).map((c, i) => (
                  <li key={i} data-testid="action-citation">
                    {c.itemId ? <Link href={itemHref(c.itemId)} scroll={false} data-item-link={c.itemId} className="rounded-sm underline underline-offset-4 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface">{c.text}</Link> : c.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
