// Proposed values as PMs write them (stories/E3-3, acceptance 4): MoSCoW words and letters,
// 1 to 5, and keep, change, drop, each the ScoringMethod scales of INTERFACES.md (moscow, fit,
// kcd). Anything else is kept as written and counted by the check report (E3-5) as "not
// recognised". Pure, tested in values.test.ts.
import type { ScoringMethod } from "@/db/types";

export type NormalisedValue = { value: string; scale: ScoringMethod | null };

const MOSCOW: Record<string, string> = {
  must: "Must", m: "Must", "must have": "Must",
  should: "Should", s: "Should", "should have": "Should",
  could: "Could", c: "Could", "could have": "Could",
  "won't": "Won't", wont: "Won't", w: "Won't", "won't have": "Won't", "not needed": "Won't",
};
const KCD: Record<string, string> = { keep: "keep", change: "change", drop: "drop" };

export function normaliseValue(raw: string): NormalisedValue {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: "", scale: null };
  const key = trimmed.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
  if (key in MOSCOW) return { value: MOSCOW[key], scale: "moscow" };
  if (/^[1-5]$/.test(key)) return { value: key, scale: "fit" };
  if (key in KCD) return { value: KCD[key], scale: "kcd" };
  return { value: trimmed, scale: null };
}

export function isRecognised(raw: string): boolean {
  return raw.trim() === "" || normaliseValue(raw).scale !== null;
}
