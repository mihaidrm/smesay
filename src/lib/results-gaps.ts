// Where groups disagree (stories/E8-6): which items the view shows and in what order. The
// gaps come from SQL (src/db/queries/results.ts gaps.byField); this keeps the items with a
// proposal shown (agreement means nothing on an item rated with no proposal, decision 0014),
// orders ties by the list's order (areas in the set's order, then position), and orders the
// groups by name with Not given ('') last, as the Agreement tab's split does.
export type GapGroupIn = { group: string; agree: number; answered: number; compared: boolean };
export type GapItemIn = { itemId: string; gap: number | null; groups: GapGroupIn[] };

export const TOP_GAPS = 4;

export function orderGaps<T extends GapItemIn>(rows: T[], listOrder: string[]): T[] {
  const at = new Map(listOrder.map((id, i) => [id, i]));
  return rows
    .filter((r) => at.has(r.itemId))
    .map((r) => ({ ...r, groups: [...r.groups].sort((a, b) => (a.group === "" ? 1 : b.group === "" ? -1 : a.group.localeCompare(b.group))) }))
    .sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1) || at.get(a.itemId)! - at.get(b.itemId)!);
}

// The top of the view: items whose compared groups differ at all.
export const topGaps = <T extends GapItemIn>(ordered: T[]): T[] => ordered.filter((r) => r.gap !== null && r.gap > 0).slice(0, TOP_GAPS);

// The list's order: areas in the set's order, loose items last, then position.
export function listOrder(items: { id: string; area: string | null; position: number }[], areaNames: string[]): string[] {
  const rank = (a: string | null) => { const i = a === null ? -1 : areaNames.indexOf(a); return i === -1 ? areaNames.length : i; };
  return [...items].sort((a, b) => rank(a.area) - rank(b.area) || a.position - b.position).map((it) => it.id);
}
