// What a save changed in the builder's preview (design note 128; Mihai, 2026-10-12: "when we
// save something in the 5 steps (import / shape etc, we need to also highlight the change in
// the preview version to make it obvious what is changing"). The respondent app in preview
// mode keeps the view it drew last for the project and step in the tab's session storage
// (src/app/r/[token]/respondent-app.tsx); the load a save causes (src/lib/preview.ts
// previewSrc) compares the two and marks the parts that differ. Pure: two snapshots in, the
// changes out, the sentence the band shows and the card the compact view opens on.
import type { ClosingSpec, Layout, ReasonRule, RespondentFieldSpec, ScaleLabels, ScoringMethod } from "@/db/types";
import { PREVIEW_COPY } from "@/lib/build-copy";
import { listOf } from "@/lib/build-guide";
import type { AreaMeta, RespondentItem } from "@/lib/respondent-rules";

export type PreviewInstrument = { title: string; intro: string | null; fields: RespondentFieldSpec[]; perspectives: string[]; method: ScoringMethod; labels: ScaleLabels | null; showProposed: boolean; layout: Layout; reasonRule: ReasonRule };
export type PreviewSnapshot = { instrument: PreviewInstrument; items: RespondentItem[]; areas: AreaMeta[]; closing: ClosingSpec; closesAt: string | null };

export type PreviewChanges = {
  // Item ids: a new reference, title or details; another proposed value; not in the last
  // view; another area; other perspectives.
  wording: string[];
  proposals: string[];
  added: string[];
  moved: string[];
  tags: string[];
  removed: number;
  // The rating row (method, labels, the proposal shown, the reason rule); the chapter row (the
  // areas, their order and lines, the layout); About you (title, intro, fields, the
  // perspective names); the Wrap up (the Closing card); the closing date in the header.
  rating: boolean;
  sections: boolean;
  about: boolean;
  closing: boolean;
  note: boolean;
};

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function diffPreview(prev: PreviewSnapshot, next: PreviewSnapshot): PreviewChanges | null {
  const before = new Map(prev.items.map((it) => [it.id, it]));
  const c: PreviewChanges = { wording: [], proposals: [], added: [], moved: [], tags: [], removed: 0, rating: false, sections: false, about: false, closing: false, note: false };
  for (const it of next.items) {
    const was = before.get(it.id);
    if (!was) { c.added.push(it.id); continue; }
    if (was.reference !== it.reference || was.title !== it.title || was.details !== it.details) c.wording.push(it.id);
    if (was.proposed !== it.proposed) c.proposals.push(it.id);
    if (was.area !== it.area) c.moved.push(it.id);
    if (!same(was.perspectives, it.perspectives)) c.tags.push(it.id);
  }
  const kept = new Set(next.items.map((it) => it.id));
  c.removed = prev.items.filter((it) => !kept.has(it.id)).length;
  const p = prev.instrument;
  const n = next.instrument;
  c.rating = p.method !== n.method || !same(p.labels, n.labels) || p.showProposed !== n.showProposed || p.reasonRule !== n.reasonRule;
  // A new method maps or drops every proposal with it: the rating row says that once.
  if (p.method !== n.method) c.proposals = [];
  c.sections = !same(prev.areas, next.areas) || p.layout !== n.layout;
  c.about = p.title !== n.title || p.intro !== n.intro || !same(p.fields, n.fields) || !same(p.perspectives, n.perspectives);
  c.closing = !same(prev.closing, next.closing);
  c.note = prev.closesAt !== next.closesAt;
  const cards = c.wording.length + c.proposals.length + c.added.length + c.moved.length + c.tags.length + c.removed;
  return cards > 0 || c.rating || c.sections || c.about || c.closing || c.note ? c : null;
}

export const changedIds = (c: PreviewChanges): Set<string> => new Set([...c.added, ...c.wording, ...c.proposals, ...c.moved, ...c.tags]);

// Up to three cards are named by their references; more, or a card without one, are counted.
const named = (ids: string[], items: RespondentItem[]): string | null => {
  const refs = ids.map((id) => items.find((it) => it.id === id)?.reference ?? null);
  return refs.length <= 3 && refs.every((r): r is string => r !== null && r !== "") ? listOf(refs) : null;
};

export function changedParts(c: PreviewChanges, items: RespondentItem[]): string[] {
  const P = PREVIEW_COPY.parts;
  const parts: string[] = [];
  const put = (ids: string[], phrase: (names: string | null, n: number) => string) => { if (ids.length > 0) parts.push(phrase(named(ids, items), ids.length)); };
  put(c.added, P.added);
  if (c.removed > 0) parts.push(P.removed(c.removed));
  put(c.wording, P.wording);
  put(c.proposals, P.proposal);
  put(c.moved, P.section);
  put(c.tags, P.tags);
  if (c.rating) parts.push(P.rating);
  if (c.sections) parts.push(P.nav);
  if (c.about) parts.push(P.about);
  if (c.closing) parts.push(P.closing);
  if (c.note) parts.push(P.note);
  return parts;
}

export const changesLine = (c: PreviewChanges, items: RespondentItem[]): string => PREVIEW_COPY.changed(listOf(changedParts(c, items)));

// The compact view opens on the first card that changed, in the order respondents see them:
// the chapter and the card's place in it, or on the single long page its place overall.
export function focusOf(c: PreviewChanges, chapters: { items: { id: string }[] }[], layout: Layout): { index: number; item: number } | null {
  const ids = changedIds(c);
  let flat = 0;
  for (const [index, chapter] of chapters.entries()) {
    for (const [item, it] of chapter.items.entries()) {
      if (ids.has(it.id)) return layout === "page" ? { index: 0, item: flat } : { index, item };
      flat += 1;
    }
  }
  return null;
}
