// What the visitors' sample keeps for the visit (stories/E12-4, acceptance 1): the About you
// details, the cards, the Wrap up and whether it was submitted, in the tab's session storage,
// so a reload or Back keeps them and closing the tab ends them
// (developer.mozilla.org/docs/Web/API/Window/sessionStorage). Nothing leaves the device. What
// is read back is checked, since anything could be stored under the key.
import type { CardDraft } from "@/components/respondent/item-card";
import type { ResponseFields } from "@/db/types";
import { FIELD_VALUE_MAX, MISSING_MAX, REASON_MAX, EMPTY_WRAP, type WrapValue } from "@/lib/respondent-rules";

export const SAMPLE_KEY = "smesay-sample";
export type SampleKept = { drafts: Record<string, CardDraft>; fields: ResponseFields; picks: string[]; wrap: WrapValue; started: boolean; submittedAt: string | null };
export const EMPTY_SAMPLE: SampleKept = { drafts: {}, fields: {}, picks: [], wrap: EMPTY_WRAP, started: false, submittedAt: null };

const str = (v: unknown, max: number): string | null => (typeof v === "string" ? v.slice(0, max) : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

export function parseSample(raw: string | null, itemIds: string[], fieldKeys: string[]): SampleKept {
  if (!raw) return EMPTY_SAMPLE;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return EMPTY_SAMPLE; }
  const v = obj(value);
  if (!v) return EMPTY_SAMPLE;
  const drafts: Record<string, CardDraft> = {};
  const d = obj(v.drafts) ?? {};
  for (const id of itemIds) {
    const c = obj(d[id]);
    if (!c) continue;
    const reason = str(c.reason, REASON_MAX), comment = str(c.comment, REASON_MAX);
    if ((c.picked === null || typeof c.picked === "string") && reason !== null && comment !== null) drafts[id] = { picked: c.picked as string | null, reason, comment };
  }
  const fields: ResponseFields = {};
  const f = obj(v.fields) ?? {};
  for (const key of fieldKeys) { const s = str(f[key], FIELD_VALUE_MAX); if (s !== null) fields[key] = s; }
  const picks = Array.isArray(v.picks) ? v.picks.filter((p): p is string => typeof p === "string").slice(0, 20) : [];
  const w = obj(v.wrap) ?? {};
  const m = obj(w.missing) ?? {};
  const confidence = typeof w.confidence === "number" && Number.isInteger(w.confidence) && w.confidence >= 1 && w.confidence <= 5 ? w.confidence : null;
  const wrap: WrapValue = { confidence, signed: w.signed === true, closingAnswer: str(w.closingAnswer, REASON_MAX) ?? "", missing: { text: str(m.text, MISSING_MAX) ?? "" } };
  const submittedAt = typeof v.submittedAt === "string" && !Number.isNaN(Date.parse(v.submittedAt)) ? v.submittedAt : null;
  return { drafts, fields, picks, wrap, started: v.started === true, submittedAt };
}

export function readSample(itemIds: string[], fieldKeys: string[]): SampleKept {
  try { return parseSample(window.sessionStorage.getItem(SAMPLE_KEY), itemIds, fieldKeys); } catch { return EMPTY_SAMPLE; }
}

// Merges a change into what the tab keeps; false when the browser keeps nothing (storage
// blocked), so the cards do not claim to be saved.
export function keepSample(patch: Partial<SampleKept>): boolean {
  try {
    let current: Partial<SampleKept> = {};
    try { current = obj(JSON.parse(window.sessionStorage.getItem(SAMPLE_KEY) ?? "{}")) ?? {}; } catch { /* Unreadable: replaced. */ }
    window.sessionStorage.setItem(SAMPLE_KEY, JSON.stringify({ ...EMPTY_SAMPLE, ...current, ...patch }));
    return true;
  } catch {
    return false;
  }
}
