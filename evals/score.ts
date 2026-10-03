// Scoring of one golden spec against the model's answer (stories/E4-6, acceptance 1 and 2;
// evals/README.md, Scoring; decision 0037). Pure: no model call, no database. The judge's
// verdicts come in from run.ts for the items whose reader version differs from the row.
import type { ShapeOutput } from "@/lib/ai/shape-schema";
import { cleanDuplicateOf } from "@/lib/shaping";

export type ExpectedItem = {
  ref: string;
  meaning: string;
  must_keep: string[];
  area: string;
  row: string;
  proposed?: string;
  ambiguous?: boolean;
  duplicate_of?: string;
};
export type ExpectedContext = { goal: string; audience: string; glossary: string[] } | null;
export type Expected = {
  id: string;
  domain: string;
  source: string;
  context: ExpectedContext;
  item_count: number;
  item_count_tolerance: number;
  area_count_tolerance: number;
  areas: { name: string; aliases: string[]; items: string[] }[];
  items: ExpectedItem[];
  must_not_invent: string[];
  notes: string;
};

// What the judge said about one item (evals/judge.md): the reader version says the same
// thing, and whether it states something the row does not.
export type Verdict = { sameMeaning: boolean; added: boolean; note: string };

export type ItemScore = {
  ref: string;
  reader: string;
  identical: boolean;
  tokensMissing: string[];
  judged: Verdict | null;
  found: boolean;
  meaningChanged: boolean;
  invented: boolean;
  area: string | null;
  areaRight: boolean | null;
  ambiguity: string | null;
  duplicateOf: string | null;
  glossaryMissing: string[];
};

export type SpecScore = {
  id: string;
  domain: string;
  pass: boolean;
  found: number;
  missed: number;
  invented: number;
  meaningChanged: number;
  tokensMissing: number;
  areasExpected: number;
  areasGiven: number;
  areasWithinTolerance: boolean;
  areasNamed: number;
  placedRight: number;
  placedJudged: number;
  ambiguityExpected: number;
  ambiguityRaised: number;
  ambiguityMatched: number;
  duplicatesExpected: number;
  duplicatesRaised: number;
  duplicatesMatched: number;
  glossaryTerms: number;
  glossaryMissing: number;
  failures: string[];
  items: ItemScore[];
};

export const fold = (s: string) => s.replace(/\s+/g, " ").trim();
const key = (s: string) => fold(s).toLowerCase();

// Area names match loosely: the words of one name (small words dropped, plurals and endings
// cut to a five-letter stem) are all in the other. "Placing the Order" names "Placing
// orders"; "Confirmation and Shortages" names "Confirming and shortages".
const SMALL = new Set(["and", "the", "of", "for", "to", "a", "an", "in", "on", "with"]);
const stems = (name: string) => new Set(key(name).split(/[^a-z0-9+]+/).filter((w) => w && !SMALL.has(w)).map((w) => w.replace(/s$/, "").slice(0, 5)));
export function areaNamesMatch(a: string, b: string): boolean {
  const x = stems(a);
  const y = stems(b);
  if (x.size === 0 || y.size === 0) return false;
  return [...x].every((w) => y.has(w)) || [...y].every((w) => x.has(w));
}

// The runner numbers rows from 1 in the order of expected.items, as the app numbers items by
// position (INTERFACES.md, AI shaping output). This maps a model ref back to the golden ref.
export function refOfPosition(expected: Expected, position: string): string | null {
  if (!/^[1-9]\d*$/.test(position)) return null;
  const n = Number(position);
  return n <= expected.items.length ? expected.items[n - 1].ref : null;
}

// The items whose reader version is not the row word for word: those go to the judge.
export function needsJudge(expected: Expected, output: ShapeOutput): { ref: string; row: string; meaning: string; reader: string }[] {
  const out: { ref: string; row: string; meaning: string; reader: string }[] = [];
  for (const item of output.items) {
    const ref = refOfPosition(expected, item.ref);
    if (!ref) continue;
    const exp = expected.items.find((i) => i.ref === ref)!;
    if (fold(item.reader) !== fold(exp.row)) out.push({ ref, row: exp.row, meaning: exp.meaning, reader: fold(item.reader) });
  }
  return out;
}

export function score(expected: Expected, output: ShapeOutput, verdicts: Map<string, Verdict>): SpecScore {
  const answered = new Map<string, ShapeOutput["items"][number]>();
  for (const item of output.items) {
    const ref = refOfPosition(expected, item.ref);
    if (ref) answered.set(ref, item);
  }
  const areaOf = new Map<string, string>();
  for (const area of output.areas) for (const r of area.items) {
    const ref = refOfPosition(expected, r);
    if (ref) areaOf.set(ref, fold(area.name));
  }
  // Expected area names matched by name or alias, loosely (areaNamesMatch), each model area
  // at most once.
  const named = new Map<string, string>();
  const taken = new Set<string>();
  for (const area of expected.areas) {
    const hit = output.areas.find((a) => !taken.has(fold(a.name)) && [area.name, ...area.aliases].some((n) => areaNamesMatch(n, a.name)));
    if (hit) {
      named.set(area.name, fold(hit.name));
      taken.add(fold(hit.name));
    }
  }
  const glossary = expected.context?.glossary ?? [];

  const items: ItemScore[] = expected.items.map((exp) => {
    const got = answered.get(exp.ref);
    if (!got) {
      return { ref: exp.ref, reader: "", identical: false, tokensMissing: [...exp.must_keep], judged: null, found: false, meaningChanged: false, invented: false, area: null, areaRight: null, ambiguity: null, duplicateOf: null, glossaryMissing: [] };
    }
    const reader = fold(got.reader);
    const identical = reader === fold(exp.row);
    const tokensMissing = exp.must_keep.filter((t) => !key(reader).includes(key(t)));
    const judged = identical ? null : (verdicts.get(exp.ref) ?? null);
    const found = identical || (judged !== null && judged.sameMeaning);
    const meaningChanged = !identical && (judged === null || !judged.sameMeaning);
    const invented = judged !== null && judged.added;
    const area = areaOf.get(exp.ref) ?? null;
    const expectedArea = named.get(exp.area);
    const areaRight = expectedArea === undefined ? null : area === expectedArea;
    // As the app keeps it (cleanDuplicateOf): a flag at the item itself, a later item or an
    // unknown ref is dropped, so the count is what a PM sees.
    const positions = expected.items.map((_, i) => String(i + 1));
    const kept = cleanDuplicateOf(got.ref, got.flags.duplicateOf, positions);
    const dup = kept ? refOfPosition(expected, kept) : null;
    // A term the row carries must appear in the reader version exactly as written.
    const glossaryMissing = glossary.filter((t) => exp.row.includes(t) && !reader.includes(t));
    return { ref: exp.ref, reader, identical, tokensMissing, judged, found, meaningChanged, invented, area, areaRight, ambiguity: got.flags.ambiguity ? fold(got.flags.ambiguity) : null, duplicateOf: dup, glossaryMissing };
  });

  const missed = items.filter((i) => !answered.has(i.ref)).length;
  const ambiguityExpected = expected.items.filter((i) => i.ambiguous).map((i) => i.ref);
  const ambiguityRaised = items.filter((i) => i.ambiguity !== null).map((i) => i.ref);
  const duplicatesExpected = expected.items.filter((i) => i.duplicate_of).map((i) => [i.ref, i.duplicate_of!] as const);
  const duplicatesRaised = items.filter((i) => i.duplicateOf !== null).map((i) => [i.ref, i.duplicateOf!] as const);
  const raisedPairs = new Set(duplicatesRaised.map(([a, b]) => `${a}|${b}`));
  const duplicatesMatched = duplicatesExpected.filter(([a, b]) => raisedPairs.has(`${a}|${b}`)).length;
  const judgedPlacement = items.filter((i) => i.areaRight !== null);
  const glossaryMissing = items.reduce((n, i) => n + i.glossaryMissing.length, 0);
  const invented = items.filter((i) => i.invented).length;
  const meaningChanged = items.filter((i) => i.meaningChanged).length;
  const areasGiven = output.areas.length;

  const failures: string[] = [];
  if (missed > 0) failures.push(`${missed} missed`);
  if (invented > 0) failures.push(`${invented} invented`);
  if (meaningChanged > 0) failures.push(`${meaningChanged} meaning changed`);
  if (glossaryMissing > 0) failures.push(`${glossaryMissing} glossary term(s) not kept`);
  if (Math.abs(answered.size - expected.item_count) > expected.item_count_tolerance) failures.push(`${answered.size} items for ${expected.item_count} expected`);
  // The area count is reported, not failed on, until the prompt's grouping is decided
  // (design note 32): the first run gave 5 to 7 areas where the set expects 3 to 5.
  const areasWithinTolerance = Math.abs(areasGiven - expected.areas.length) <= expected.area_count_tolerance;

  return {
    id: expected.id, domain: expected.domain, pass: failures.length === 0,
    found: items.filter((i) => i.found).length, missed, invented, meaningChanged,
    tokensMissing: items.reduce((n, i) => n + i.tokensMissing.length, 0),
    areasExpected: expected.areas.length, areasGiven, areasWithinTolerance, areasNamed: named.size,
    placedRight: judgedPlacement.filter((i) => i.areaRight).length, placedJudged: judgedPlacement.length,
    ambiguityExpected: ambiguityExpected.length, ambiguityRaised: ambiguityRaised.length,
    ambiguityMatched: ambiguityExpected.filter((r) => ambiguityRaised.includes(r)).length,
    duplicatesExpected: duplicatesExpected.length, duplicatesRaised: duplicatesRaised.length, duplicatesMatched,
    glossaryTerms: glossary.length, glossaryMissing, failures, items,
  };
}

// One console line per spec (acceptance 1).
export function line(s: SpecScore, costCents: number): string {
  const parts = [
    `found ${s.found}/${s.items.length}`, `missed ${s.missed}`, `invented ${s.invented}`, `meaning changed ${s.meaningChanged}`,
    `tokens missing ${s.tokensMissing}`, `areas ${s.areasNamed}/${s.areasExpected} named (${s.areasGiven} given${s.areasWithinTolerance ? "" : ", outside tolerance"})`, `placed ${s.placedRight}/${s.placedJudged}`,
    `ambiguity ${s.ambiguityExpected} expected, ${s.ambiguityRaised} raised, ${s.ambiguityMatched} matched`,
    `duplicates ${s.duplicatesExpected} expected, ${s.duplicatesRaised} raised, ${s.duplicatesMatched} matched`,
  ];
  if (s.glossaryTerms > 0) parts.push(`glossary ${s.glossaryTerms - s.glossaryMissing}/${s.glossaryTerms} kept`);
  parts.push(`${costCents} cent(s)`);
  return `${s.pass ? "PASS" : "FAIL"} ${s.id} ${s.domain}: ${parts.join(", ")}${s.failures.length ? ". " + s.failures.join("; ") : ""}`;
}
