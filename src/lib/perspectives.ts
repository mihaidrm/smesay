// Perspectives (stories/E5-4): the names a PM defines on Build, the tags an item carries,
// what a respondent picks on About you, and the one rule for what they see. No database
// import: Build, Shape, the preview, the respondent app (E7) and Results (E8) share it.
// A respondent sees the items with no perspective plus every item sharing at least one of
// their picks; with no picks they see the untagged items only. The SQL twin, for E8's
// counts over 500 rows, is in INTERFACES.md (Perspectives).

export const PERSPECTIVES_MAX = 10;
export const PERSPECTIVE_NAME_MAX = 30;

export const PERSPECTIVES_COPY = {
  tooMany: `Up to ${PERSPECTIVES_MAX} perspectives. Remove one to add another.`,
  badName: `Each perspective is 1 to ${PERSPECTIVE_NAME_MAX} characters, one per line.`,
  sameName: "Each perspective once. Two lines name the same one.",
  unknownTag: "That perspective is not on the instrument. Define it on Build first.",
  noneDefined: "Define perspectives on Build first, then tag items here.",
  badShape: "The tags did not reach the server as a list. Reload the page and try again.",
  locked: "Published instruments keep their perspectives and tags. Build a new instrument to change them.",
  otherSet: (built: number, latest: number) => `These items are on version ${latest} of the list; the instrument is built on version ${built}. Build on version ${latest} first, then tag items here.`,
  otherSetLink: "Go to Build",
  // The respondent's items screen when their picks leave nothing to rate (stories/E5-4;
  // every state has a screen).
  nothingVisible: "Nothing to rate for what you picked. Go back to About you and pick a different perspective.",
} as const;

// The names as the Build form posts them, one per line, trimmed, blank lines dropped.
export function parsePerspectives(raw: unknown): { error: string } | { names: string[] } {
  const lines = typeof raw === "string" ? raw.split(/\r?\n/) : Array.isArray(raw) ? raw : null;
  if (lines === null || lines.some((l) => typeof l !== "string")) return { error: PERSPECTIVES_COPY.badShape };
  const names = (lines as string[]).map((l) => l.trim()).filter(Boolean);
  if (names.length > PERSPECTIVES_MAX) return { error: PERSPECTIVES_COPY.tooMany };
  if (names.some((n) => n.length > PERSPECTIVE_NAME_MAX)) return { error: PERSPECTIVES_COPY.badName };
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return { error: PERSPECTIVES_COPY.sameName };
  return { names };
}

// An item's tags as posted: each must be one of the instrument's names (matched as written).
export function parseTags(raw: unknown, names: string[]): { error: string } | { tags: string[] } {
  let list: unknown = raw;
  if (typeof raw === "string") { try { list = JSON.parse(raw); } catch { return { error: PERSPECTIVES_COPY.badShape }; } }
  if (!Array.isArray(list) || list.some((t) => typeof t !== "string")) return { error: PERSPECTIVES_COPY.badShape };
  const tags = Array.from(new Set((list as string[]).map((t) => t.trim()).filter(Boolean)));
  if (tags.some((t) => !names.includes(t))) return { error: PERSPECTIVES_COPY.unknownTag };
  return { tags };
}

export type Tagged = { perspectives: string[] };

export function isVisible(item: Tagged, picked: string[]): boolean {
  return item.perspectives.length === 0 || item.perspectives.some((p) => picked.includes(p));
}

export function visibleItems<T extends Tagged>(items: T[], picked: string[]): T[] {
  return items.filter((it) => isVisible(it, picked));
}

// The tags that survive a change of the instrument's names: the ones still defined, matched
// ignoring case and spelt as the new names are, so a case-only rename keeps the tags. The
// code twin of the one statement instruments.setPerspectives runs (src/db/queries).
export function keptTags(tags: string[], names: string[]): string[] {
  return tags.flatMap((t) => { const n = names.find((name) => name.toLowerCase() === t.toLowerCase()); return n === undefined ? [] : [n]; });
}
