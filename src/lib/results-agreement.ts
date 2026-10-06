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
// percent is null where no proposal was shown (the item's proposed is null): its answers are
// values rated, not agreement. A group's empty is the people who left the split field empty.
// E5-7 (amended 2026-10-06), under Names hidden and Anonymous: `few` is a row or a group seen
// by fewer than MIN_GROUP counted people, drawn as "Fewer than 3 answers" with no count;
// `folded` is the group of the values under MIN_GROUP people; `key` tells the groups apart
// whatever an option's text (v:[value], small or none).
export type Row = AgreementItem & { counts: Counts; percent: number | null; notAnswered: number; groups: GroupRow[]; few: boolean };
export type GroupRow = { key: string; group: string; empty: boolean; folded: boolean; few: boolean; counts: Counts; percent: number | null; notAnswered: number; compared: boolean };
export type AreaBlock = { name: string | null; rows: Row[]; totals: Counts; percent: number | null; notAnswered: number; rated: boolean };

// E8-6 and decision 0031: a group with fewer answers than this on an item is drawn but not
// compared, so one person cannot be singled out. Under Names hidden and Anonymous (E5-7,
// amended 2026-10-06) the same number keeps a filtered view, a split group and an item from
// being drawn for fewer people (src/db/queries/results.ts).
export const MIN_GROUP = 3;

export const EMPTY_COUNTS: Counts = { agree: 0, change: 0, disagree: 0, unclear: 0, pick: 0, values: {}, couldSee: 0 };
export const answeredOf = (c: Counts) => c.agree + c.change + c.disagree + c.unclear;
// Agree over answered, rounded half up (as the SQL's round and E8-1's tile).
export const percentOf = (c: Counts): number | null => (answeredOf(c) === 0 ? null : Math.round((100 * c.agree) / answeredOf(c)));
export const notAnsweredOf = (c: Counts) => Math.max(0, c.couldSee - answeredOf(c) - c.pick);

// What an item, an area or a group reads as its figure: the agreement percentage where a
// proposal was shown and answered; where none was (`rated`: a rate-blind list, or an item
// with no proposal), the values rated, even 0 beside questions (decision 0014: a value rated
// with no proposal is not an agreement, so it is never "No answers" or a percentage); a mix
// whose answers are all values rated reads the same; nothing when nobody answered.
export type Figure = { percent: number } | { rated: number } | null;
export function figureOf(c: Counts, rated = false): Figure {
  if (answeredOf(c) + c.pick === 0) return null;
  if (rated || (answeredOf(c) === 0 && c.pick > 0)) return { rated: c.pick };
  const p = percentOf(c);
  return p === null ? null : { percent: p };
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

// A row of agreement.byItem (src/db/queries/results.ts ItemCounts): folded and few only under
// Names hidden and Anonymous (E5-7).
export type ByItem = { itemId: string; group: string | null; folded?: boolean; few?: boolean } & Counts;

// The groups of a split, in name order, then the folded group (`small`, "Groups under 3
// people"), then the people who left the field empty, under `noGroup` ("Not given"). Under
// Named the group bars add up to the item's bar; under the two levels a group left out
// (src/db/queries/results.ts agreement.byItem) is still in the item's bar.
const rankOf = (g: { empty: boolean; folded: boolean }) => (g.folded ? 1 : g.empty ? 2 : 0);
const byGroup = (a: { group: string; empty: boolean; folded: boolean }, b: { group: string; empty: boolean; folded: boolean }) => rankOf(a) - rankOf(b) || a.group.localeCompare(b.group);
const groupKey = (c: { group: string | null; folded?: boolean }) => (c.folded ? "small" : c.group === null ? "none" : `v:${c.group}`);
function groupsOf(mine: ByItem[], noGroup: string, small: string, rated: boolean): GroupRow[] {
  return mine
    .map((c) => {
      const folded = c.folded === true;
      const few = c.few === true;
      return { key: groupKey(c), group: folded ? small : c.group ?? noGroup, empty: !folded && c.group === null, folded, few, counts: c, percent: rated ? null : percentOf(c), notAnswered: notAnsweredOf(c), compared: !few && answeredOf(c) + c.pick >= MIN_GROUP };
    })
    .sort(byGroup);
}

// The areas in the list's order (the shaped areas first, then any other area an item names,
// then the items with no area), each with its rows, sorted, and its totals. With `totals` (the
// same counts without a split, E5-7) an item's bar is read from them, not summed from its
// groups; `small` names the folded group.
export function buildAgreement(items: AgreementItem[], areaNames: string[], counts: ByItem[], split: boolean, sort: { key: AgreementSort; dir: "asc" | "desc" }, noGroup: string, more: { totals?: ByItem[]; small?: string } = {}): AreaBlock[] {
  const names = [...areaNames];
  for (const it of items) if (it.area && !names.includes(it.area)) names.push(it.area);
  const rowsOf = (list: AgreementItem[]): Row[] => list.map((it) => {
    const mine = counts.filter((c) => c.itemId === it.id);
    const whole = more.totals ? more.totals.filter((c) => c.itemId === it.id) : mine;
    const total = whole.reduce<Counts>((a, c) => addCounts(a, c), EMPTY_COUNTS);
    const rated = it.proposed === null;
    const groups = split ? groupsOf(mine, noGroup, more.small ?? noGroup, rated) : [];
    return { ...it, counts: total, percent: rated ? null : percentOf(total), notAnswered: notAnsweredOf(total), groups, few: whole.some((c) => c.few === true) };
  });
  const blocks: { name: string | null; items: AgreementItem[] }[] = names.map((name) => ({ name, items: items.filter((it) => it.area === name) }));
  const loose = items.filter((it) => !it.area || !names.includes(it.area));
  if (loose.length > 0) blocks.push({ name: null, items: loose });
  return blocks.filter((b) => b.items.length > 0).map((b) => {
    const rows = sortRows(rowsOf(b.items), sort);
    const totals = rows.reduce<Counts>((a, r) => addCounts(a, r.counts), EMPTY_COUNTS);
    // An area with no proposal on any item reads values rated, as its items do.
    const rated = b.items.every((it) => it.proposed === null);
    return { name: b.name, rows, totals, percent: rated ? null : percentOf(totals), notAnswered: notAnsweredOf(totals), rated };
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
export type GroupTotal = { key: string; group: string; empty: boolean; folded: boolean; counts: Counts; compared: boolean; short: "answers" | "people" | null };
export function groupTotals(rows: Row[]): GroupTotal[] {
  const by = new Map<string, { key: string; group: string; empty: boolean; folded: boolean; counts: Counts; people: number }>();
  for (const r of rows) for (const g of r.groups) {
    const was = by.get(g.key) ?? { key: g.key, group: g.group, empty: g.empty, folded: g.folded, counts: EMPTY_COUNTS, people: 0 };
    by.set(g.key, { ...was, counts: addCounts(was.counts, g.counts), people: Math.max(was.people, answeredOf(g.counts) + g.counts.pick) });
  }
  return [...by.values()].sort(byGroup).map(({ key, group, empty, folded, counts, people }) => {
    const short = answeredOf(counts) + counts.pick < MIN_GROUP ? "answers" : people < MIN_GROUP ? "people" : null;
    return { key, group, empty, folded, counts, compared: short === null, short };
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
