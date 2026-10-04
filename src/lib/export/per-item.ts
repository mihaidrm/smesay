// The Answers file added up per item, cell by cell against the Items with totals file
// (stories/E8-3, acceptance 7; E10-1, acceptance 3). Used by the tests on the seed
// (files.test.ts) and on 600 generated responses (src/db/queries/results.test.ts). Pure.
import { KIND_LABELS } from "@/lib/results-filter";
import type { Cell } from "./csv";
import { EXPORT_COPY } from "./copy";
import type { ExportTable } from "./files";

const KINDS = ["agree", "change", "disagree", "unclear", "pick"] as const;

// Each item's five counts from both files, keyed by reference and text: [from Answers, from Items].
export function perItem(answers: ExportTable, items: ExportTable): Map<string, [number[], number[]]> {
  const C = EXPORT_COPY.columns;
  const col = (t: ExportTable, name: Cell) => t.header.indexOf(name);
  const key = (row: Cell[], t: ExportTable) => `${row[col(t, C.reference)]}\u001f${row[col(t, C.item)]}`;
  const out = new Map<string, [number[], number[]]>();
  for (const row of items.rows) out.set(key(row, items), [KINDS.map(() => 0), KINDS.map((k) => Number(row[col(items, KIND_LABELS[k])]))]);
  const answer = col(answers, C.answer);
  for (const row of answers.rows) {
    const entry = out.get(key(row, answers)) ?? [KINDS.map(() => 0), KINDS.map(() => 0)];
    const i = KINDS.findIndex((k) => KIND_LABELS[k] === row[answer]);
    if (i >= 0) entry[0][i] += 1;
    out.set(key(row, answers), entry);
  }
  return out;
}
