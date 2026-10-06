// Where groups disagree (stories/E8-6): which items the view shows and in what order. The
// gaps come from SQL (src/db/queries/results.ts gaps.byField); this keeps the items with a
// proposal shown (agreement means nothing on an item rated with no proposal, decision 0014),
// orders ties as the Agreement table above lists the items (the caller passes the table's
// order), and orders the groups by name with Not given ('') last, as the split does; under
// Names hidden and Anonymous the folded group (E5-7) comes before Not given.
export type GapGroupIn = { group: string; folded?: boolean; agree: number; answered: number; compared: boolean };
const rank = (g: GapGroupIn) => (g.folded ? 1 : g.group === "" ? 2 : 0);
export type GapItemIn = { itemId: string; gap: number | null; groups: GapGroupIn[] };

export const TOP_GAPS = 4;

export function orderGaps<T extends GapItemIn>(rows: T[], listOrder: string[]): T[] {
  const at = new Map(listOrder.map((id, i) => [id, i]));
  return rows
    .filter((r) => at.has(r.itemId))
    .map((r) => ({ ...r, groups: [...r.groups].sort((a, b) => rank(a) - rank(b) || a.group.localeCompare(b.group)) }))
    .sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1) || at.get(a.itemId)! - at.get(b.itemId)!);
}

// The top of the view: items whose compared groups differ at all.
export const topGaps = <T extends GapItemIn>(ordered: T[]): T[] => ordered.filter((r) => r.gap !== null && r.gap > 0).slice(0, TOP_GAPS);

// Whether any item has groups compared that agree to the point (a gap of 0).
export const allAgree = (ordered: GapItemIn[]): boolean => ordered.some((r) => r.gap === 0) && !ordered.some((r) => r.gap !== null && r.gap > 0);
