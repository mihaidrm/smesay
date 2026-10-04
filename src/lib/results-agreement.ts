// The Agreement tab's model (stories/E8-3): the instrument's items in their areas (the list's
// order, as the respondent's chapters: src/lib/respondent-rules.ts chaptersFor), each with the
// counts of src/db/queries/results.ts agreement.byItem, the area totals, the sort within an
// area, and the series every view draws: the four kinds and Not answered, or, where no
// proposal was shown (decision 0014: a value rated, "pick"), the values picked. No database.
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { KIND_LABELS, type ResultsSort } from "@/lib/results-filter";
import { labelFor, SCALES } from "@/lib/scoring";
import type { Series } from "@/components/app/charts";

export type AgreementItem = { id: string; reference: string | null; title: string; area: string | null; proposed: string | null; position: number };
export type Counts = { agree: number; change: number; disagree: number; unclear: number; pick: number; values: Record<string, number>; couldSee: number };
export type Row = AgreementItem & { counts: Counts; percent: number | null; notAnswered: number; groups: GroupRow[] };
export type GroupRow = { group: string; counts: Counts; percent: number | null; notAnswered: number; compared: boolean };
export type AreaBlock = { name: string | null; rows: Row[]; totals: Counts; percent: number | null; notAnswered: number };

// E8-6 and decision 0031: a group with fewer answers than this on an item is drawn but not
// compared, so one person cannot be singled out.
export const MIN_GROUP = 3;

export const EMPTY_COUNTS: Counts = { agree: 0, change: 0, disagree: 0, unclear: 0, pick: 0, values: {}, couldSee: 0 };
export const answeredOf = (c: Counts) => c.agree + c.change + c.disagree + c.unclear;
// Agree over answered, rounded half up (as the SQL's round and E8-1's tile).
export const percentOf = (c: Counts): number | null => (answeredOf(c) === 0 ? null : Math.round((100 * c.agree) / answeredOf(c)));
export const notAnsweredOf = (c: Counts) => Math.max(0, c.couldSee - answeredOf(c) - c.pick);

export function addCounts(a: Counts, b: Counts): Counts {
  const values = { ...a.values };
  for (const [k, v] of Object.entries(b.values)) values[k] = (values[k] ?? 0) + v;
  return { agree: a.agree + b.agree, change: a.change + b.change, disagree: a.disagree + b.disagree, unclear: a.unclear + b.unclear, pick: a.pick + b.pick, values, couldSee: a.couldSee + b.couldSee };
}

// The sorts of the items within an area (acceptance 5): reference by default.
export const AGREEMENT_SORTS = ["ref", "agreement", "change", "disagree", "unclear"] as const;
export type AgreementSort = (typeof AGREEMENT_SORTS)[number];
export const agreementSortOf = (sort: ResultsSort | null): { key: AgreementSort; dir: "asc" | "desc" } =>
  sort && (AGREEMENT_SORTS as readonly string[]).includes(sort.key) ? { key: sort.key as AgreementSort, dir: sort.dir } : { key: "ref", dir: "asc" };

const refKey = (r: Row) => [r.position, r.reference ?? ""] as const;
function compare(a: Row, b: Row, key: AgreementSort): number {
  if (key === "ref") return refKey(a)[0] - refKey(b)[0];
  // An item nobody answered sorts after every percentage, whatever the direction.
  const v = (r: Row) => (key === "agreement" ? (r.percent ?? -1) : r.counts[key]);
  return v(a) - v(b);
}

export function sortRows(rows: Row[], sort: { key: AgreementSort; dir: "asc" | "desc" }): Row[] {
  const sign = sort.dir === "desc" ? -1 : 1;
  // Ties fall back to the list's order in the same direction.
  return [...rows].sort((a, b) => sign * (compare(a, b, sort.key) || compare(a, b, "ref")));
}

type ByItem = { itemId: string; group: string | null } & Counts;

// The areas in the list's order (the shaped areas first, then any other area an item names,
// then the items with no area), each with its rows, sorted, and its totals.
export function buildAgreement(items: AgreementItem[], areaNames: string[], counts: ByItem[], split: boolean, sort: { key: AgreementSort; dir: "asc" | "desc" }): AreaBlock[] {
  const names = [...areaNames];
  for (const it of items) if (it.area && !names.includes(it.area)) names.push(it.area);
  const rowsOf = (list: AgreementItem[]): Row[] => list.map((it) => {
    const mine = counts.filter((c) => c.itemId === it.id);
    const total = mine.reduce<Counts>((a, c) => addCounts(a, c), EMPTY_COUNTS);
    const groups = split ? mine.filter((c) => c.group !== null).map((c) => ({ group: c.group!, counts: c, percent: percentOf(c), notAnswered: notAnsweredOf(c), compared: answeredOf(c) + c.pick >= MIN_GROUP })).sort((a, b) => a.group.localeCompare(b.group)) : [];
    return { ...it, counts: total, percent: percentOf(total), notAnswered: notAnsweredOf(total), groups };
  });
  const blocks: { name: string | null; items: AgreementItem[] }[] = names.map((name) => ({ name, items: items.filter((it) => it.area === name) }));
  const loose = items.filter((it) => !it.area || !names.includes(it.area));
  if (loose.length > 0) blocks.push({ name: null, items: loose });
  return blocks.filter((b) => b.items.length > 0).map((b) => {
    const rows = sortRows(rowsOf(b.items), sort);
    const totals = rows.reduce<Counts>((a, r) => addCounts(a, r.counts), EMPTY_COUNTS);
    return { name: b.name, rows, totals, percent: percentOf(totals), notAnswered: notAnsweredOf(totals) };
  });
}

// The colours of the kinds (docs/design-system.md, the status solids; Not answered is an
// absence, a dashed outline) and of the values picked (one violet ramp, a step per value of the
// scale, the same in every view).
export const KIND_COLORS = { agree: "var(--agree)", change: "var(--pushed)", disagree: "var(--disagree)", unclear: "var(--unclear)" } as const;
const RAMP = [100, 80, 62, 46, 32];
const rampColor = (i: number) => `color-mix(in oklch, var(--violet) ${RAMP[i % RAMP.length]}%, var(--surface))`;

export function kindSeries(c: Counts, rated = c.pick > 0): Series[] {
  return [
    { key: "agree", label: KIND_LABELS.agree, value: c.agree, color: KIND_COLORS.agree },
    { key: "change", label: KIND_LABELS.change, value: c.change, color: KIND_COLORS.change },
    { key: "disagree", label: KIND_LABELS.disagree, value: c.disagree, color: KIND_COLORS.disagree },
    { key: "unclear", label: KIND_LABELS.unclear, value: c.unclear, color: KIND_COLORS.unclear },
    ...(rated ? [{ key: "pick", label: KIND_LABELS.pick, value: c.pick, color: rampColor(1) }] : []),
    { key: "none", label: KIND_LABELS.none, value: notAnsweredOf(c), color: "", dashed: true },
  ];
}

// The values picked, in the scale's order, then Unclear and Not answered.
export function valueSeries(c: Counts, method: ScoringMethod, labels: ScaleLabels | null): Series[] {
  return [
    ...SCALES[method].map((v, i) => ({ key: `value-${v.code}`, label: labelFor(method, labels, v.code) ?? v.label, value: c.values[v.code] ?? 0, color: rampColor(i) })),
    { key: "unclear", label: KIND_LABELS.unclear, value: c.unclear, color: KIND_COLORS.unclear },
    { key: "none", label: KIND_LABELS.none, value: notAnsweredOf(c), color: "", dashed: true },
  ];
}
