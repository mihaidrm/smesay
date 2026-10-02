// The diff between two versions of a list (stories/E3-6, acceptance 4), as counts only in
// R1: items matched by reference first, then by exact text (collapsed whitespace, case kept);
// a matched item is unchanged when its text is the same, changed otherwise; new is in the new
// version only, gone in the old only. Pure, tested in diff.test.ts.
import { collapse } from "./report";

export type DiffItem = { ref: string | null; text: string };
export type DiffCounts = { unchanged: number; changed: number; added: number; gone: number };

export function diffVersions(before: DiffItem[], after: DiffItem[]): DiffCounts {
  const counts: DiffCounts = { unchanged: 0, changed: 0, added: 0, gone: 0 };
  const oldByRef = new Map<string, DiffItem>();
  for (const item of before) if (item.ref && !oldByRef.has(item.ref)) oldByRef.set(item.ref, item);
  const matchedOld = new Set<DiffItem>();
  const unmatchedNew: DiffItem[] = [];
  for (const item of after) {
    const old = item.ref ? oldByRef.get(item.ref) : undefined;
    if (old && !matchedOld.has(old)) {
      matchedOld.add(old);
      if (collapse(old.text) === collapse(item.text)) counts.unchanged += 1; else counts.changed += 1;
    } else unmatchedNew.push(item);
  }
  const oldByText = new Map<string, DiffItem[]>();
  for (const item of before) {
    if (matchedOld.has(item)) continue;
    const key = collapse(item.text);
    oldByText.set(key, [...(oldByText.get(key) ?? []), item]);
  }
  for (const item of unmatchedNew) {
    const pool = oldByText.get(collapse(item.text));
    const old = pool?.shift();
    if (old) { matchedOld.add(old); counts.unchanged += 1; } else counts.added += 1;
  }
  counts.gone = before.filter((item) => !matchedOld.has(item)).length;
  return counts;
}

export function diffLine(c: DiffCounts): string {
  const n = (v: number, word: string) => `${v.toLocaleString("en-GB")} ${v === 1 ? word.replace(/items/, "item") : word}`;
  return `${n(c.unchanged, "items unchanged")}, ${c.changed.toLocaleString("en-GB")} changed, ${c.added.toLocaleString("en-GB")} new, ${c.gone.toLocaleString("en-GB")} gone`;
}
