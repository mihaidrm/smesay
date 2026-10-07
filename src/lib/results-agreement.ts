// The Agreement tab's model (stories/E8-3): the instrument's items in their areas (the list's
// order, as the respondent's chapters: src/lib/respondent-rules.ts chaptersFor), each with the
// counts of src/db/queries/results.ts agreement.byItem, the area totals, the sort within an
// area, and the series every view draws: the four kinds and Not answered, or, where no
// proposal was shown (decision 0014: a value rated, "pick"), the values picked. Beside the
// agreement share, the different priority share and the not needed share (decision 0062: a
// different priority and a disagree are two numbers, never added into one). No database.
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { AGREEMENT_COPY } from "@/lib/results-copy";
import { KIND_LABELS, type ResultsSort } from "@/lib/results-filter";
import { labelFor, SCALES } from "@/lib/scoring";
import type { Series } from "@/components/app/charts";

export type AgreementItem = { id: string; reference: string | null; title: string; area: string | null; proposed: string | null; position: number };
export type Counts = { agree: number; change: number; disagree: number; unclear: number; pick: number; values: Record<string, number>; couldSee: number };
// percent (agree over answered), changePercent (change over answered) and disagreePercent
// (disagree over answered) are null where no proposal was shown (the item's proposed is null):
// its answers are values rated, not agreement. A group's empty is the people who left the split
// field empty.
export type Shares = { percent: number | null; changePercent: number | null; disagreePercent: number | null };
export type Row = AgreementItem & Shares & { counts: Counts; notAnswered: number; groups: GroupRow[] };
export type GroupRow = Shares & { group: string; empty: boolean; counts: Counts; notAnswered: number; compared: boolean };
export type AreaBlock = Shares & { name: string | null; rows: Row[]; totals: Counts; notAnswered: number; rated: boolean };

// E8-6 and decision 0031: a group with fewer answers than this on an item is drawn but not
// compared, so one person cannot be singled out.
export const MIN_GROUP = 3;

export const EMPTY_COUNTS: Counts = { agree: 0, change: 0, disagree: 0, unclear: 0, pick: 0, values: {}, couldSee: 0 };
export const answeredOf = (c: Counts) => c.agree + c.change + c.disagree + c.unclear;
// Agree over answered, rounded half up (as the SQL's round and E8-1's tile); the same rule for
// change and disagree over answered (the SQL's change_percent and disagree_percent).
const shareOf = (c: Counts, n: number): number | null => (answeredOf(c) === 0 ? null : Math.round((100 * n) / answeredOf(c)));
export const percentOf = (c: Counts): number | null => shareOf(c, c.agree);
export const changePercentOf = (c: Counts): number | null => shareOf(c, c.change);
export const disagreePercentOf = (c: Counts): number | null => shareOf(c, c.disagree);
const NO_SHARES: Shares = { percent: null, changePercent: null, disagreePercent: null };
// The three shares of a count, or none where no proposal was shown (`rated`).
export const sharesOf = (c: Counts, rated = false): Shares => (rated ? NO_SHARES : { percent: percentOf(c), changePercent: changePercentOf(c), disagreePercent: disagreePercentOf(c) });
export const notAnsweredOf = (c: Counts) => Math.max(0, c.couldSee - answeredOf(c) - c.pick);

// What an item, an area or a group reads as its figure: the agreement percentage with the
// different priority and not needed shares beside it where a proposal was shown and answered;
// where none was (`rated`: a rate-blind list, or an item with no proposal), the values rated,
// even 0 beside questions (decision 0014: a value rated with no proposal is not an agreement,
// so it is never "No answers" or a percentage); a mix whose answers are all values rated reads
// the same; nothing when nobody answered.
export type Figure = { percent: number; changePercent: number; disagreePercent: number } | { rated: number } | null;
export function figureOf(c: Counts, rated = false): Figure {
  if (answeredOf(c) + c.pick === 0) return null;
  if (rated || (answeredOf(c) === 0 && c.pick > 0)) return { rated: c.pick };
  const p = percentOf(c);
  return p === null ? null : { percent: p, changePercent: changePercentOf(c)!, disagreePercent: disagreePercentOf(c)! };
}

// The figure as one line (the Columns heading, the Share donut's line, the PDF's area line):
// "60% agree · 23% different priority · 10% not needed", "[N] rated", or `none`.
export function figureLine(c: Counts, rated = false, none: string = AGREEMENT_COPY.noPercent): string {
  const f = figureOf(c, rated);
  if (f === null) return none;
  return "rated" in f ? AGREEMENT_COPY.ratedLine(f.rated) : AGREEMENT_COPY.shareLine(f.percent, f.changePercent, f.disagreePercent);
}

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

function compare(a: Row, b: Row, key: AgreementSort): number {
  if (key === "ref") return a.position - b.position;
  const v = (r: Row) => (key === "agreement" ? (r.percent ?? 0) : r.counts[key]);
  return v(a) - v(b);
}

export function sortRows(rows: Row[], sort: { key: AgreementSort; dir: "asc" | "desc" }): Row[] {
  const sign = sort.dir === "desc" ? -1 : 1;
  // By agreement, an item with no percentage (nobody answered, or values rated with no
  // proposal) sorts after every percentage, whatever the direction. Ties fall back to the
  // list's order in the same direction.
  const unrated = (r: Row) => (sort.key === "agreement" && r.percent === null ? 1 : 0);
  return [...rows].sort((a, b) => unrated(a) - unrated(b) || sign * (compare(a, b, sort.key) || compare(a, b, "ref")));
}

type ByItem = { itemId: string; group: string | null } & Counts;

// The groups of a split, in name order, with the people who left the field empty last, under
// `noGroup` ("Not given"), so the group bars always add up to the item's bar.
const byGroup = (a: { group: string; empty: boolean }, b: { group: string; empty: boolean }) => Number(a.empty) - Number(b.empty) || a.group.localeCompare(b.group);
function groupsOf(mine: ByItem[], noGroup: string, rated: boolean): GroupRow[] {
  return mine
    .map((c) => ({ group: c.group ?? noGroup, empty: c.group === null, counts: c, ...sharesOf(c, rated), notAnswered: notAnsweredOf(c), compared: answeredOf(c) + c.pick >= MIN_GROUP }))
    .sort(byGroup);
}

// The areas in the list's order (the shaped areas first, then any other area an item names,
// then the items with no area), each with its rows, sorted, and its totals.
export function buildAgreement(items: AgreementItem[], areaNames: string[], counts: ByItem[], split: boolean, sort: { key: AgreementSort; dir: "asc" | "desc" }, noGroup: string): AreaBlock[] {
  const names = [...areaNames];
  for (const it of items) if (it.area && !names.includes(it.area)) names.push(it.area);
  const rowsOf = (list: AgreementItem[]): Row[] => list.map((it) => {
    const mine = counts.filter((c) => c.itemId === it.id);
    const total = mine.reduce<Counts>((a, c) => addCounts(a, c), EMPTY_COUNTS);
    const rated = it.proposed === null;
    const groups = split ? groupsOf(mine, noGroup, rated) : [];
    return { ...it, counts: total, ...sharesOf(total, rated), notAnswered: notAnsweredOf(total), groups };
  });
  const blocks: { name: string | null; items: AgreementItem[] }[] = names.map((name) => ({ name, items: items.filter((it) => it.area === name) }));
  const loose = items.filter((it) => !it.area || !names.includes(it.area));
  if (loose.length > 0) blocks.push({ name: null, items: loose });
  return blocks.filter((b) => b.items.length > 0).map((b) => {
    const rows = sortRows(rowsOf(b.items), sort);
    const totals = rows.reduce<Counts>((a, r) => addCounts(a, r.counts), EMPTY_COUNTS);
    // An area with no proposal on any item reads values rated, as its items do.
    const rated = b.items.every((it) => it.proposed === null);
    return { name: b.name, rows, totals, ...sharesOf(totals, rated), notAnswered: notAnsweredOf(totals), rated };
  });
}

// Whether no item of the list showed a proposal (every area reads values rated).
export const allRated = (areas: AreaBlock[]): boolean => areas.length > 0 && areas.every((a) => a.rated);

// A group summed over an area or the whole list (the split in Columns and Share). It is
// compared only with 3 answers and 3 people or more: a sum over items can reach 3 answers
// from one person, who must not be singled out (decision 0031). The people are the most who
// answered one item of the sum (one answer per person per item), a lower bound, so people who
// started and answered nothing do not count. `short` says why a group is not compared; for
// people the copy says only that one person could be singled out, since the count is a bound.
export type GroupTotal = { group: string; empty: boolean; counts: Counts; compared: boolean; short: "answers" | "people" | null };
export function groupTotals(rows: Row[]): GroupTotal[] {
  const by = new Map<string, { group: string; empty: boolean; counts: Counts; people: number }>();
  for (const r of rows) for (const g of r.groups) {
    const key = `${g.empty ? 1 : 0}:${g.group}`;
    const was = by.get(key) ?? { group: g.group, empty: g.empty, counts: EMPTY_COUNTS, people: 0 };
    by.set(key, { ...was, counts: addCounts(was.counts, g.counts), people: Math.max(was.people, answeredOf(g.counts) + g.counts.pick) });
  }
  return [...by.values()].sort(byGroup).map(({ group, empty, counts, people }) => {
    const short = answeredOf(counts) + counts.pick < MIN_GROUP ? "answers" : people < MIN_GROUP ? "people" : null;
    return { group, empty, counts, compared: short === null, short };
  });
}

// The colours of the kinds (docs/design-system.md, the status solids; Not answered is an
// absence, a dashed outline) and of the values picked: one blue ramp from the missing-item
// solid, a step per value of the scale, the same in every view, apart in hue from Unclear's
// violet. color-mix(in oklch, ...): developer.mozilla.org/docs/Web/CSS/color_value/color-mix.
export const KIND_COLORS = { agree: "var(--agree)", change: "var(--pushed)", disagree: "var(--disagree)", unclear: "var(--unclear)" } as const;
const RAMP = [100, 78, 58, 42, 28];
const rampColor = (i: number) => `color-mix(in oklch, var(--missing) ${RAMP[i % RAMP.length]}%, var(--surface))`;

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
