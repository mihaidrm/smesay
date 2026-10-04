// The respondent journey's rules with no database import (stories/E7-1 to E7-6), so the
// server, the client app and the tests share one reading: the fields a respondent may send
// (only the ones the PM configured, E5-1; CLAUDE.md, respondent side: "store only the
// respondent fields the PM configured"), the name and role a personal invite carries
// (E6-2), the chapters a respondent sees (the areas in the list's order, the items the
// perspectives they picked leave visible, E5-4), and when an answer is complete (the
// respondent board's complete() rule, design note 12: a value that differs from the
// proposal, Not needed or Unclear needs its reason or question written). Words:
// RESPONDENT_COPY (docs/copy/app.md and errors.md, the respondent sections).
import type { AnswerKind, RespondentFieldSpec, ResponseFields } from "@/db/types";
import { missingMandatory, startHint } from "@/lib/respondent-fields";

export const FIELD_VALUE_MAX = 200;
export const REASON_MAX = 2000;

export const RESPONDENT_COPY = {
  otherItems: "Other items",
  sampleTitle: "This is a sample link.",
  sampleLine: (workspace: string) => `It belongs to the sample project in ${workspace} and does not collect answers. Ask the person who sent it for the real link.`,
  closedOwnState: (answered: number, total: number) => `You answered ${answered} of ${total} ${total === 1 ? "item" : "items"} before it closed. They were not submitted; the project team sees them marked as not submitted.`,
  startFailed: "Your details were not saved. Check your connection and press Start again.",
  back: "Back",
  aboutYou: "About you",
} as const;

export const RESPONDENT_ERRORS = {
  badShape: "Your details did not reach the server as a form. Reload the page and try again.",
  badOption: (label: string) => `Pick one of the options for ${label}.`,
  badEmail: (text: string) => `${text} is not an email address. Check it and try again.`,
  tooLong: (label: string) => `Keep ${label} to ${FIELD_VALUE_MAX} characters.`,
  badPerspective: "Pick the perspectives from the list on the page. Reload the page and try again.",
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The name and role a personal invite carries, on the fields the PM configured under those
// keys; a dropdown only with one of its options (the rest is asked; E6-2).
export function carriedFields(invite: { kind: string; name: string | null; roleHint: string | null }, spec: RespondentFieldSpec[]): ResponseFields {
  if (invite.kind !== "personal") return {};
  const carried: Record<string, string | null> = { name: invite.name, role: invite.roleHint };
  const out: ResponseFields = {};
  for (const f of spec) {
    const value = carried[f.key];
    if (!value || (f.type === "dropdown" && !(f.options ?? []).includes(value))) continue;
    out[f.key] = value;
  }
  return out;
}

// The About you values as posted, against the PM's fields: only configured keys are kept,
// each trimmed and at most FIELD_VALUE_MAX characters, a dropdown one of its options, an
// email field an address; the carried values win over anything posted for their keys; every
// mandatory field filled (the Start hint names what is missing, decision 0043).
export function parseFieldValues(spec: RespondentFieldSpec[], raw: unknown, carried: ResponseFields): { error: string } | { values: ResponseFields } {
  if (raw !== undefined && raw !== null && (typeof raw !== "object" || Array.isArray(raw))) return { error: RESPONDENT_ERRORS.badShape };
  const posted = (raw ?? {}) as Record<string, unknown>;
  const values: ResponseFields = {};
  for (const f of spec) {
    if (carried[f.key]) { values[f.key] = carried[f.key]; continue; }
    const rawValue = posted[f.key];
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;
    if (typeof rawValue !== "string") return { error: RESPONDENT_ERRORS.badShape };
    const value = rawValue.trim();
    if (!value) continue;
    if (value.length > FIELD_VALUE_MAX) return { error: RESPONDENT_ERRORS.tooLong(f.label) };
    if (f.type === "dropdown" && !(f.options ?? []).includes(value)) return { error: RESPONDENT_ERRORS.badOption(f.label) };
    if (f.type === "email" && !EMAIL.test(value)) return { error: RESPONDENT_ERRORS.badEmail(value) };
    values[f.key] = value;
  }
  if (missingMandatory(spec, values).length > 0) return { error: startHint(spec) };
  return { values };
}

// The perspectives picked, a subset of the instrument's, in its order.
export function parsePicks(names: string[], raw: unknown): { error: string } | { picks: string[] } {
  if (raw === undefined || raw === null) return { picks: [] };
  if (!Array.isArray(raw) || raw.some((p) => typeof p !== "string" || !names.includes(p))) return { error: RESPONDENT_ERRORS.badPerspective };
  return { picks: names.filter((n) => raw.includes(n)) };
}

// One item as the respondent side sees it: the reader text when accepted, the details
// (the first custom column, or the original when the reader text replaced it), the
// proposed value as a code of the method (src/lib/scoring.ts proposedCode).
export type RespondentItem = { id: string; reference: string | null; title: string; details: string | null; area: string | null; proposed: string | null; perspectives: string[] };
export type AreaMeta = { name: string; intro: string | null };
export type Chapter = { name: string | null; intro: string | null; items: RespondentItem[] };

const visibleTo = (item: { perspectives: string[] }, picks: string[]) => item.perspectives.length === 0 || item.perspectives.some((p) => picks.includes(p));

// The chapters a respondent sees: the areas in the list's order (then any area only items
// name), then the items with no area under "Other items"; a list with no areas is one
// chapter with no name. A chapter left empty by the picks is dropped (E5-4).
export function chaptersFor(areas: AreaMeta[], items: RespondentItem[], picks: string[]): Chapter[] {
  const visible = items.filter((it) => visibleTo(it, picks));
  const names = areas.map((a) => a.name);
  for (const it of items) if (it.area && !names.includes(it.area)) names.push(it.area);
  if (names.length === 0) return visible.length > 0 ? [{ name: null, intro: null, items: visible }] : [];
  const chapters: Chapter[] = names.map((name) => ({ name, intro: areas.find((a) => a.name === name)?.intro ?? null, items: visible.filter((it) => it.area === name) }));
  const loose = visible.filter((it) => !it.area || !names.includes(it.area));
  if (loose.length > 0) chapters.push({ name: RESPONDENT_COPY.otherItems, intro: null, items: loose });
  return chapters.filter((c) => c.items.length > 0);
}

// An answer as stored (INTERFACES.md, AnswerKind) and when it is complete.
export type AnswerState = { kind: AnswerKind; value: string | null; reason: string | null; comment: string | null };

export const needsReason = (kind: AnswerKind): boolean => kind === "change" || kind === "disagree" || kind === "unclear";

export function isComplete(answer: AnswerState | null | undefined): boolean {
  if (!answer) return false;
  return needsReason(answer.kind) ? Boolean(answer.reason?.trim()) : true;
}

// How many of these items carry a complete answer.
export function answeredCount(items: { id: string }[], answers: Record<string, AnswerState>): number {
  return items.filter((it) => isComplete(answers[it.id])).length;
}

// The screen in the address (?at=about, ?at=[chapter number]); before Start only About you.
export type Screen = { kind: "about" } | { kind: "chapter"; index: number };

export const screenParam = (screen: Screen): string => (screen.kind === "about" ? "about" : String(screen.index + 1));

export function parseScreen(raw: string | null | undefined, started: boolean, chapterCount: number): Screen {
  if (!started || raw === "about") return { kind: "about" };
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= chapterCount) return { kind: "chapter", index: n - 1 };
  return chapterCount > 0 ? { kind: "chapter", index: 0 } : { kind: "about" };
}
