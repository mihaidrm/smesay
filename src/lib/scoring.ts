// The scoring methods (stories/E5-2; decisions 0003, 0014, 0018): the three scales with
// their value codes, default labels and captions; the PM's labels on top (ScaleLabels,
// INTERFACES.md); the proposed value of an item read into a code; and the one mapping from
// (method, show proposed, proposed code, picked code) to the AnswerKind and value stored.
// No database import: Build, the respondent app (E7-2) and Results (E8) share this file.
// A value picked that equals the proposal is agree; the lowest value (Not needed, Drop, 1
// no fit) is disagree; any other value is change; without a proposal every value is pick
// (decision 0014; docs/review-list.md for the fit rule). Unclear is its own answer.
import type { AnswerKind, Layout, ReasonRule, ScaleLabels, ScoringMethod } from "@/db/types";
import { normaliseValue } from "@/lib/import/values";

export const LABEL_MAX = 20;
export const UNCLEAR = "unclear";

export type ScaleValue = { code: string; label: string; caption?: string };

export const METHODS: { key: ScoringMethod; label: string; hint: string }[] = [
  { key: "moscow", label: "MoSCoW", hint: "Must, Should, Could, Not needed" },
  { key: "fit", label: "1 to 5 fit", hint: "Respondents rate how well the item fits the need" },
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

// The three layouts (stories/E5-3, decision 0016), chapters first and default.
export const LAYOUTS_META: { key: Layout; label: string; hint: string }[] = [
  { key: "chapters", label: "Chapters", hint: "One area per screen, compact cards" },
  { key: "item", label: "One item per screen", hint: "One card at a time, with the chapter row" },
  { key: "page", label: "Single long page", hint: "Every area in order, no chapter row" },
];
export const isLayout = (value: unknown): value is Layout => value === "chapters" || value === "item" || value === "page";

// When an answer needs its reason, question or comment written to count as complete
// (stories/E5-2, acceptance 6; INTERFACES.md ReasonRule; design note 98), the default first.
// The rule itself is textRequired() in src/lib/respondent-rules.ts.
export const DEFAULT_REASON_RULE: ReasonRule = "differs";
export const REASON_RULES_META: { key: ReasonRule; label: string; hint: string }[] = [
  { key: "differs", label: "When the answer differs", hint: "A value other than the proposal, Not needed and Unclear need one. The default." },
  { key: "never", label: "Never", hint: "Reasons and questions are optional. The boxes still show." },
  { key: "always", label: "On every answer", hint: "An agreeing answer or a rating needs a comment too." },
];
export const isReasonRule = (value: unknown): value is ReasonRule => value === "differs" || value === "never" || value === "always";

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

// The item's proposed value read into the method's code, through the import's own word
// list (src/lib/import/values.ts, E3-3: Must, Should, Could, Won't; 1 to 5; keep, change,
// drop), so Build and the check report agree on what counts. A value of another scale, or
// a word the import kept as written, is no proposal on that card.
const STORED_TO_CODE: Record<ScoringMethod, Record<string, string>> = {
  moscow: { Must: "M", Should: "S", Could: "C", "Won't": "W" },
  fit: { "1": "1", "2": "2", "3": "3", "4": "4", "5": "5" },
  kcd: { keep: "K", change: "C", drop: "D" },
};

export function proposedCode(method: ScoringMethod, proposedValue: string | null | undefined): string | null {
  if (!proposedValue) return null;
  const { value, scale } = normaliseValue(proposedValue);
  if (scale !== method) return null;
  return STORED_TO_CODE[method][value] ?? null;
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
  badLayout: "Pick one of the three layouts: chapters, one item per screen, or a single long page.",
  badReasonRule: "Pick when a reason is required: when the answer differs, never, or on every answer.",
  badLabel: `Each label is 1 to ${LABEL_MAX} characters. Leave one empty to keep the default.`,
  sameLabel: "Each value needs its own label, and Unclear is taken.",
  badShape: "The labels did not reach the server as a list. Reload the page and try again.",
  locked: "Published validations keep their method and when a reason is required. Build a new validation to change them.",
} as const;

export const isMethod = (value: unknown): value is ScoringMethod => value === "moscow" || value === "fit" || value === "kcd";

// The labels as the Build form posts them ({ code: text }), trimmed; a code of another
// method or an unknown key is dropped; an empty text means the default; null when every
// label is the default. An error when a label is over the limit or not a string, when two
// values would carry the same word, or when a label is "Unclear" (the fifth pill's word).
export function parseScaleLabels(method: ScoringMethod, raw: unknown): { error: string } | { labels: ScaleLabels | null } {
  if (raw === null || raw === undefined || raw === "") return { labels: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { error: SCORING_ERRORS.badShape };
  const out: ScaleLabels = {};
  for (const v of SCALES[method]) {
    const text = (raw as Record<string, unknown>)[v.code];
    if (text === undefined || text === null) continue;
    if (typeof text !== "string") return { error: SCORING_ERRORS.badShape };
    const label = text.trim();
    if (!label) continue;
    if (label.length > LABEL_MAX) return { error: SCORING_ERRORS.badLabel };
    if (label !== v.label) out[v.code] = label;
  }
  const words = scaleFor(method, out).map((v) => v.label.toLowerCase());
  if (new Set(words).size !== words.length || words.includes(SCORING_COPY.unclear.toLowerCase())) return { error: SCORING_ERRORS.sameLabel };
  return { labels: Object.keys(out).length ? out : null };
}
