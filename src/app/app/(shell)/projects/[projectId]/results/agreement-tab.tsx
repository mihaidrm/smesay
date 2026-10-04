// The Agreement tab (stories/E8-3; design note 40): the areas in the list's order, each with
// its items, in the view the PM keeps (Table: a stacked bar per item with its counts in words,
// the compact default; Columns: aligned bars per kind per area, the readable one; Share: a
// donut per area and one for the whole list), split by a dropdown field on request, sorted
// within each area. The counts come from src/db/queries/results.ts agreement.byItem with the
// page's filter (SQL), the model from src/lib/results-agreement.ts. Where no proposal was
// shown (rate-blind) every view shows the values picked, and a figure reads "[N] rated", never
// a percentage. A group with fewer than 3 answers on an item, or summed over items with fewer
// than 3 people, is drawn but not compared (decision 0031), with the banner once. An item's
// title opens its detail (E8-5). Under the views, where groups disagree (E8-6,
// conflict-view.tsx). Copy: docs/copy/app.md, Results.
import Link from "next/link";
import { AlignedBars, Donut, Legend, StackedBar, type Series } from "@/components/app/charts";
import { FadeOnChange } from "@/components/app/fade-on-change";
import { Banner } from "@/components/ui/banner";
import { items as itemsQuery, itemSets } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor } from "@/lib/item-text";
import { addCounts, agreementSortOf, allRated, answeredOf, buildAgreement, EMPTY_COUNTS, figureOf, groupTotals, kindSeries, valueSeries, type AreaBlock, type Counts, type GroupTotal, type Row } from "@/lib/results-agreement";
import { AGREEMENT_COPY } from "@/lib/results-copy";
import { filterActive, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";
import { AgreementControls, type AgreementView } from "./agreement-controls";
import { ConflictView } from "./conflict-view";

type Props = { ws: WorkspaceId; projectId: string; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; view: AgreementView; itemHref: (id: string) => string };
type SeriesOf = (c: Counts) => Series[];

export async function AgreementTab({ ws, projectId, instrument, filter, ctx, view, itemHref }: Props) {
  const [set, rows, counts] = await Promise.all([itemSets.get(ws, instrument.itemSetId), itemsQuery.forSet(ws, instrument.itemSetId), agreement.byItem(ws, instrument.id, filter, filter.split)]);
  const method = instrument.method;
  const listItems = rows.map((it) => ({ id: it.id, reference: it.sourceRef, title: textFor(it), area: it.area, proposed: instrument.showProposed ? proposedCode(method, it.proposedValue) : null, position: it.position }));
  const sort = agreementSortOf(filter.sort);
  const split = filter.split !== null;
  const areas = buildAgreement(listItems, (set?.areas ?? []).map((a) => a.name), counts, split, sort, AGREEMENT_COPY.groupNone);
  const blind = !instrument.showProposed;
  const series: SeriesOf = (c) => (blind ? valueSeries(c, method, instrument.scaleLabels) : kindSeries(c));
  const list = areas.reduce<Counts>((a, b) => addCounts(a, b.totals), EMPTY_COUNTS);
  const coverage = instrument.perspectives.length > 0;
  // The banner once, when the view draws a group it does not compare.
  const small = split && (view === "table" ? areas.some((a) => a.rows.some((r) => r.groups.some((g) => !g.compared)))
    : view === "columns" ? areas.some((a) => groupTotals(a.rows).some((g) => !g.compared))
    : groupTotals(areas.flatMap((a) => a.rows)).some((g) => !g.compared));
  const proposedLabel = (code: string | null) => (code ? (labelFor(method, instrument.scaleLabels, code) ?? code) : "");
  return (
    <div className="flex flex-col gap-4" data-testid="agreement-tab">
      <AgreementControls projectId={projectId} view={view} filter={filter} ctx={ctx} sort={sort} />
      {small && <Banner data-testid="small-groups">{AGREEMENT_COPY.smallGroups}</Banner>}
      <Legend series={series(list)} />
      {blind && <p className="text-xs text-ink-muted">{AGREEMENT_COPY.valuesLegend}</p>}
      {view === "table" && areas.map((a) => <TableArea key={a.name ?? ""} area={a} series={series} coverage={coverage} blind={blind} proposedLabel={proposedLabel} itemHref={itemHref} />)}
      {view === "columns" && <ColumnsView areas={areas} series={series} split={split} />}
      {view === "share" && <ShareView areas={areas} list={list} series={series} rated={blind || allRated(areas)} split={split} none={filterActive(filter) || !filter.includeUnsubmitted ? AGREEMENT_COPY.noAnswersLine : AGREEMENT_COPY.noAnswersYet} />}
      {/* Where groups disagree (E8-6): agreement shares, so only items with a proposal shown,
          and not on a rate-blind list or one where no item has a proposal. */}
      {!blind && !allRated(areas) && <ConflictView ws={ws} instrumentId={instrument.id} filter={filter} ctx={ctx} items={new Map(listItems.filter((it) => it.proposed !== null).map((it) => [it.id, { reference: it.reference, title: it.title }]))} order={areas.flatMap((a) => a.rows.map((r) => r.id))} itemHref={itemHref} bannerAbove={small} />}
    </div>
  );
}

const areaName = (a: AreaBlock) => a.name ?? AGREEMENT_COPY.otherItems;
// Why a summed group is not compared (decision 0031).
const shortText = (g: GroupTotal) => (g.short === "people" ? AGREEMENT_COPY.notComparedPeople : AGREEMENT_COPY.notCompared);

// The figure beside a bar: the agreement percentage, "[N] rated" where no proposal was shown
// (`rated`) or only values were rated, or "No answers".
function figureText(c: Counts, rated: boolean): string {
  const f = figureOf(c, rated);
  if (f === null) return AGREEMENT_COPY.noPercent;
  return "percent" in f ? `${f.percent}%` : AGREEMENT_COPY.ratedLine(f.rated);
}

// The counts in words under a bar (acceptance 1): every series with a count, in the legend's
// order, so no count hides in a narrow segment and colour is never the only cue.
function countsText(series: Series[]): string {
  const shown = series.filter((s) => s.value > 0);
  if (shown.length === 0) return AGREEMENT_COPY.noPercent;
  return shown.map((s) => `${s.value} ${s.key.startsWith("value-") ? s.label : s.label.toLowerCase()}`).join(" · ");
}

// One table per area, its totals as the first row so the area's bar lines up with the items'.
// A rate-blind list has no Proposed column, and its figure column reads Rated.
function TableArea({ area, series, coverage, blind, proposedLabel, itemHref }: { area: AreaBlock; series: SeriesOf; coverage: boolean; blind: boolean; proposedLabel: (code: string | null) => string; itemHref: (id: string) => string }) {
  return (
    <section className="card flex flex-col p-0" aria-label={areaName(area)} data-testid="agreement-area" data-area={areaName(area)}>
      <h3 className="px-4 pt-3 text-[15px] font-bold">{areaName(area)}</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-ink-muted">
            <th scope="col" className="px-4 pt-2 font-semibold">{AGREEMENT_COPY.item}</th>
            {!blind && <th scope="col" className="px-2 pt-2 font-semibold">{AGREEMENT_COPY.proposed}</th>}
            <th scope="col" className="px-2 pt-2 font-semibold">{AGREEMENT_COPY.answers}</th>
            <th scope="col" className="px-4 pt-2 text-right font-semibold">{blind ? AGREEMENT_COPY.rated : AGREEMENT_COPY.agreement}</th>
            {coverage && <th scope="col" className="px-4 pt-2 text-right font-semibold">{AGREEMENT_COPY.coverage}</th>}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-hairline bg-tint" data-testid="area-totals">
            <th scope="row" colSpan={blind ? 1 : 2} className="px-4 py-2.5 text-xs font-semibold">{AGREEMENT_COPY.allItems}</th>
            <td className="w-[260px] px-2 py-2">
              <StackedBar title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.areaTotal(areaName(area)))} series={series(area.totals)} />
              <p className="mt-1 font-mono text-[11px] text-ink-muted" data-testid="area-counts">{countsText(series(area.totals))}</p>
            </td>
            <td className="w-[88px] px-4 text-right font-mono font-bold">{figureText(area.totals, area.rated)}</td>
            {coverage && <td />}
          </tr>
          {area.rows.map((r) => <ItemRows key={r.id} row={r} series={series} coverage={coverage} blind={blind} proposedLabel={proposedLabel} itemHref={itemHref} />)}
        </tbody>
      </table>
    </section>
  );
}

function ItemRows({ row, series, coverage, blind, proposedLabel, itemHref }: { row: Row; series: SeriesOf; coverage: boolean; blind: boolean; proposedLabel: (code: string | null) => string; itemHref: (id: string) => string }) {
  const what = [row.reference, row.title].filter(Boolean).join(" ");
  const rated = row.proposed === null;
  return (
    <>
      <tr className="border-t border-hairline" data-testid="agreement-row" data-ref={row.reference ?? ""}>
        <th scope="row" className="w-[42%] px-4 py-2.5 font-normal">
          <Link href={itemHref(row.id)} scroll={false} data-item-link={row.id} className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="agreement-item">
            {row.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{row.reference}</span>}
            {row.title}
          </Link>
        </th>
        {!blind && <td className="px-2 text-xs whitespace-nowrap text-ink-muted">{proposedLabel(row.proposed)}</td>}
        <td className="w-[260px] px-2 py-2">
          <StackedBar title={AGREEMENT_COPY.chartTitle(what)} series={series(row.counts)} />
          <p className="mt-1 font-mono text-[11px] text-ink-muted" data-testid="row-counts">{countsText(series(row.counts))}</p>
        </td>
        <td className="w-[88px] px-4 text-right font-mono font-bold"><FadeOnChange value={figureText(row.counts, rated)} className="inline-block rounded-md">{figureText(row.counts, rated)}</FadeOnChange></td>
        {coverage && <td className="px-4 text-right font-mono text-xs whitespace-nowrap text-ink-muted" data-testid="row-coverage">{`${answeredOf(row.counts) + row.counts.pick} of ${row.counts.couldSee}`}</td>}
      </tr>
      {row.groups.map((g) => (
        <tr key={`${g.empty}:${g.group}`} className={g.compared ? "" : "opacity-60"} data-testid="agreement-group" data-group={g.group}>
          <th scope="row" colSpan={blind ? 1 : 2} className="px-4 py-1.5 pl-10 text-xs font-semibold text-ink-muted">{g.group}</th>
          <td className="px-2 py-1">
            <StackedBar title={AGREEMENT_COPY.chartTitle(`${what}, ${g.group}`)} series={series(g.counts)} className="h-3" />
            <p className="mt-0.5 font-mono text-[11px] text-ink-muted" data-testid="group-counts">{countsText(series(g.counts))}</p>
          </td>
          <td className="px-4 text-right font-mono text-xs">{g.compared ? figureText(g.counts, rated) : ""}</td>
          {coverage && <td />}
        </tr>
      ))}
    </>
  );
}

function ColumnsView({ areas, series, split }: { areas: AreaBlock[]; series: SeriesOf; split: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {areas.map((a) => {
        const groups = split ? groupTotals(a.rows) : [];
        // One scale for every group of the area, so the groups compare (acceptance 4).
        const max = Math.max(1, ...groups.flatMap((g) => series(g.counts).map((s) => s.value)));
        return (
          <section key={a.name ?? ""} className="card flex flex-col gap-3 p-4" aria-label={areaName(a)} data-testid="columns-area" data-area={areaName(a)}>
            <h3 className="text-[15px] font-bold">{areaName(a)} <span className="font-mono text-sm text-ink-muted">{figureText(a.totals, a.rated)}</span></h3>
            {!split ? <AlignedBars title={AGREEMENT_COPY.chartTitle(areaName(a))} series={series(a.totals)} /> : groups.map((g) => (
              <div key={`${g.empty}:${g.group}`} className={g.compared ? "" : "opacity-60"} data-testid="columns-group" data-group={g.group}>
                <p className="text-xs font-semibold text-ink-muted">{g.group}{g.compared ? "" : `, ${shortText(g)}`}</p>
                <AlignedBars title={AGREEMENT_COPY.chartTitle(`${areaName(a)}, ${g.group}`)} series={series(g.counts)} max={max} className="h-24" />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// `rated`: no proposal was shown on any item of the list (rate-blind, or none proposed), so
// the list and its groups read values rated; an area reads its own (AreaBlock.rated).
function ShareView({ areas, list, series, rated, split, none }: { areas: AreaBlock[]; list: Counts; series: SeriesOf; rated: boolean; split: boolean; none: string }) {
  // The line beside a donut follows the figure's rule: nothing answered, values rated (no
  // proposal shown, or answers that are all values rated), or agree of answered.
  const line = (c: Counts, noProposal = rated) => {
    const f = figureOf(c, noProposal);
    return f === null ? none : "rated" in f ? AGREEMENT_COPY.ratedLine(f.rated) : AGREEMENT_COPY.agreeLine(c.agree, answeredOf(c));
  };
  const groups: GroupTotal[] = split ? groupTotals(areas.flatMap((a) => a.rows)) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-4" aria-label={AGREEMENT_COPY.wholeList} data-testid="share-list">
        <h3 className="mb-3 text-[15px] font-bold">{AGREEMENT_COPY.wholeList}</h3>
        <Donut title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.wholeList)} series={series(list)} line={line(list)} />
      </section>
      {split ? groups.map((g) => (
        <section key={`${g.empty}:${g.group}`} className={g.compared ? "card p-4" : "card p-4 opacity-60"} aria-label={g.group} data-testid="share-group">
          <h3 className="mb-3 text-[15px] font-bold">{g.group}</h3>
          <Donut title={AGREEMENT_COPY.chartTitle(g.group)} series={series(g.counts)} line={g.compared ? line(g.counts) : shortText(g)} />
        </section>
      )) : areas.map((a) => (
        <section key={a.name ?? ""} className="card p-4" aria-label={areaName(a)} data-testid="share-area">
          <h3 className="mb-3 text-[15px] font-bold">{areaName(a)}</h3>
          <Donut title={AGREEMENT_COPY.chartTitle(areaName(a))} series={series(a.totals)} line={line(a.totals, a.rated)} />
        </section>
      ))}
    </div>
  );
}
