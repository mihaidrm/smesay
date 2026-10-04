// Where groups disagree (stories/E8-6; the PM app board, under the agreement table): for the
// dropdown field picked (Role by default), the four items whose groups differ most in their
// agreement share, each with a bar per group (Brand 06's comparison bars) and a line per
// group, then "Show all" for every item (a native details element: no script). The gap and
// the order come from SQL (src/db/queries/results.ts gaps.byField) under the page's filter
// and switch. A group with fewer than 3 answers on an item is shown with no numbers and is
// not compared (decision 0031), with the banner. Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { Banner } from "@/components/ui/banner";
import { gaps as gapsQuery, type GapItem } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { AGREEMENT_COPY, CONFLICT_COPY } from "@/lib/results-copy";
import type { FilterContext, ResultsFilter } from "@/lib/results-filter";
import { GapField } from "./gap-field";

const SHOWN = 4;

type Props = { ws: WorkspaceId; instrumentId: string; filter: ResultsFilter; ctx: FilterContext; items: Map<string, { reference: string | null; title: string }>; itemHref: (id: string) => string; bannerAbove: boolean };

export async function ConflictView({ ws, instrumentId, filter, ctx, items, itemHref, bannerAbove }: Props) {
  const field = ctx.fields.find((f) => f.type === "dropdown" && f.key === filter.gaps);
  if (!field) return null;
  const rows = await gapsQuery.byField(ws, instrumentId, filter, field.key);
  const top = rows.filter((r) => r.gap !== null).slice(0, SHOWN);
  // The banner once per page: not again when the split above already shows it.
  const small = !bannerAbove && rows.some((r) => r.groups.some((g) => !g.compared));
  return (
    <section className="card flex flex-col gap-4 p-4" aria-labelledby="gaps-title" data-testid="conflict-view">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="gaps-title" className="text-[15px] font-bold">{CONFLICT_COPY.title(field.label)}</h3>
        <GapField filter={filter} ctx={ctx} />
      </div>
      {small && <Banner data-testid="gaps-small-groups">{AGREEMENT_COPY.smallGroups}</Banner>}
      {top.length === 0 ? <p className="text-sm text-ink-muted" data-testid="gaps-none">{CONFLICT_COPY.noGap}</p> : (
        <ul className="flex flex-col divide-y divide-hairline" data-testid="gaps-top">
          {top.map((r) => <GapRow key={r.itemId} row={r} item={items.get(r.itemId)} href={itemHref(r.itemId)} />)}
        </ul>
      )}
      {rows.length > 0 && (
        <details className="group">
          <summary className="w-fit cursor-pointer rounded-sm text-sm font-semibold text-violet-text outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="gaps-show-all">{CONFLICT_COPY.showAll(rows.length)}</summary>
          <ul className="mt-2 flex flex-col divide-y divide-hairline" data-testid="gaps-all">
            {rows.map((r) => <GapRow key={r.itemId} row={r} item={items.get(r.itemId)} href={itemHref(r.itemId)} />)}
          </ul>
        </details>
      )}
    </section>
  );
}

function GapRow({ row, item, href }: { row: GapItem; item: { reference: string | null; title: string } | undefined; href: string }) {
  const line = row.groups.map((g) => (g.compared ? CONFLICT_COPY.groupLine(g.group, g.agree, g.answered) : CONFLICT_COPY.smallLine(g.group))).join(" ");
  return (
    <li className="flex flex-col gap-2 py-3" data-testid="gap-row">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} scroll={false} className="rounded-sm text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="gap-item">
          {item?.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{item.reference}</span>}
          {item?.title ?? ""}
        </Link>
        {row.gap !== null && <span className="shrink-0 font-mono text-xs font-bold" data-testid="gap-points">{CONFLICT_COPY.points(row.gap)}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        {row.groups.map((g) => (
          <div key={g.group} className="flex items-center gap-2 text-xs" data-testid="gap-group" data-group={g.group}>
            <span className="w-28 shrink-0 truncate text-ink-muted">{g.group}</span>
            {g.compared ? (
              <div role="img" aria-label={CONFLICT_COPY.barTitle(g.group, g.agree, g.answered)} className="h-2 grow rounded-full bg-tint">
                <div className="h-2 rounded-full bg-agree" style={{ width: `${Math.round((100 * g.agree) / g.answered)}%` }} />
              </div>
            ) : (
              <div role="img" aria-label={CONFLICT_COPY.smallBar(g.group)} className="h-2 grow rounded-full border border-dashed border-hairline-strong" />
            )}
            <span className="w-16 shrink-0 text-right font-mono" aria-hidden="true">{g.compared ? `${g.agree} of ${g.answered}` : ""}</span>
          </div>
        ))}
      </div>
      {line && <p className="text-xs text-ink-muted" data-testid="gap-line">{line}</p>}
    </li>
  );
}
