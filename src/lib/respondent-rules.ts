// The respondent journey's rules with no database import (stories/E7-1 to E7-6), so the
// server, the client app and the tests share one reading: the fields a respondent may send
// (only the ones the PM configured, E5-1; CLAUDE.md, respondent side: "store only the
// respondent fields the PM configured"), the name and role a personal invite carries
// (E6-2), the chapters a respondent sees (the areas in the list's order, the items the
// perspectives they picked leave visible, E5-4), and when an answer is complete (the
// respondent board's complete() rule, design note 12: a value that differs from the
// proposal, Not needed or Unclear needs its reason or question written). Words:
// RESPONDENT_COPY (docs/copy/app.md and errors.md, the respondent sections).
import type { AnswerKind, Layout, RespondentFieldSpec, ResponseFields, ScoringMethod } from "@/db/types";
import { isVisible } from "@/lib/perspectives";
import { missingMandatory, startHint } from "@/lib/respondent-fields";
import { classify, DISAGREE_CODE, SCALES, UNCLEAR } from "@/lib/scoring";

export const FIELD_VALUE_MAX = 200;
export const REASON_MAX = 2000;
export const MISSING_MAX = 500;

export const RESPONDENT_COPY = {
  otherItems: "Other items",
  sampleTitle: "This is a sample link.",
  sampleLine: (workspace: string) => `It belongs to the sample project in ${workspace} and does not collect answers. Ask the person who sent it for the real link.`,
  closedOwnState: (answered: number, total: number) => `You answered ${answered} of ${total} ${total === 1 ? "item" : "items"} before it closed. They were not submitted; the project team sees them marked as not submitted.`,
  startFailed: "Your details were not saved. Check your connection and press Start again.",
  back: "Back",
  aboutYou: "About you",
  // The card (E7-2; docs/copy/app.md, Respondent card; errors.md, Respondent answering).
  notRated: "Not rated yet",
  sayWhy: "Say why.",
  writeQuestion: "Write your question.",
  saved: "Saved",
  details: "Details",
  hideDetails: "Hide details",
  addComment: "+ comment",
  hideComment: "Hide comment",
  commentLabel: "Comment, optional",
  changePrompt: (value: string, proposed: string) => `Why ${value} and not ${proposed}? The team reads every reason.`,
  disagreePrompt: "Why is it not needed, or what should it say instead?",
  unclearPrompt: "What would you need to know to rate it?",
  previousItem: "Previous item",
  nextItem: "Next item",
  // Saving (E7-3; docs/copy/errors.md, Respondent answering).
  notSaved: "Not saved",
  notSavedYet: "Not saved yet",
  offline: "Not saved. Your connection dropped; this page keeps trying. Your answers stay on this device until it reconnects.",
  storageOff: "This browser does not keep answers between visits. You can still answer in one go; if you close the page before you submit, your answers are lost.",
  // Moving through the chapters (E7-4; docs/copy/app.md, Respondent navigation).
  chapters: "Chapters",
  wrapUp: "Wrap up",
  answeredBar: "Items answered",
  // A pill's count and the bar, as a screen reader reads them.
  pillAnswered: (n: number, m: number) => `${n} of ${m} answered`,
  barValue: (n: number, m: number) => `${n} of ${m}`,
  continueTo: (area: string) => `Continue to ${area}`,
  continueWrap: "Continue to Wrap up",
  toRateHere: (n: number, m: number) => `${n} of ${m} still to rate here. You can come back later.`,
  allRated: (m: number) => (m === 1 ? "The item in this chapter is rated." : `All ${m} rated in this chapter.`),
  welcomeBack: (name: string | null) => (name ? `Welcome back, ${name}.` : "Welcome back."),
  answeredBefore: (n: number, m: number) => (n === 0 ? "Your answers so far are kept; none is complete yet." : `You answered ${n} of ${m} last time.`),
  stillToFinish: "Still to finish",
  allAnswered: (m: number) => (m === 1 ? "The item is answered." : `All ${m} items are answered.`),
  allRatedPage: (m: number) => (m === 1 ? "The item is rated." : `All ${m} rated.`),
  // Submit and Done (E7-5; docs/copy/app.md, Wrap up and Done; errors.md, Respondent answering).
  submitting: "Submitting",
  submitFailed: "Your answers were not submitted; they are still saved on this device. Check your connection and press Submit again.",
  change: "Change",
  yourQuestions: "Your questions",
  thanks: (name: string | null) => (name ? `Thank you, ${name}.` : "Thank you."),
  submittedAt: (when: string) => `Submitted ${when}`,
  changeMine: "Change my answers",
  needFields: "your details on About you",
  // After Submit (E7-6; docs/copy/errors.md, the submitted pages).
  summary: (n: { agreed: number; changed: number; notNeeded: number; unclear: number; rated: number; added: number }, blind: boolean) =>
    `${blind ? `${n.rated} rated` : `${n.agreed} agreed, ${n.changed} changed${n.rated > 0 ? `, ${n.rated} rated` : ""}`}, ${n.notNeeded} not needed, ${n.unclear} unclear, ${n.added} ${n.added === 1 ? "item" : "items"} added`,
  // E7-6, acceptance 6: a change after Submit, not submitted again.
  changedSince: "You changed answers after submitting. Submit again to send them.",
  welcomeSubmitted: (name: string | null) => (name ? `Welcome back, ${name}.` : "Welcome back."),
  submittedOn: (when: string, closes: string | null) => (closes ? `You submitted on ${when}. You can change your answers until ${closes}.` : `You submitted on ${when}. You can change your answers while the link is open.`),
  closedSubmitted: (when: string, closed: string, changed: boolean) => `Your answers were submitted on ${when}.${changed ? " You changed some after that and did not submit them again." : ""} The link closed on ${closed}; nothing can be changed now.`,
} as const;

export const RESPONDENT_ERRORS = {
  badShape: "Your details did not reach the server as a form. Reload the page and try again.",
  badOption: (label: string) => `Pick one of the options for ${label}.`,
  badEmail: (text: string) => `${text} is not an email address. Check it and try again.`,
  tooLong: (label: string) => `Keep ${label} to ${FIELD_VALUE_MAX} characters.`,
  badPerspective: "Pick the perspectives from the list on the page. Reload the page and try again.",
  badAnswer: "The answer did not reach the server as one of the card's values. Reload the page and try again.",
  longText: `Keep the reason and the comment to ${REASON_MAX} characters each.`,
  notStarted: "Your details were not found on this device. Press Start again and the answers on this page are saved with them.",
  hiddenItem: "This item is not in your list. Reload the page to see your items.",
  // E7-3: a newer answer for this item reached the server first (another window or device).
  changedElsewhere: "This answer was changed in another window or on another device. The card shows the saved one; change it again if yours should stand.",
  wrapChanged: "Your Wrap up was changed in another window or on another device. This page shows the saved one now; change it again if yours should stand.",
  // E7-3: Start worked but the next save found no response: the browser refused the cookie.
  cookiesBlocked: "This browser did not keep the cookie this page needs to save your answers. Allow cookies for this site, or open the link in another browser.",
  itemsOpen: (n: number) => `${n} ${n === 1 ? "item is" : "items are"} still to finish. Finish ${n === 1 ? "it" : "them"} in the chapters, then submit.`,
  fieldsOpen: "Fill in your details on About you, then submit.",
  confidence: "Pick how sure you are, 1 to 5, before you submit.",
  signOff: "Tick the confirmation to submit.",
  // E7-5: the PM changed the sign-off sentence after this page opened.
  signOffChanged: "The confirmation changed since this page opened. Reload the page, read it and tick it again.",
  // E7-5: during Submit's wait a card's answer was refused or changed in another window.
  checkCards: "One of your answers was not saved as you left it. Check the cards with a red note, then submit again.",
  badMissing: "The missing item did not reach the server as written. Check it and submit again.",
  missingTooLong: `Keep the missing item to ${MISSING_MAX} characters.`,
  closingTooLong: `Keep your answer to ${REASON_MAX} characters.`,
  planFull: "This survey is not taking answers right now. Tell the person who sent you the link; your answers are kept.",
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
// `loose` marks the chapter of items with no area, "Other items" (not an area of the list).
export type Chapter = { name: string | null; intro: string | null; items: RespondentItem[]; loose?: true };

// The chapters a respondent sees: the areas in the list's order (then any area only items
// name), then the items with no area under "Other items"; a list with no areas is one
// chapter with no name. A chapter left empty by the picks is dropped (E5-4).
export function chaptersFor(areas: AreaMeta[], items: RespondentItem[], picks: string[]): Chapter[] {
  const visible = items.filter((it) => isVisible(it, picks));
  const names = areas.map((a) => a.name);
  for (const it of items) if (it.area && !names.includes(it.area)) names.push(it.area);
  if (names.length === 0) return visible.length > 0 ? [{ name: null, intro: null, items: visible }] : [];
  const chapters: Chapter[] = names.map((name) => ({ name, intro: areas.find((a) => a.name === name)?.intro ?? null, items: visible.filter((it) => it.area === name) }));
  const loose = visible.filter((it) => !it.area || !names.includes(it.area));
  if (loose.length > 0) chapters.push({ name: RESPONDENT_COPY.otherItems, intro: null, items: loose, loose: true });
  return chapters.filter((c) => c.items.length > 0);
}

// The areas a missing item can name (E7-5): the chapters that are areas of the list, not
// "Other items" and not the unnamed chapter of a list with no areas (none then: the Wrap up
// asks no area).
export const areasOf = (chapters: Chapter[]): string[] => chapters.flatMap((c) => (c.name && !c.loose ? [c.name] : []));

// The Wrap up's answers as the respondent leaves them (E7-5): the form's values, saved to
// the server as the respondent writes (and kept on the device under smesay-wrap:[token] until
// the server holds them: src/lib/wrap-queue.ts). The sign-off is never kept or saved: it is
// ticked for each Submit.
export type WrapValue = { confidence: number | null; signed: boolean; closingAnswer: string; missing: { text: string; area: string; value: string } };
export const EMPTY_WRAP: WrapValue = { confidence: null, signed: false, closingAnswer: "", missing: { text: "", area: "", value: "" } };
export const wrapKey = (token: string) => `smesay-wrap:${token}`;
// Whether two Wrap ups say the same as the server stores them (the sign-off aside): the texts
// trimmed, and a missing item with no text is none, whatever its area and value say
// (parseWrapInput).
export const sameWrap = (a: WrapValue, b: WrapValue): boolean => {
  const ma = a.missing.text.trim();
  const mb = b.missing.text.trim();
  return a.confidence === b.confidence && a.closingAnswer.trim() === b.closingAnswer.trim() && ma === mb && (ma === "" || (a.missing.area === b.missing.area && a.missing.value === b.missing.value));
};

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

// The screen in the address (?at=about, ?at=[chapter number], ?at=wrap, ?at=done); before
// Start only About you.
export type Screen = { kind: "about" } | { kind: "chapter"; index: number } | { kind: "wrap" } | { kind: "done" };

export const screenParam = (screen: Screen): string => (screen.kind === "chapter" ? String(screen.index + 1) : screen.kind);

// How many chapter screens a layout has: the single page is one screen (E5-3).
export const screenCount = (layout: string, chapters: number): number => (layout === "page" ? Math.min(chapters, 1) : chapters);

export function parseScreen(raw: string | null | undefined, started: boolean, chapterCount: number): Screen {
  if (!started || raw === "about") return { kind: "about" };
  if (raw === "wrap") return { kind: "wrap" };
  if (raw === "done") return { kind: "done" };
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= chapterCount) return { kind: "chapter", index: n - 1 };
  return chapterCount > 0 ? { kind: "chapter", index: 0 } : { kind: "about" };
}

// The first chapter with an item not complete, on that item; every item complete, the last
// chapter (E7-3, acceptance 2; note 12, finding 9). landingOf below decides the screen.
export function resumeAt(chapters: Chapter[], answers: Record<string, AnswerState>): { index: number; item: number } {
  for (let i = 0; i < chapters.length; i++) {
    const item = chapters[i].items.findIndex((it) => !isComplete(answers[it.id]));
    if (item !== -1) return { index: i, item };
  }
  return { index: Math.max(chapters.length - 1, 0), item: 0 };
}

// Where a visit lands and what it says (E7-3, acceptance 2; E7-4, acceptance 4): a screen
// named in the address is taken as it is (parseScreen). A started response with no screen in
// the address lands on the Wrap up when every item is complete, else on the first chapter
// with an unfinished item (on that item in the one-item layout; the single page is one
// screen). "Welcome back" shows on that landing when the response holds any answer, complete
// or not, with the count of complete ones.
export type Landing = { screen: Screen; item: number; welcome: { answered: number; total: number } | null };
export function landingOf(chapters: Chapter[], answers: Record<string, AnswerState>, layout: Layout, at: string | null | undefined, started: boolean, submitted = false): Landing {
  if (!started || at || chapters.length === 0) return { screen: parseScreen(at ?? null, started, screenCount(layout, chapters.length)), item: 0, welcome: null };
  // Submitted: the Done screen (E7-5; E7-6 adds its welcome back).
  if (submitted) return { screen: { kind: "done" }, item: 0, welcome: null };
  const visible = chapters.flatMap((c) => c.items);
  const answered = answeredCount(visible, answers);
  const any = visible.some((it) => answers[it.id]);
  const welcome = any ? { answered, total: visible.length } : null;
  if (answered === visible.length) return { screen: { kind: "wrap" }, item: 0, welcome };
  if (layout === "page") return { screen: { kind: "chapter", index: 0 }, item: 0, welcome };
  const resume = resumeAt(chapters, answers);
  return { screen: { kind: "chapter", index: resume.index }, item: layout === "item" ? resume.item : 0, welcome };
}

// The chapter row's counts (E7-4, acceptance 1): per chapter, the items the server holds a
// complete answer for, and how many there are.
export type ChapterProgress = { done: number; count: number };
export function progressOf(chapters: Chapter[], done: Record<string, boolean>): ChapterProgress[] {
  return chapters.map((c) => ({ done: c.items.filter((it) => done[it.id]).length, count: c.items.length }));
}

// The Wrap up's "Still to finish" (E7-4, acceptance 3): every item without a complete
// answer on the server, in chapter order, with what is missing from the card as the
// respondent left it ("Not rated yet", "Say why.", "Write your question."), or "Not saved
// yet" when the card is complete and its answer has not reached the server.
export type Gap = { itemId: string; reference: string | null; title: string; chapter: number; note: Exclude<CardNote, null> | "notSaved" };
export function gapsOf(chapters: Chapter[], done: Record<string, boolean>, card: (itemId: string) => AnswerState | null): Gap[] {
  return chapters.flatMap((c, chapter) => c.items.filter((it) => !done[it.id]).map((it) => ({ itemId: it.id, reference: it.reference, title: it.title, chapter, note: noteFor(card(it.id)) ?? "notSaved" })));
}

// What the card's note says (E7-2, acceptance 3): the missing part, or null when complete.
export type CardNote = "notRated" | "sayWhy" | "writeQuestion" | null;
export function noteFor(answer: AnswerState | null | undefined): CardNote {
  if (!answer) return "notRated";
  if (isComplete(answer)) return null;
  return answer.kind === "unclear" ? "writeQuestion" : "sayWhy";
}

// One answer as a card posts it: the item, the code picked (a scale code or "unclear"),
// the reason (kept only when the answer needs one) and the comment (kept only when it does
// not: the slot holds one box, docs/design-system.md, Rating row). The stored kind and
// value come from src/lib/scoring.ts classify, never from the client.
// E7-3: base is the answer's version the page made the change on, page the open page's id,
// seq that page's number for this save, response the response the page answers for (its id
// from the page or from Start), after the saves of other pages the change was made on top of
// while the server had not answered for them (a change the device kept from an earlier visit:
// at most AFTER_MAX). See src/lib/answer-queue.ts for how the server uses them.
export type SaveRef = { page: string; seq: number };
export type AnswerInput = { itemId: string; picked: string; reason: string | null; comment: string | null; base: number; page: string; seq: number; after: SaveRef[]; response: string };
export const AFTER_MAX = 8;
// Versions and save numbers are whole numbers that fit Postgres integer.
export const COUNT_MAX = 2_147_483_647;
export const validCount = (n: unknown, min = 0): n is number => typeof n === "number" && Number.isInteger(n) && n >= min && n <= COUNT_MAX;
// A page id: 8 to 64 letters, digits or hyphens (crypto.randomUUID gives 36).
export const validPage = (p: unknown): p is string => typeof p === "string" && /^[A-Za-z0-9-]{8,64}$/.test(p);
// The saves a change was made on top of: absent means none; otherwise at most AFTER_MAX
// well-formed { page, seq }. null when malformed.
export function parseAfter(raw: unknown): SaveRef[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > AFTER_MAX) return null;
  const out: SaveRef[] = [];
  for (const a of raw) {
    if (!a || typeof a !== "object" || !validPage((a as SaveRef).page) || !validCount((a as SaveRef).seq, 1)) return null;
    out.push({ page: (a as SaveRef).page, seq: (a as SaveRef).seq });
  }
  return out;
}
export function parseAnswerInput(raw: unknown): { error: string } | { input: AnswerInput } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: RESPONDENT_ERRORS.badAnswer };
  const r = raw as Record<string, unknown>;
  if (typeof r.itemId !== "string" || typeof r.picked !== "string") return { error: RESPONDENT_ERRORS.badAnswer };
  if (!validCount(r.base) || !validPage(r.page) || !validCount(r.seq, 1) || typeof r.response !== "string") return { error: RESPONDENT_ERRORS.badAnswer };
  const after = parseAfter(r.after);
  if (!after) return { error: RESPONDENT_ERRORS.badAnswer };
  const text = (v: unknown): string | null | undefined => (v === undefined || v === null ? null : typeof v === "string" ? (v.trim() ? v.trim() : null) : undefined);
  const reason = text(r.reason);
  const comment = text(r.comment);
  if (reason === undefined || comment === undefined) return { error: RESPONDENT_ERRORS.badAnswer };
  if ((reason?.length ?? 0) > REASON_MAX || (comment?.length ?? 0) > REASON_MAX) return { error: RESPONDENT_ERRORS.longText };
  return { input: { itemId: r.itemId, picked: r.picked, reason, comment, base: r.base, page: r.page, seq: r.seq, after, response: r.response } };
}

export function answerFor(method: ScoringMethod, showProposed: boolean, proposed: string | null, input: Pick<AnswerInput, "picked" | "reason" | "comment">): { error: string } | { answer: AnswerState } {
  if (input.picked !== UNCLEAR && !SCALES[method].some((v) => v.code === input.picked)) return { error: RESPONDENT_ERRORS.badAnswer };
  const { kind, value } = classify({ method, showProposed, proposed, picked: input.picked });
  return { answer: needsReason(kind) ? { kind, value, reason: input.reason, comment: null } : { kind, value, reason: null, comment: input.comment } };
}

// The picked code an answer shows on the card's rating row.
export const pickedOf = (answer: AnswerState | null | undefined): string | null => (!answer ? null : answer.kind === "unclear" ? UNCLEAR : answer.value);

// The Wrap up's tally and sections (E7-5, acceptance 1; decision 0018 item 5; the respondent
// board's buckets): agreed, a higher or lower priority than proposed (by the scale's order:
// MoSCoW Must 4 to Not needed 1, fit by its number, keep 3, change 2, drop 1), not needed,
// unclear. Rate-blind, and an item with no proposal: rated, not needed (the scale's "not
// needed" value picked), unclear.
const RANK: Record<ScoringMethod, Record<string, number>> = {
  moscow: { M: 4, S: 3, C: 2, W: 1 },
  fit: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 },
  kcd: { K: 3, C: 2, D: 1 },
};
export type Bucket = "agreed" | "higher" | "lower" | "notNeeded" | "unclear" | "rated";
export function bucketOf(method: ScoringMethod, proposed: string | null, answer: AnswerState): Bucket {
  if (answer.kind === "unclear") return "unclear";
  if (answer.kind === "disagree") return "notNeeded";
  if (answer.kind === "agree") return "agreed";
  if (answer.kind === "pick") return answer.value === DISAGREE_CODE[method] ? "notNeeded" : "rated";
  const r = RANK[method];
  return proposed !== null && (r[answer.value ?? ""] ?? 0) > (r[proposed] ?? 0) ? "higher" : "lower";
}
export function tallyOf(method: ScoringMethod, items: { id: string; proposed: string | null }[], answers: Record<string, AnswerState | null>): Record<Bucket, string[]> {
  const out: Record<Bucket, string[]> = { agreed: [], higher: [], lower: [], notNeeded: [], unclear: [], rated: [] };
  for (const it of items) {
    const a = answers[it.id];
    if (a && isComplete(a)) out[bucketOf(method, it.proposed, a)].push(it.id);
  }
  return out;
}

// The Wrap up's answers as the page saves them while the respondent writes (E7-5, saved within
// a second like the cards) and as Submit posts them: the response the page answers for,
// confidence 1 to 5 or none yet, the closing answer (kept only when the PM asked a question),
// and the missing item (text up to 500 characters, an area of the list the respondent sees,
// a value of the scale).
// Every write carries the Wrap up's version it was made on, the page that sends it, that
// page's number for it and the saves of other pages it was made on top of, as an answer's
// (base, page, seq, after; src/lib/answer-queue.ts), and the server applies the same rule
// (wrapTakes).
export type WrapCtx = { method: ScoringMethod; areas: string[]; hasQuestion: boolean; missingForm: boolean; signOff?: string };
export type WrapInput = { response: string; confidence: number | null; closingAnswer: string | null; missing: { text: string; area: string | null; value: string | null } | null; base: number; page: string; seq: number; after: SaveRef[] };
export function parseWrapInput(raw: unknown, ctx: WrapCtx): { error: string } | { input: WrapInput } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: RESPONDENT_ERRORS.badShape };
  const r = raw as Record<string, unknown>;
  if (typeof r.response !== "string" || !validCount(r.base) || !validPage(r.page) || !validCount(r.seq, 1)) return { error: RESPONDENT_ERRORS.badShape };
  const after = parseAfter(r.after);
  if (!after) return { error: RESPONDENT_ERRORS.badShape };
  const confidence = r.confidence === null || r.confidence === undefined ? null : r.confidence;
  if (confidence !== null && (typeof confidence !== "number" || !Number.isInteger(confidence) || confidence < 1 || confidence > 5)) return { error: RESPONDENT_ERRORS.confidence };
  const answer = typeof r.closingAnswer === "string" ? r.closingAnswer.trim() : "";
  if (answer.length > REASON_MAX) return { error: RESPONDENT_ERRORS.closingTooLong };
  let missing: WrapInput["missing"] = null;
  if (ctx.missingForm && r.missing !== undefined && r.missing !== null) {
    if (typeof r.missing !== "object" || Array.isArray(r.missing)) return { error: RESPONDENT_ERRORS.badMissing };
    const m = r.missing as Record<string, unknown>;
    const text = typeof m.text === "string" ? m.text.trim() : "";
    const area = typeof m.area === "string" && m.area !== "" ? m.area : null;
    const value = typeof m.value === "string" && m.value !== "" ? m.value : null;
    if (text.length > MISSING_MAX) return { error: RESPONDENT_ERRORS.missingTooLong };
    if ((area !== null && !ctx.areas.includes(area)) || (value !== null && !SCALES[ctx.method].some((v) => v.code === value))) return { error: RESPONDENT_ERRORS.badMissing };
    if (text) missing = { text, area, value };
  }
  return { input: { response: r.response, confidence: confidence as number | null, closingAnswer: ctx.hasQuestion && answer ? answer : null, missing, base: r.base, page: r.page, seq: r.seq, after } };
}

// The Wrap up's version as the server holds it (response.wrap_version, wrap_writer,
// wrap_writer_seq), and whether a write lands on it: made on that version, or the same page
// wrote last with a lower number, or the last write is one this write was made on top of
// (the rule src/db/queries/answers.ts applies to an answer). Otherwise the write is stale.
export type WrapSync = { version: number; writer: string | null; writerSeq: number };
export const wrapTakes = (stored: WrapSync, write: { base: number; page: string; seq: number; after: SaveRef[] }): boolean =>
  stored.version === write.base || (stored.writer === write.page && stored.writerSeq < write.seq) || write.after.some((a) => stored.writer === a.page && stored.writerSeq <= a.seq);

// Submit (E7-5, acceptance 2 and 3): the Wrap up as above, with confidence given and the
// sign-off ticked on the sentence the PM has now.
export type SubmitInput = WrapInput & { confidence: number };
export function parseSubmitInput(raw: unknown, ctx: WrapCtx): { error: string } | { input: SubmitInput } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: RESPONDENT_ERRORS.badShape };
  const r = raw as Record<string, unknown>;
  if (r.signedOff !== true) return { error: RESPONDENT_ERRORS.signOff };
  // The sentence the respondent ticked, when the page sends it, is the one stored.
  if (typeof r.signOffText === "string" && ctx.signOff !== undefined && r.signOffText !== ctx.signOff) return { error: RESPONDENT_ERRORS.signOffChanged };
  const wrap = parseWrapInput(raw, ctx);
  if ("error" in wrap) return wrap;
  if (wrap.input.confidence === null) return { error: RESPONDENT_ERRORS.confidence };
  return { input: { ...wrap.input, confidence: wrap.input.confidence } };
}

// The PM's "changed after submitting" mark (E7-6, acceptance 4; shown by the tracker, E8-2):
// an answer, the Wrap up or the About you details changed after the first Submit (the last
// save is later). A Submit and a Start that changes nothing do not move the last save.
export function changedAfterSubmit(r: { firstSubmittedAt: Date | null; updatedAt: Date }): boolean {
  return r.firstSubmittedAt !== null && r.updatedAt.getTime() > r.firstSubmittedAt.getTime();
}
// A submitted response with changes not submitted again (E7-6, acceptance 6): every change
// takes the sign-off back until the next Submit.
export const changedSinceSubmit = (r: { submittedAt: Date | null; signedOff: boolean }): boolean => r.submittedAt !== null && !r.signedOff;
