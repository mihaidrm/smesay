// The Agreement tab (stories/E8-3; design note 40): the areas in the list's order, each with
// its items, in the view the PM keeps (Table: a stacked bar per item with its counts in words,
// the compact default; Columns: aligned bars per kind per area, the readable one; Share: a
// donut per area and one for the whole list), split by a dropdown field on request, sorted
// within each area. The counts come from src/db/queries/results.ts agreement.byItem with the
// page's filter (SQL), the model from src/lib/results-agreement.ts. Where no proposal was
// shown (rate-blind) every view shows the values picked, and a figure reads "[N] rated", never
// a percentage. A group with fewer than 3 answers on an item, or summed over items with fewer
// than 3 people, is drawn but not compared (decision 0031), with the banner once. Copy:
// docs/copy/app.md, Results.
import { AlignedBars, Donut, Legend, StackedBar, type Series } from "@/components/app/charts";
import { Banner } from "@/components/ui/banner";
import { items as itemsQuery, itemSets } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor } from "@/lib/item-text";
import { addCounts, agreementSortOf, answeredOf, buildAgreement, EMPTY_COUNTS, figureOf, groupTotals, kindSeries, valueSeries, type AreaBlock, type Counts, type GroupTotal, type Row } from "@/lib/results-agreement";
import { AGREEMENT_COPY } from "@/lib/results-copy";
import type { FilterContext, ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";
import { AgreementControls, type AgreementView } from "./agreement-controls";

type Props = { ws: WorkspaceId; projectId: string; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; view: AgreementView };
type SeriesOf = (c: Counts) => Series[];

export async function AgreementTab({ ws, projectId, instrument, filter, ctx, view }: Props) {
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
      {view === "table" && areas.map((a) => <TableArea key={a.name ?? ""} area={a} series={series} coverage={coverage} proposedLabel={proposedLabel} />)}
      {view === "columns" && <ColumnsView areas={areas} series={series} split={split} />}
      {view === "share" && <ShareView areas={areas} list={list} series={series} blind={blind} split={split} />}
    </div>
  );
}

const areaName = (a: AreaBlock) => a.name ?? AGREEMENT_COPY.otherItems;

// The figure beside a bar: the agreement percentage, "[N] rated" where only values were rated
// with no proposal, or "No answers".
function figureText(c: Counts): string {
  const f = figureOf(c);
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

function TableArea({ area, series, coverage, proposedLabel }: { area: AreaBlock; series: SeriesOf; coverage: boolean; proposedLabel: (code: string | null) => string }) {
  return (
    <section className="card flex flex-col p-0" aria-label={areaName(area)} data-testid="agreement-area" data-area={areaName(area)}>
      <div className="grid grid-cols-[minmax(0,1fr)_260px_88px] items-center gap-x-4 gap-y-1 border-b border-hairline px-4 py-3">
        <h3 className="text-[15px] font-bold">{areaName(area)}</h3>
        <StackedBar title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.areaTotal(areaName(area)))} series={series(area.totals)} />
        <span className="text-right font-mono text-sm font-bold">{figureText(area.totals)}</span>
        <span />
        <span className="font-mono text-[11px] text-ink-muted" data-testid="area-counts">{countsText(series(area.totals))}</span>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-ink-muted">
            <th scope="col" className="px-4 pt-2 font-semibold">{AGREEMENT_COPY.item}</th>
            <th scope="col" className="px-2 pt-2 font-semibold">{AGREEMENT_COPY.proposed}</th>
            <th scope="col" className="px-2 pt-2 font-semibold">{AGREEMENT_COPY.answers}</th>
            <th scope="col" className="px-4 pt-2 text-right font-semibold">{AGREEMENT_COPY.agreement}</th>
            {coverage && <th scope="col" className="px-4 pt-2 text-right font-semibold">{AGREEMENT_COPY.coverage}</th>}
          </tr>
        </thead>
        <tbody>
          {area.rows.map((r) => <ItemRows key={r.id} row={r} series={series} coverage={coverage} proposedLabel={proposedLabel} />)}
        </tbody>
      </table>
    </section>
  );
}

function ItemRows({ row, series, coverage, proposedLabel }: { row: Row; series: SeriesOf; coverage: boolean; proposedLabel: (code: string | null) => string }) {
  const what = [row.reference, row.title].filter(Boolean).join(" ");
  return (
    <>
      <tr className="border-t border-hairline" data-testid="agreement-row" data-ref={row.reference ?? ""}>
        <th scope="row" className="w-[42%] px-4 py-2.5 font-normal">
          {row.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{row.reference}</span>}
          {row.title}
        </th>
        <td className="px-2 text-xs whitespace-nowrap text-ink-muted">{proposedLabel(row.proposed)}</td>
        <td className="w-[260px] px-2 py-2">
          <StackedBar title={AGREEMENT_COPY.chartTitle(what)} series={series(row.counts)} />
          <p className="mt-1 font-mono text-[11px] text-ink-muted" data-testid="row-counts">{countsText(series(row.counts))}</p>
        </td>
        <td className="w-[88px] px-4 text-right font-mono font-bold">{figureText(row.counts)}</td>
        {coverage && <td className="px-4 text-right font-mono text-xs whitespace-nowrap text-ink-muted" data-testid="row-coverage">{`${answeredOf(row.counts) + row.counts.pick} of ${row.counts.couldSee}`}</td>}
      </tr>
      {row.groups.map((g) => (
        <tr key={g.group} className={g.compared ? "" : "opacity-60"} data-testid="agreement-group" data-group={g.group}>
          <th scope="row" className="px-4 py-1.5 pl-10 text-xs font-semibold text-ink-muted">{g.group}</th>
          <td />
          <td className="px-2"><StackedBar title={AGREEMENT_COPY.chartTitle(`${what}, ${g.group}`)} series={series(g.counts)} className="h-3" /></td>
          <td className="px-4 text-right font-mono text-xs">{g.compared ? figureText(g.counts) : ""}</td>
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
            <h3 className="text-[15px] font-bold">{areaName(a)} <span className="font-mono text-sm text-ink-muted">{figureText(a.totals)}</span></h3>
            {!split ? <AlignedBars title={AGREEMENT_COPY.chartTitle(areaName(a))} series={series(a.totals)} /> : groups.map((g) => (
              <div key={g.group} className={g.compared ? "" : "opacity-60"} data-testid="columns-group" data-group={g.group}>
                <p className="text-xs font-semibold text-ink-muted">{g.group}{g.compared ? "" : `, ${AGREEMENT_COPY.notCompared}`}</p>
                <AlignedBars title={AGREEMENT_COPY.chartTitle(`${areaName(a)}, ${g.group}`)} series={series(g.counts)} max={max} className="h-24" />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function ShareView({ areas, list, series, blind, split }: { areas: AreaBlock[]; list: Counts; series: SeriesOf; blind: boolean; split: boolean }) {
  const line = (c: Counts) => (answeredOf(c) + c.pick === 0 ? AGREEMENT_COPY.noAnswersLine : blind ? AGREEMENT_COPY.ratedLine(c.pick) : AGREEMENT_COPY.agreeLine(c.agree, answeredOf(c)));
  const groups: GroupTotal[] = split ? groupTotals(areas.flatMap((a) => a.rows)) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-4" aria-label={AGREEMENT_COPY.wholeList} data-testid="share-list">
        <h3 className="mb-3 text-[15px] font-bold">{AGREEMENT_COPY.wholeList}</h3>
        <Donut title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.wholeList)} series={series(list)} line={line(list)} />
      </section>
      {split ? groups.map((g) => (
        <section key={g.group} className={g.compared ? "card p-4" : "card p-4 opacity-60"} aria-label={g.group} data-testid="share-group">
          <h3 className="mb-3 text-[15px] font-bold">{g.group}</h3>
          <Donut title={AGREEMENT_COPY.chartTitle(g.group)} series={series(g.counts)} line={g.compared ? line(g.counts) : AGREEMENT_COPY.notCompared} />
        </section>
      )) : areas.map((a) => (
        <section key={a.name ?? ""} className="card p-4" aria-label={areaName(a)} data-testid="share-area">
          <h3 className="mb-3 text-[15px] font-bold">{areaName(a)}</h3>
          <Donut title={AGREEMENT_COPY.chartTitle(areaName(a))} series={series(a.totals)} line={line(a.totals)} />
        </section>
      ))}
    </div>
  );
}
