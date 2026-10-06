// The headline tiles of Results (stories/E8-1, acceptance 1 and 2; design note 40): a catalogue
// of twelve, six on by default, up to six shown, chosen per PM per instrument (user.
// results_prefs, INTERFACES.md ResultsPrefs). Each tile reads one number of the one SQL query
// (src/db/queries/results.ts numbers), so every tile honours the filter. Copy:
// docs/copy/app.md, Results. No database here.

// What the query returns (src/db/queries/results.ts). People: `invited` is everyone the
// filter keeps (started responses and personal invites not opened yet), `submitted` and
// `inProgress` the started ones by status; `shown` and `total` the responses whose answers
// count (the include-unsubmitted switch) with and without the filter. Answers are those of
// the people kept, `answered` the four kinds answered against a proposal (a value rated with
// no proposal shown, `pick`, is counted apart and never in agreement). Items are the
// instrument's list.
export type ResultsNumbers = {
  invited: number;
  submitted: number;
  inProgress: number;
  shown: number;
  total: number;
  agree: number;
  change: number;
  disagree: number;
  unclear: number;
  pick: number;
  answered: number;
  withComment: number;
  missing: number;
  unansweredItems: number;
  fullyAgreed: number;
  pushedBackItems: number;
  medianMinutes: number | null;
  // Any answer on the instrument at all, with no filter and unsubmitted ones included: the
  // empty state shows until the first one.
  anyAnswer: boolean;
  // Open actions of the project (E9; not filtered).
  actions: number;
  // E5-7 (amended 2026-10-06): under Names hidden and Anonymous a filter keeps fewer than
  // MIN_GROUP counted people, so the query kept nobody and the page draws no number.
  tooFew?: boolean;
};

export const TILE_IDS = ["submitted", "agreement", "change", "disagree", "unclear", "missing", "withComment", "unansweredItems", "fullyAgreed", "pushedBackItems", "medianMinutes", "inProgress"] as const;
export type TileId = (typeof TILE_IDS)[number];
export const MAX_TILES = 6;
export const DEFAULT_TILES: TileId[] = ["submitted", "agreement", "change", "disagree", "unclear", "missing"];

// The checklist's names, in the catalogue's order (docs/copy/app.md).
export const TILE_NAMES: Record<TileId, string> = {
  submitted: "Submitted of invited",
  agreement: "Agreement",
  change: "Different priority",
  disagree: "Disagree",
  unclear: "Unclear",
  missing: "Missing items suggested",
  withComment: "Answers with a reason or comment",
  unansweredItems: "Items with no answer yet",
  fullyAgreed: "Items fully agreed",
  pushedBackItems: "Items with a different priority or disagree",
  medianMinutes: "Median minutes to submit",
  inProgress: "Responses in progress",
};

export type Tone = "ink" | "mint" | "violet" | "sun";
export type TileView = { id: TileId; value: string; label: string; tone: Tone };

const isTile = (x: unknown): x is TileId => typeof x === "string" && (TILE_IDS as readonly string[]).includes(x);

// The stored choice, cleaned: known ids, once each, at most six; null (the default six) when
// nothing usable is stored.
export function storedTiles(stored: unknown): TileId[] | null {
  if (!Array.isArray(stored)) return null;
  const kept = [...new Set(stored.filter(isTile))].slice(0, MAX_TILES);
  return kept.length > 0 ? kept : null;
}

// A choice posted by "Choose tiles": one to six known ids, shown in the catalogue's order.
export function parseTileChoice(posted: unknown[]): TileId[] | { error: string } {
  const picked = new Set(posted.filter(isTile));
  if (picked.size === 0) return { error: TILE_ERRORS.none };
  if (picked.size > MAX_TILES) return { error: TILE_ERRORS.tooMany };
  return TILE_IDS.filter((id) => picked.has(id));
}

export const TILE_ERRORS = {
  none: "Pick at least one tile.",
  tooMany: "Pick up to six tiles.",
};

// Agree over answered, a whole percent (63 for 19 of 30).
export const agreementPercent = (n: Pick<ResultsNumbers, "agree" | "answered">): number | null => (n.answered === 0 ? null : Math.round((n.agree / n.answered) * 100));

export function tileView(id: TileId, n: ResultsNumbers): TileView {
  switch (id) {
    case "submitted":
      return { id, value: `${n.submitted} of ${n.invited}`, label: "Submitted of invited", tone: "ink" };
    case "agreement": {
      const pct = agreementPercent(n);
      return { id, value: pct === null ? "None yet" : `${pct}%`, label: `Agreement, ${n.agree} of ${n.answered} answers`, tone: "mint" };
    }
    case "change":
      return { id, value: String(n.change), label: "Different priority", tone: "sun" };
    case "disagree":
      return { id, value: String(n.disagree), label: "Disagree", tone: "sun" };
    case "unclear":
      return { id, value: String(n.unclear), label: "Unclear", tone: "violet" };
    case "missing":
      return { id, value: String(n.missing), label: "Missing items suggested", tone: "ink" };
    case "withComment":
      return { id, value: String(n.withComment), label: "Answers with a reason or comment", tone: "ink" };
    case "unansweredItems":
      return { id, value: String(n.unansweredItems), label: "Items with no answer yet", tone: "ink" };
    case "fullyAgreed":
      return { id, value: String(n.fullyAgreed), label: "Items fully agreed", tone: "mint" };
    case "pushedBackItems":
      return { id, value: String(n.pushedBackItems), label: "Items with a different priority or disagree", tone: "sun" };
    case "medianMinutes":
      return { id, value: n.medianMinutes === null ? "None yet" : String(n.medianMinutes), label: "Median minutes to submit", tone: "ink" };
    case "inProgress":
      return { id, value: String(n.inProgress), label: "Responses in progress", tone: "ink" };
  }
}

// The tab counts (acceptance 1): Different priority and Disagree, Questions and gaps (the
// unclear answers and the missing items suggested), Actions.
export const tabCounts = (n: ResultsNumbers) => ({ pushed: n.change + n.disagree, questions: n.unclear + n.missing, actions: n.actions });
