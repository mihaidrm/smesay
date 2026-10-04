// The respondent journey on the server (stories/E7-1 onwards): what a link shows to the
// device asking, and the writes a respondent makes. No session: the token names the link
// (src/db/queries/links.ts, src/lib/link-access.ts), and every write first checks the link
// is open for this device (the passcode proof included), so a revoked or closed link
// writes nothing (E6-4). The sample project's links never collect answers (E8-8,
// acceptance 2): they show their own page. A personal link has one response, created on
// the first Start under the invite row's lock; a public link has one response per device,
// keyed by a 32-hex device token (crypto.randomBytes(16), nodejs.org/api/crypto.html)
// set on Start in a cookie scoped to the link's path (E7-3). Rules shared with the client:
// src/lib/respondent-rules.ts.
import { randomBytes } from "node:crypto";
import { answers, items, itemSets, links, missingItems, responses } from "@/db/queries";
import type { Answer } from "@/db/queries/answers";
import type { Link } from "@/db/queries/links";
import type { InviteDates, Response } from "@/db/queries/responses";
import { textFor } from "@/lib/item-text";
import { isVisible } from "@/lib/perspectives";
import { viewOf, type LinkView } from "@/lib/link-access";
import { signOffFor } from "@/lib/closing";
import { sendMail, type Mail } from "@/lib/mail";
import { receiptEmail } from "@/lib/mail/receipt-email";
import { withinPlan } from "@/lib/plans";
import { missingMandatory } from "@/lib/respondent-fields";
import { answerFor, answeredCount, areasOf, carriedFields, chaptersFor, isComplete, parseAnswerInput, parseFieldValues, parsePicks, parseSubmitInput, parseWrapInput, RESPONDENT_ERRORS, tallyOf, EMPTY_WRAP, type WrapValue, type AnswerState, type AreaMeta, type RespondentItem } from "@/lib/respondent-rules";
import { proposedCode } from "@/lib/scoring";
import { linkState } from "@/lib/sharing";

export const DEVICE_COOKIE = "smesay-device";
export const DEVICE_COOKIE_SECONDS = 365 * 24 * 60 * 60;
export const newDeviceToken = (): string => randomBytes(16).toString("hex");

export type RespondentCookies = { passcode?: string; device?: string };

// What the page renders: the link's own state page, the sample page, or the open
// instrument with this device's response (null before Start).
export type RespondentView =
  | LinkView
  | { kind: "sample"; link: Link }
  | { kind: "closedOwn"; link: Link; closedAt: Date; response: Response; answered: number; total: number }
  | { kind: "ready"; link: Link; response: Response | null; items: RespondentItem[]; areas: AreaMeta[]; answers: Record<string, AnswerState>; versions: Record<string, number>; wrap: WrapValue };

// The response this device has on this link: the personal invite's, or the one its device
// cookie names on the public link.
async function responseOf(link: Link, device: string | undefined): Promise<Response | null> {
  if (link.invite.kind === "personal") return responses.forInvite(link.ws, link.invite.id);
  return device ? responses.forDevice(link.ws, link.invite.id, device) : null;
}

export async function itemsOf(link: Link): Promise<{ items: RespondentItem[]; areas: AreaMeta[] }> {
  const set = await itemSets.get(link.ws, link.instrument.itemSetId);
  const rows = set ? await items.forSet(link.ws, set.id) : [];
  const method = link.instrument.method;
  return {
    areas: (set?.areas ?? []).map((a) => ({ name: a.name, intro: a.rationale ?? null })),
    items: rows.map((it) => {
      const title = textFor(it);
      const custom = it.custom && typeof it.custom === "object" ? Object.values(it.custom as Record<string, unknown>).find((v): v is string => typeof v === "string" && v.trim() !== "") : undefined;
      // Rate-blind (E5-2, acceptance 2): the proposal never reaches the page when it is hidden.
      const proposed = link.instrument.showProposed ? proposedCode(method, it.proposedValue) : null;
      return { id: it.id, reference: it.sourceRef, title, details: custom ?? (title !== it.originalText ? it.originalText : null), area: it.area, proposed, perspectives: it.perspectives };
    }),
  };
}

export const answerMap = (rows: Answer[]): Record<string, AnswerState> => Object.fromEntries(rows.map((a) => [a.itemId, { kind: a.kind, value: a.value, reason: a.reason, comment: a.comment }]));

export async function loadRespondent(token: string, cookies: RespondentCookies, now = new Date()): Promise<RespondentView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  if (link.project.isSample) return { kind: "sample", link };
  const view = viewOf(link, cookies.passcode, now);
  if (view.kind === "closed" && link.invite.kind === "personal") {
    // A closed personal link shows the respondent's own state (E7-1, acceptance 3; note
    // 12, finding 33) when they started, answered something and did not submit
    // (docs/copy/errors.md); a submitted response's closed page is E7-6's; a closed public
    // link shows none (decision 0031).
    const response = await responseOf(link, undefined);
    if (response && !response.submittedAt) {
      const { items: all } = await itemsOf(link);
      const rows = answerMap(await answers.forResponse(link.ws, response.id));
      const visible = all.filter((it) => isVisible(it, response.perspectives));
      const answered = answeredCount(visible, rows);
      if (answered > 0) return { kind: "closedOwn", link, closedAt: view.closedAt, response, answered, total: visible.length };
    }
  }
  if (view.kind !== "open") return view;
  const response = await responseOf(link, cookies.device);
  const { items: list, areas } = await itemsOf(link);
  const rows = response ? await answers.forResponse(link.ws, response.id) : [];
  // The Wrap up as last saved (E7-5: saved as the respondent writes, and by Submit).
  const missing = response ? (await missingItems.forResponse(link.ws, response.id))[0] : undefined;
  const wrap: WrapValue = response ? { confidence: response.confidence, signed: false, closingAnswer: response.closingAnswer ?? "", missing: { text: missing?.text ?? "", area: missing?.suggestedArea ?? "", value: missing?.suggestedValue ?? "" } } : EMPTY_WRAP;
  return { kind: "ready", link, response, items: list, areas, answers: answerMap(rows), versions: Object.fromEntries(rows.map((a) => [a.itemId, a.version])), wrap };
}

export type WriteRefusal = { status: 403 | 404 | 409 | 410 | 422; error: string };

// The link, open for this device, for a write: the same reading as the page, with the
// status a route answers when it is not.
export async function openLinkFor(token: string, cookies: RespondentCookies, now = new Date()): Promise<WriteRefusal | { link: Link }> {
  const link = await links.byToken(token);
  if (!link) return { status: 404, error: "unknown" };
  if (link.project.isSample) return { status: 403, error: "sample" };
  const view = viewOf(link, cookies.passcode, now);
  if (view.kind === "revoked" || view.kind === "closed") return { status: 410, error: view.kind };
  if (view.kind === "notOpen") return { status: 409, error: "notOpen" };
  if (view.kind === "passcode") return { status: 403, error: "passcode" };
  return { link };
}

// The refusal for a link that stopped being open between the check and the write: a
// renewed personal link (a new token on the same row) reads as revoked for the old one.
function refusalOf(dates: InviteDates, token: string, now: Date): WriteRefusal {
  if (dates.token !== token) return { status: 410, error: "revoked" };
  const state = linkState(dates, now);
  return state === "notOpen" ? { status: 409, error: "notOpen" } : { status: 410, error: state === "revoked" ? "revoked" : "closed" };
}

// Start (E7-1, acceptance 1 and 2): the About you values and the perspectives, checked
// against the PM's configuration; the response created or its fields updated. A public
// link's first Start returns the new device token for the cookie.
export async function startResponse(token: string, cookies: RespondentCookies, body: unknown, now = new Date()): Promise<WriteRefusal | { response: Response; device: string | null }> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const input = (body && typeof body === "object" && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const spec = link.instrument.respondentFields;
  const fields = parseFieldValues(spec, input.fields, carriedFields(link.invite, spec));
  if ("error" in fields) return { status: 422, error: fields.error };
  const picks = parsePicks(link.instrument.perspectives, input.perspectives);
  if ("error" in picks) return { status: 422, error: picks.error };
  const data = { instrumentId: link.instrument.id, itemSetId: link.instrument.itemSetId, inviteId: link.invite.id, fields: fields.values, perspectives: picks.picks };
  // The link re-read under the invite row's lock: a Revoke or a date change committed since
  // openLinkFor wins (src/db/queries/responses.ts).
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  if (link.invite.kind === "personal") {
    const started = await responses.startPersonal(link.ws, { ...data, deviceToken: newDeviceToken() }, stillOpen);
    if (!started) return { status: 404, error: "unknown" };
    if ("refused" in started) return refusalOf(started.refused, token, now);
    if (started.created) return { response: started.response, device: null };
    const updated = await responses.update(link.ws, started.response.id, { fields: fields.values, perspectives: picks.picks, updatedAt: now });
    return { response: updated ?? started.response, device: null };
  }
  const existing = cookies.device ? await responses.forDevice(link.ws, link.invite.id, cookies.device) : null;
  if (existing) {
    const updated = await responses.update(link.ws, existing.id, { fields: fields.values, perspectives: picks.picks, updatedAt: now });
    return { response: updated ?? existing, device: null };
  }
  const device = newDeviceToken();
  const created = await responses.createPublic(link.ws, { ...data, deviceToken: device }, stillOpen);
  if (!created) return { status: 404, error: "unknown" };
  if ("refused" in created) return refusalOf(created.refused, token, now);
  return { response: created, device };
}

// One answer (E7-2, acceptance 2 and 3; E7-3 sends it within a second): the link open for
// this device, the device's response started (409 otherwise), the item one of the
// response's set and visible to its perspectives (422 otherwise), the kind and value from
// the instrument's method and the item's proposal (src/lib/scoring.ts classify), never the
// client's word; the answer replaces the item's previous one and the response's last save
// moves, both after the link is re-read under the invite row's lock. From E7-3 the write
// carries the version it was made on, the page and its save number, and the response the
// page answers for: a response that is not this device's is "not started" (an open window
// whose cookie was replaced), and a write the stored answer has moved past changes nothing
// and returns { stale } with the stored answer, its version and who wrote it
// (src/lib/answer-queue.ts).
export type Written = { version: number; writer: string | null; writerSeq: number };
export type SavedAnswer = { answer: AnswerState; complete: boolean } & Written;
export async function saveAnswer(token: string, cookies: RespondentCookies, body: unknown, now = new Date()): Promise<WriteRefusal | SavedAnswer | { stale: SavedAnswer }> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const parsed = parseAnswerInput(body);
  if ("error" in parsed) return { status: 422, error: parsed.error };
  const response = await responseOf(link, cookies.device);
  if (!response || response.id !== parsed.input.response) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const row = await items.get(link.ws, parsed.input.itemId);
  const visible = row && row.itemSetId === response.itemSetId && isVisible(row, response.perspectives);
  if (!row || !visible) return { status: 422, error: RESPONDENT_ERRORS.hiddenItem };
  const mapped = answerFor(link.instrument.method, link.instrument.showProposed, proposedCode(link.instrument.method, row.proposedValue), parsed.input);
  if ("error" in mapped) return { status: 422, error: mapped.error };
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  const { base, page, seq, after } = parsed.input;
  const written = await answers.upsert(link.ws, link.invite.id, { responseId: response.id, itemSetId: response.itemSetId, itemId: row.id, ...mapped.answer, base, page, seq, after }, stillOpen, now);
  if (!written) return { status: 404, error: "unknown" };
  if ("refused" in written) return refusalOf(written.refused, token, now);
  if ("stale" in written) {
    const stored = answerMap([written.stale])[row.id];
    return { stale: { answer: stored, complete: isComplete(stored), version: written.stale.version, writer: written.stale.writer, writerSeq: written.stale.writerSeq } };
  }
  return { answer: mapped.answer, complete: isComplete(mapped.answer), version: written.version, writer: written.writer, writerSeq: written.writerSeq };
}

// The Wrap up's answers as the respondent writes them (E7-5; PUT /r/[token]/wrap): the link
// open for this device, the response started and the one the page answers for, the answers
// read as Submit reads them (parseWrapInput), then stored under the invite row's lock and the
// response's (responses.saveWrap).
export async function saveWrap(token: string, cookies: RespondentCookies, body: unknown, now = new Date()): Promise<WriteRefusal | { saved: true }> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const response = await responseOf(link, cookies.device);
  if (!response) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const { items: all, areas } = await itemsOf(link);
  const chapters = chaptersFor(areas, all, response.perspectives);
  const closing = link.instrument.closing;
  const parsed = parseWrapInput(body, { method: link.instrument.method, areas: areasOf(chapters), hasQuestion: Boolean(closing.closingQuestion), missingForm: closing.missingForm });
  if ("error" in parsed) return { status: 422, error: parsed.error };
  if (parsed.input.response !== response.id) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  const { confidence, closingAnswer, missing } = parsed.input;
  const saved = await responses.saveWrap(link.ws, link.invite.id, response.id, { confidence, closingAnswer, missing }, stillOpen, now);
  if (!saved) return { status: 404, error: "unknown" };
  if ("refused" in saved) return refusalOf(saved.refused, token, now);
  return { saved: true };
}

// The first word of the respondent's name, for "Thank you, [NAME]." and "Welcome back":
// the name field Start saved, else a personal invite's name.
export function firstNameOf(link: Link, response: Pick<Response, "fields">): string | null {
  const name = response.fields.name ?? (link.invite.kind === "personal" ? link.invite.name : null) ?? "";
  return name.trim().split(/\s+/)[0] || null;
}

// Submit (E7-5, acceptance 2 to 5): the link open for this device, the response started,
// the PM's mandatory fields filled, confidence 1 to 5 and the sign-off ticked
// (parseSubmitInput); the plan's monthly responses checked on the first Submit (withinPlan,
// E2-6; no plan has a cap today); then, under the invite row's lock and the response's,
// every visible item complete (read under the lock, so no save lands between the check and
// the mark), the response marked submitted with the sign-off sentence the respondent saw and
// its one missing item replaced. A second Submit updates the same response. A personal
// invite's address gets the receipt (email 4) on the first Submit: an address the PM chose,
// never one typed on a public link, which would let anyone send mail through SMEsay. The
// receipt goes after the reply (`receipt`, run by the route with after():
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md); one that fails
// to send does not undo the Submit.
export type Submitted = { submittedAt: Date; name: string | null; receipt: (() => Promise<void>) | null };
export async function submitResponse(token: string, cookies: RespondentCookies, body: unknown, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<WriteRefusal | Submitted> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const response = await responseOf(link, cookies.device);
  if (!response) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const { items: all, areas } = await itemsOf(link);
  const chapters = chaptersFor(areas, all, response.perspectives);
  const visible = chapters.flatMap((c) => c.items);
  const spec = link.instrument.respondentFields;
  if (missingMandatory(spec, { ...response.fields, ...carriedFields(link.invite, spec) }).length > 0) return { status: 422, error: RESPONDENT_ERRORS.fieldsOpen };
  const closing = link.instrument.closing;
  const parsed = parseSubmitInput(body, { method: link.instrument.method, areas: areasOf(chapters), hasQuestion: Boolean(closing.closingQuestion), missingForm: closing.missingForm, signOff: signOffFor(closing) });
  if ("error" in parsed) return { status: 422, error: parsed.error };
  // The response the page answers for: an open window whose cookie was replaced since never
  // submits the response another window started (as saveAnswer).
  if (parsed.input.response !== response.id) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  if (!response.submittedAt && !(await withinPlan(link.ws, "responses", now))) return { status: 403, error: RESPONDENT_ERRORS.planFull };
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  let rows: Record<string, AnswerState> = {};
  const check = (stored: Answer[]) => {
    rows = answerMap(stored);
    const openItems = visible.filter((it) => !isComplete(rows[it.id])).length;
    return openItems > 0 ? RESPONDENT_ERRORS.itemsOpen(openItems) : null;
  };
  const { confidence, closingAnswer, missing } = parsed.input;
  const saved = await responses.submit(link.ws, link.invite.id, response.id, { confidence, closingAnswer, missing, signOffText: signOffFor(closing) }, stillOpen, check, now);
  if (!saved) return { status: 404, error: "unknown" };
  if ("refused" in saved) return refusalOf(saved.refused, token, now);
  if ("invalid" in saved) return { status: 422, error: saved.invalid };
  // The first Submit, decided from the row written under the lock: two Submits at once on
  // one personal link send one receipt.
  const first = saved.firstSubmittedAt?.getTime() === now.getTime();
  const to = link.invite.kind === "personal" && first ? link.invite.email : null;
  const receipt = to
    ? async () => {
        const tally = tallyOf(link.instrument.method, visible, rows);
        const mail = receiptEmail({ respondentName: link.invite.name ?? null, projectName: link.project.name, workspaceName: link.brand.name, submittedAt: now, closesAt: link.invite.closesAt, url: `${baseUrl}/r/${token}`, counts: { items: visible.length, changed: tally.higher.length + tally.lower.length, rated: tally.rated.length, notNeeded: tally.notNeeded.length, unclear: tally.unclear.length, missing: missing ? 1 : 0, confidence }, rateBlind: !link.instrument.showProposed });
        try { await send({ to, ...mail }); } catch { /* The answers are in; the receipt is a courtesy. */ }
      }
    : null;
  return { submittedAt: now, name: firstNameOf(link, saved), receipt };
}
