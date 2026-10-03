// The scoring methods (stories/E5-2; decisions 0003, 0014, 0018): the three scales with
// their value codes, default labels and captions; the PM's labels on top (ScaleLabels,
// INTERFACES.md); the proposed value of an item read into a code; and the one mapping from
// (method, show proposed, proposed code, picked code) to the AnswerKind and value stored.
// No database import: Build, the respondent app (E7-2) and Results (E8) share this file.
// A value picked that equals the proposal is agree; the lowest value (Not needed, Drop, 1
// no fit) is disagree; any other value is change; without a proposal every value is pick
// (decision 0014; docs/review-list.md for the fit rule). Unclear is its own answer.
import type { AnswerKind, ScaleLabels, ScoringMethod } from "@/db/types";

export const LABEL_MAX = 20;
export const UNCLEAR = "unclear";

export type ScaleValue = { code: string; label: string; caption?: string };

export const METHODS: { key: ScoringMethod; label: string; hint: string }[] = [
  { key: "moscow", label: "MoSCoW", hint: "Must, Should, Could, Not needed" },
  { key: "fit", label: "1 to 5 fit", hint: "How well the item fits the need" },
  { key: "kcd", label: "Keep, change, drop", hint: "For reviewing an existing list" },
];

export const SCALES: Record<ScoringMethod, ScaleValue[]> = {
  moscow: [
    { code: "M", label: "Must" },
    { code: "S", label: "Should" },
    { code: "C", label: "Could" },
    { code: "W", label: "Not needed" },
  ],
  fit: [
    { code: "1", label: "1", caption: "no fit" },
    { code: "2", label: "2" },
    { code: "3", label: "3" },
    { code: "4", label: "4" },
    { code: "5", label: "5", caption: "fits fully" },
  ],
  kcd: [
    { code: "K", label: "Keep" },
    { code: "C", label: "Change" },
    { code: "D", label: "Drop" },
  ],
};

// The code that means "not needed" per method: the disagree answer (decision 0014).
export const DISAGREE_CODE: Record<ScoringMethod, string> = { moscow: "W", fit: "1", kcd: "D" };

export const SCORING_COPY = {
  unclear: "Unclear",
  proposed: "proposed",
  yourRating: "Your rating",
  notRated: "Not rated yet",
} as const;

// The scale with the PM's labels applied; a label not set keeps the default.
export function scaleFor(method: ScoringMethod, labels: ScaleLabels | null | undefined): ScaleValue[] {
  return SCALES[method].map((v) => ({ ...v, label: labels?.[v.code]?.trim() || v.label }));
}

export function labelFor(method: ScoringMethod, labels: ScaleLabels | null | undefined, code: string | null): string | null {
  if (code === null) return null;
  if (code === UNCLEAR) return SCORING_COPY.unclear;
  return scaleFor(method, labels).find((v) => v.code === code)?.label ?? null;
}

// The words an import may carry for a proposed value (E3-3 keeps unrecognised ones as
// written), read into the method's code; null when the value does not name one.
const WORDS: Record<ScoringMethod, Record<string, string>> = {
  moscow: { m: "M", must: "M", "must have": "M", s: "S", should: "S", "should have": "S", c: "C", could: "C", "could have": "C", w: "W", wont: "W", "won't": "W", "won't have": "W", "wont have": "W", "not needed": "W", no: "W" },
  fit: { "1": "1", "2": "2", "3": "3", "4": "4", "5": "5" },
  kcd: { k: "K", keep: "K", c: "C", change: "C", d: "D", drop: "D" },
};

export function proposedCode(method: ScoringMethod, proposedValue: string | null | undefined): string | null {
  if (!proposedValue) return null;
  const key = proposedValue.trim().toLowerCase().replace(/\s+/g, " ");
  const code = WORDS[method][key];
  if (code) return code;
  // A code typed as such (M, S, 3, K) or the label of the method's scale.
  const byCode = SCALES[method].find((v) => v.code.toLowerCase() === key || v.label.toLowerCase() === key);
  return byCode?.code ?? null;
}

export type Classified = { kind: AnswerKind; value: string | null };

// The answer stored for a pick (stories/E5-2, acceptance 2 and 5). `picked` is a scale
// code or "unclear"; `proposed` is the item's proposed code, null when the import had none.
export function classify(input: { method: ScoringMethod; showProposed: boolean; proposed: string | null; picked: string }): Classified {
  const { method, showProposed, proposed, picked } = input;
  if (picked === UNCLEAR) return { kind: "unclear", value: null };
  if (!SCALES[method].some((v) => v.code === picked)) throw new Error(`${picked} is not a value of ${method}.`);
  if (!showProposed || proposed === null) return { kind: "pick", value: picked };
  if (picked === proposed) return { kind: "agree", value: picked };
  if (picked === DISAGREE_CODE[method]) return { kind: "disagree", value: picked };
  return { kind: "change", value: picked };
}

export const SCORING_ERRORS = {
  badMethod: "Pick one of the three methods: MoSCoW, 1 to 5 fit, or keep, change, drop.",
  badLabel: `Each label is 1 to ${LABEL_MAX} characters. Leave one empty to keep the default.`,
  locked: "Published instruments keep their method. Build a new instrument to change it.",
} as const;

export const isMethod = (value: unknown): value is ScoringMethod => value === "moscow" || value === "fit" || value === "kcd";

// The labels as the Build form posts them ({ code: text }), trimmed; a code of another
// method or an unknown key is dropped; an empty text means the default; null when every
// label is the default. An error when a label is over the limit or not a string.
export function parseScaleLabels(method: ScoringMethod, raw: unknown): { error: string } | { labels: ScaleLabels | null } {
  if (raw === null || raw === undefined || raw === "") return { labels: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: SCORING_ERRORS.badLabel };
  const out: ScaleLabels = {};
  for (const v of SCALES[method]) {
    const text = (raw as Record<string, unknown>)[v.code];
    if (text === undefined || text === null) continue;
    if (typeof text !== "string") return { error: SCORING_ERRORS.badLabel };
    const label = text.trim();
    if (!label) continue;
    if (label.length > LABEL_MAX) return { error: SCORING_ERRORS.badLabel };
    if (label !== v.label) out[v.code] = label;
  }
  return { labels: Object.keys(out).length ? out : null };
}
