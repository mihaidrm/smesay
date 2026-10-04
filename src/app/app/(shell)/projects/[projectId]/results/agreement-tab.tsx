// The Agreement tab (stories/E8-3; design note 40): the areas in the list's order, each with
// its items, in the view the PM keeps (Table: a stacked bar per item, the compact default;
// Columns: aligned bars per kind per area, the readable one; Share: a donut per area and one
// for the whole list), split by a dropdown field on request, sorted within each area. The
// counts come from src/db/queries/results.ts agreement.byItem with the page's filter (SQL),
// the model from src/lib/results-agreement.ts. Where no proposal was shown (rate-blind) every
// view shows the values picked. Groups with fewer than 3 answers are drawn but not compared
// (MIN_GROUP; E8-6's banner). Copy: docs/copy/app.md, Results.
import { AlignedBars, Donut, Legend, StackedBar, type Series } from "@/components/app/charts";
import { Banner } from "@/components/ui/banner";
import { items as itemsQuery, itemSets } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { textFor } from "@/lib/item-text";
import { addCounts, agreementSortOf, answeredOf, buildAgreement, EMPTY_COUNTS, kindSeries, MIN_GROUP, valueSeries, type AreaBlock, type Counts, type Row } from "@/lib/results-agreement";
import { AGREEMENT_COPY } from "@/lib/results-copy";
import type { FilterContext, ResultsFilter } from "@/lib/results-filter";
import { labelFor, proposedCode } from "@/lib/scoring";
import { AgreementControls, type AgreementView } from "./agreement-controls";

type Props = { ws: WorkspaceId; projectId: string; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; view: AgreementView };

export async function AgreementTab({ ws, projectId, instrument, filter, ctx, view }: Props) {
  const [set, rows, counts] = await Promise.all([itemSets.get(ws, instrument.itemSetId), itemsQuery.forSet(ws, instrument.itemSetId), agreement.byItem(ws, instrument.id, filter, filter.split)]);
  const method = instrument.method;
  const listItems = rows.map((it) => ({ id: it.id, reference: it.sourceRef, title: textFor(it), area: it.area, proposed: instrument.showProposed ? proposedCode(method, it.proposedValue) : null, position: it.position }));
  const sort = agreementSortOf(filter.sort);
  const areas = buildAgreement(listItems, (set?.areas ?? []).map((a) => a.name), counts, filter.split !== null, sort);
  const blind = !instrument.showProposed;
  const series = (c: Counts): Series[] => (blind ? valueSeries(c, method, instrument.scaleLabels) : kindSeries(c));
  const list = areas.reduce<Counts>((a, b) => addCounts(a, b.totals), EMPTY_COUNTS);
  const coverage = instrument.perspectives.length > 0;
  const small = filter.split !== null && areas.some((a) => a.rows.some((r) => r.groups.some((g) => !g.compared)));
  const proposedLabel = (code: string | null) => (code ? (labelFor(method, instrument.scaleLabels, code) ?? code) : "");
  return (
    <div className="flex flex-col gap-4" data-testid="agreement-tab">
      <AgreementControls projectId={projectId} view={view} filter={filter} ctx={ctx} sort={sort} />
      {small && <Banner data-testid="small-groups">{AGREEMENT_COPY.smallGroups}</Banner>}
      <Legend series={series(list)} />
      {blind && <p className="text-xs text-ink-muted">{AGREEMENT_COPY.valuesLegend}</p>}
      {view === "table" && areas.map((a) => <TableArea key={a.name ?? ""} area={a} series={series} coverage={coverage} proposedLabel={proposedLabel} />)}
      {view === "columns" && <ColumnsView areas={areas} series={series} split={filter.split !== null} />}
      {view === "share" && <ShareView areas={areas} list={list} series={series} blind={blind} split={filter.split !== null} />}
    </div>
  );
}

const areaName = (a: AreaBlock) => a.name ?? AGREEMENT_COPY.otherItems;
const percentText = (p: number | null) => (p === null ? AGREEMENT_COPY.noPercent : `${p}%`);

function TableArea({ area, series, coverage, proposedLabel }: { area: AreaBlock; series: (c: Counts) => Series[]; coverage: boolean; proposedLabel: (code: string | null) => string }) {
  return (
    <section className="card flex flex-col p-0" aria-label={areaName(area)} data-testid="agreement-area" data-area={areaName(area)}>
      <div className="grid grid-cols-[minmax(0,1fr)_260px_64px] items-center gap-4 border-b border-hairline px-4 py-3">
        <h3 className="text-[15px] font-bold">{areaName(area)}</h3>
        <StackedBar title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.areaTotal(areaName(area)))} series={series(area.totals)} />
        <span className="text-right font-mono text-sm font-bold">{percentText(area.percent)}</span>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="sr-only">
          <tr><th scope="col">{AGREEMENT_COPY.item}</th><th scope="col">{AGREEMENT_COPY.proposed}</th><th scope="col">{AGREEMENT_COPY.answers}</th><th scope="col">{AGREEMENT_COPY.agreement}</th>{coverage && <th scope="col">{AGREEMENT_COPY.coverage}</th>}</tr>
        </thead>
        <tbody>
          {area.rows.map((r) => <ItemRows key={r.id} row={r} series={series} coverage={coverage} proposedLabel={proposedLabel} />)}
        </tbody>
      </table>
    </section>
  );
}

function ItemRows({ row, series, coverage, proposedLabel }: { row: Row; series: (c: Counts) => Series[]; coverage: boolean; proposedLabel: (code: string | null) => string }) {
  const what = [row.reference, row.title].filter(Boolean).join(" ");
  return (
    <>
      <tr className="border-t border-hairline first:border-t-0" data-testid="agreement-row" data-ref={row.reference ?? ""}>
        <th scope="row" className="w-[45%] px-4 py-2.5 font-normal">
          {row.reference && <span className="mr-2 font-mono text-xs text-ink-muted">{row.reference}</span>}
          {row.title}
        </th>
        <td className="px-2 text-xs whitespace-nowrap text-ink-muted">{proposedLabel(row.proposed)}</td>
        <td className="w-[260px] px-2"><StackedBar title={AGREEMENT_COPY.chartTitle(what)} series={series(row.counts)} /></td>
        <td className="w-16 px-4 text-right font-mono font-bold">{percentText(row.percent)}</td>
        {coverage && <td className="px-4 text-right font-mono text-xs whitespace-nowrap text-ink-muted">{`${answeredOf(row.counts) + row.counts.pick} of ${row.counts.couldSee}`}</td>}
      </tr>
      {row.groups.map((g) => (
        <tr key={g.group} className={g.compared ? "" : "opacity-60"} data-testid="agreement-group" data-group={g.group}>
          <th scope="row" className="px-4 py-1.5 pl-10 text-xs font-semibold text-ink-muted">{g.group}</th>
          <td />
          <td className="px-2"><StackedBar title={AGREEMENT_COPY.chartTitle(`${what}, ${g.group}`)} series={series(g.counts)} className="h-3" /></td>
          <td className="px-4 text-right font-mono text-xs">{g.compared ? percentText(g.percent) : ""}</td>
          {coverage && <td />}
        </tr>
      ))}
    </>
  );
}

// The groups of an area, summed over its items (for the split in Columns and Share).
function groupTotals(rows: Row[]): { group: string; counts: Counts }[] {
  const by = new Map<string, Counts>();
  for (const r of rows) for (const g of r.groups) by.set(g.group, addCounts(by.get(g.group) ?? EMPTY_COUNTS, g.counts));
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([group, counts]) => ({ group, counts }));
}
const compared = (c: Counts) => answeredOf(c) + c.pick >= MIN_GROUP;

function ColumnsView({ areas, series, split }: { areas: AreaBlock[]; series: (c: Counts) => Series[]; split: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {areas.map((a) => (
        <section key={a.name ?? ""} className="card flex flex-col gap-3 p-4" aria-label={areaName(a)} data-testid="columns-area" data-area={areaName(a)}>
          <h3 className="text-[15px] font-bold">{areaName(a)} <span className="font-mono text-sm text-ink-muted">{percentText(a.percent)}</span></h3>
          {!split ? <AlignedBars title={AGREEMENT_COPY.chartTitle(areaName(a))} series={series(a.totals)} /> : groupTotals(a.rows).map((g) => (
            <div key={g.group} className={compared(g.counts) ? "" : "opacity-60"}>
              <p className="text-xs font-semibold text-ink-muted">{g.group}{compared(g.counts) ? "" : `, ${AGREEMENT_COPY.notCompared}`}</p>
              <AlignedBars title={AGREEMENT_COPY.chartTitle(`${areaName(a)}, ${g.group}`)} series={series(g.counts)} className="h-24" />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function ShareView({ areas, list, series, blind, split }: { areas: AreaBlock[]; list: Counts; series: (c: Counts) => Series[]; blind: boolean; split: boolean }) {
  const line = (c: Counts) => (blind ? AGREEMENT_COPY.ratedLine(c.pick + c.unclear) : AGREEMENT_COPY.agreeLine(c.agree, answeredOf(c)));
  const groups = split ? groupTotals(areas.flatMap((a) => a.rows)) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card p-4" aria-label={AGREEMENT_COPY.wholeList} data-testid="share-list">
        <h3 className="mb-3 text-[15px] font-bold">{AGREEMENT_COPY.wholeList}</h3>
        <Donut title={AGREEMENT_COPY.chartTitle(AGREEMENT_COPY.wholeList)} series={series(list)} line={line(list)} />
      </section>
      {split ? groups.map((g) => (
        <section key={g.group} className={compared(g.counts) ? "card p-4" : "card p-4 opacity-60"} aria-label={g.group} data-testid="share-group">
          <h3 className="mb-3 text-[15px] font-bold">{g.group}</h3>
          <Donut title={AGREEMENT_COPY.chartTitle(g.group)} series={series(g.counts)} line={compared(g.counts) ? line(g.counts) : AGREEMENT_COPY.notCompared} />
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

