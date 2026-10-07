// The PDF summary's content (stories/E10-3, acceptance 1), read from the queries Results reads
// under the page's filter (results.numbers with tileView for the headline numbers, the
// Agreement tab's buildAgreement over agreement.byItem, registers.answers and registers.missing,
// results.signOffs, insights.listWithCitations), so the PDF says what the page says. The
// HTML is summary-html.ts; the PDF is pdf.ts.
import { insights, items as itemsQuery, itemSets } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement, registers, results } from "@/db/queries/results";
import type { WorkspaceId } from "@/db/types";
import { citationLines } from "@/lib/insights";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { agreementSortOf, buildAgreement, figureLine, notAnsweredOf, type Counts } from "@/lib/results-agreement";
import { AGREEMENT_COPY, REGISTERS_COPY, RESPONSES_COPY } from "@/lib/results-copy";
import { describeFilter, filterActive, type FilterContext, type ResultsFilter } from "@/lib/results-filter";
import { tileView, type TileId } from "@/lib/results-tiles";
import { labelFor, proposedCode } from "@/lib/scoring";
import { formatUtc } from "@/lib/sharing-format";
import { EXPORT_COPY } from "./copy";
import { SUMMARY_COPY, type SummaryCounts, type SummaryView } from "./summary-html";

const name = (p: { who: string | null; anon: number | null }) => p.who ?? RESPONSES_COPY.anonymous(p.anon ?? 0);
// A register row's respondent with the page's marks (registers-tab.tsx): not submitted, or
// changes not submitted again.
const marked = (p: { who: string | null; anon: number | null; submitted: boolean; changedSince: boolean }) =>
  `${name(p)}${!p.submitted ? `, ${REGISTERS_COPY.notSubmitted.toLowerCase()}` : p.changedSince ? `, ${RESPONSES_COPY.changedSince.toLowerCase()}` : ""}`;
const countsOf = (c: Counts): SummaryCounts => ({ agree: c.agree, change: c.change, disagree: c.disagree, unclear: c.unclear, pick: c.pick, notAnswered: notAnsweredOf(c) });
const figure = (percent: number | null, rated: boolean, c: Counts) => (rated ? AGREEMENT_COPY.ratedLine(c.pick) : percent === null ? AGREEMENT_COPY.noPercent : `${percent}%`);
// A share beside the agreement (decision 0062): empty where the figure reads rated or no answers.
const share = (percent: number | null, rated: boolean) => (rated || percent === null ? "" : `${percent}%`);

// Each register in the PDF stops at 20 rows (decision 0048): the heading keeps the full count
// and a line names the CSV on the Export tab with every row, which follows the same filter.
export const REGISTER_ROWS_MAX = 20;
const answersFile = EXPORT_COPY.tab.files.answers.title;
const missingFile = EXPORT_COPY.tab.files.missing.title;
export function register(title: string, columns: string[], all: string[][], file: string) {
  const rest = all.length - REGISTER_ROWS_MAX;
  return { title, columns, rows: all.slice(0, REGISTER_ROWS_MAX), total: all.length, more: rest > 0 ? SUMMARY_COPY.more(rest, file) : null, empty: REGISTERS_COPY.none };
}

export type SummaryInput = { ws: WorkspaceId; workspace: string; project: { id: string; name: string; isSample: boolean }; instrument: Instrument; filter: ResultsFilter; ctx: FilterContext; tiles: TileId[]; now: Date };

export async function summaryView({ ws, workspace, project, instrument, filter, ctx, tiles, now }: SummaryInput): Promise<SummaryView | null> {
  const keys = instrument.respondentFields.map((s) => s.key);
  const method = instrument.method;
  const [numbers, set, rows, counts, pushed, unclear, missing, signOffs, actions] = await Promise.all([
    results.numbers(ws, instrument.id, filter),
    itemSets.get(ws, instrument.itemSetId),
    itemsQuery.forSet(ws, instrument.itemSetId),
    agreement.byItem(ws, instrument.id, filter),
    registers.answers(ws, instrument.id, filter, ["change", "disagree"], keys, method),
    registers.answers(ws, instrument.id, filter, ["unclear"], keys, method),
    registers.missing(ws, instrument.id, filter, keys),
    results.signOffs(ws, instrument.id, filter),
    insights.listWithCitations(ws, project.id),
  ]);
  if (!numbers) return null;
  const label = (code: string | null) => (code ? (labelFor(method, instrument.scaleLabels, code) ?? code) : "");
  const listItems = rows.map((it) => ({ id: it.id, reference: it.sourceRef, title: textFor(it), area: it.area, proposed: instrument.showProposed ? proposedCode(method, it.proposedValue) : null, position: it.position }));
  const areas = buildAgreement(listItems, (set?.areas ?? []).map((a) => a.name), counts, false, agreementSortOf(null), AGREEMENT_COPY.groupNone);
  const areaName = (n: string | null) => n ?? AGREEMENT_COPY.otherItems;
  const itemOf = (r: { reference: string | null; itemText: string; readerStatus: string | null; readerText: string | null }) =>
    [r.reference ?? "", textFor({ readerStatus: r.readerStatus as ReaderFields["readerStatus"], readerText: r.readerText, originalText: r.itemText })] as const;
  const proposedOf = (v: string | null) => label(instrument.showProposed ? proposedCode(method, v) : null);
  const R = REGISTERS_COPY;
  const lines: string[] = [];
  if (filterActive(filter)) lines.push(EXPORT_COPY.filtered(describeFilter(filter, ctx)));
  if (filter.includeUnsubmitted) lines.push(EXPORT_COPY.withUnsubmitted);
  const confidence = [1, 2, 3, 4, 5].map((v) => signOffs.filter((s) => s.confidence === v).length);
  const order = { open: 0, done: 1, dismissed: 2 } as const;
  return {
    workspace, project: project.name, title: instrument.title, generatedAt: formatUtc(now), sample: project.isSample, lines,
    tiles: tiles.map((id) => tileView(id, numbers)).map((t) => ({ label: t.label, value: t.value })),
    areas: areas.map((a) => ({ name: areaName(a.name), counts: countsOf(a.totals), percent: figureLine(a.totals, a.rated) })),
    confidence,
    tables: areas.map((a) => ({
      area: areaName(a.name),
      rows: a.rows.map((r) => ({ ref: r.reference ?? "", text: r.title, proposed: label(r.proposed), counts: countsOf(r.counts), percent: figure(r.percent, r.proposed === null, r.counts), changePercent: share(r.changePercent, r.proposed === null), disagreePercent: share(r.disagreePercent, r.proposed === null) })),
    })),
    registers: [
      register(R.changeTitle, ["", R.item, R.respondent, R.proposed, R.theirValue, R.reason], pushed.filter((r) => r.kind === "change").map((r) => [...itemOf(r), marked(r), proposedOf(r.proposedValue), label(r.value), r.reason ?? ""]), answersFile),
      register(R.disagreeTitle, ["", R.item, R.respondent, R.reason], pushed.filter((r) => r.kind === "disagree").map((r) => [...itemOf(r), marked(r), r.reason ?? ""]), answersFile),
      register(R.unclearTitle, ["", R.item, R.respondent, R.question], unclear.map((r) => [...itemOf(r), marked(r), r.reason ?? ""]), answersFile),
      register(R.missingTitle, [R.missingText, R.respondent], missing.map((m) => [m.text, marked(m)]), missingFile),
    ],
    signOffs: signOffs.map((s) => ({ who: name(s), when: s.signedOff ? formatUtc(s.submittedAt) : `${formatUtc(s.submittedAt)}, ${RESPONSES_COPY.changedSince.toLowerCase()}`, confidence: s.confidence === null ? SUMMARY_COPY.noConfidence : String(s.confidence) })),
    actions: [...actions].sort((a, b) => order[a.state] - order[b.state]).map((a) => ({
      state: a.state === "open" ? ACTIONS_COPY.states.open : a.closedAt ? ACTIONS_COPY.closedOn(a.state, formatUtc(a.closedAt)) : ACTIONS_COPY.states[a.state],
      kind: a.kind ? ACTIONS_COPY.kinds[a.kind] : "",
      title: a.title, why: a.why ?? "",
      cites: `${ACTIONS_COPY.citedBy}: ${citationLines(a.answers, a.missing, RESPONSES_COPY.anonymous).map((c) => c.text).join("; ")}`,
    })),
  };
}
