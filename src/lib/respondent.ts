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
import type { WorkspaceId } from "@/db/types";
import type { InviteDates, Response, StoredWrap } from "@/db/queries/responses";
import { textFor } from "@/lib/item-text";
import { isVisible } from "@/lib/perspectives";
import { viewOf, type LinkView } from "@/lib/link-access";
import { signOffFor } from "@/lib/closing";
import { sendMail, type Mail } from "@/lib/mail";
import { receiptEmail } from "@/lib/mail/templates/receipt";
import { withinPlan } from "@/lib/plans";
import { missingMandatory } from "@/lib/respondent-fields";
import { answerFor, answeredCount, areasOf, carriedFields, changedSinceSubmit, chaptersFor, isComplete, parseAnswerInput, parseFieldValues, parsePicks, parseSubmitInput, parseWrapInput, RESPONDENT_ERRORS, tallyOf, EMPTY_WRAP, type WrapSync, type WrapValue, type AnswerState, type AreaMeta, type RespondentItem } from "@/lib/respondent-rules";
import { proposedCode } from "@/lib/scoring";
import { track } from "@/lib/analytics";
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
  | { kind: "closedSubmitted"; link: Link; closedAt: Date; submittedAt: Date; changed: boolean }
  | { kind: "ready"; link: Link; response: Response | null; items: RespondentItem[]; areas: AreaMeta[]; answers: Record<string, AnswerState>; versions: Record<string, number>; wrap: WrapValue; wrapSync: WrapSync };

// The response this device has on this link: the personal invite's, or the one its device
// cookie names on the public link.
async function responseOf(link: Link, device: string | undefined): Promise<Response | null> {
  if (link.invite.kind === "personal") return responses.forInvite(link.ws, link.invite.id);
  return device ? responses.forDevice(link.ws, link.invite.id, device) : null;
}

export const itemsOf = (link: Link): Promise<{ items: RespondentItem[]; areas: AreaMeta[] }> => itemsFor(link.ws, link.instrument);

// The items and areas of an instrument's set as the respondent sees them; the builder's preview
// (stories/E5-6, src/lib/preview.ts) reads them for a draft or the latest set the same way.
export async function itemsFor(ws: WorkspaceId, instrument: Pick<Link["instrument"], "itemSetId" | "method" | "showProposed">): Promise<{ items: RespondentItem[]; areas: AreaMeta[] }> {
  const set = await itemSets.get(ws, instrument.itemSetId);
  const rows = set ? await items.forSet(ws, set.id) : [];
  const method = instrument.method;
  return {
    areas: (set?.areas ?? []).map((a) => ({ name: a.name, intro: a.rationale ?? null })),
    items: rows.map((it) => {
      const title = textFor(it);
      const custom = it.custom && typeof it.custom === "object" ? Object.values(it.custom as Record<string, unknown>).find((v): v is string => typeof v === "string" && v.trim() !== "") : undefined;
      // Rate-blind (E5-2, acceptance 2): the proposal never reaches the page when it is hidden.
      const proposed = instrument.showProposed ? proposedCode(method, it.proposedValue) : null;
      return { id: it.id, reference: it.sourceRef, title, details: custom ?? (title !== it.originalText ? it.originalText : null), area: it.area, proposed, perspectives: it.perspectives };
    }),
  };
}

export const answerMap = (rows: Answer[]): Record<string, AnswerState> => Object.fromEntries(rows.map((a) => [a.itemId, { kind: a.kind, value: a.value, reason: a.reason, comment: a.comment }]));

export async function loadRespondent(token: string, cookies: RespondentCookies, now = new Date()): Promise<RespondentView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  // A revoked link (a deleted workspace's too, E11-2) is inactive before it is the sample's page.
  if (link.project.isSample && linkState(link.invite, now) !== "revoked") return { kind: "sample", link };
  const view = viewOf(link, cookies.passcode, now);
  // A revoked link on an archived project reads "closed" too; it shows nothing of its own.
  if (view.kind === "closed" && link.invite.kind === "personal" && linkState(link.invite, now) !== "revoked") {
    // A closed personal link shows the respondent's own state (E7-1, acceptance 3; note
    // 12, finding 33) when they started, answered something and did not submit
    // (docs/copy/errors.md); a submitted response's closed page is E7-6's; a closed public
    // link shows none (decision 0031).
    const response = await responseOf(link, undefined);
    // Submitted: when, and that nothing can change now (E7-6, acceptance 2).
    // Changes made after it and not submitted again are said too.
    if (response?.submittedAt) return { kind: "closedSubmitted", link, closedAt: view.closedAt, submittedAt: response.submittedAt, changed: changedSinceSubmit(response) };
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
  // The Wrap up as last saved and its version (E7-5: saved as the respondent writes, and by
  // Submit).
  const missing = response ? (await missingItems.forResponse(link.ws, response.id))[0] : undefined;
  const wrap: WrapValue = response ? wrapOf({ confidence: response.confidence, closingAnswer: response.closingAnswer, missing: missing ? { text: missing.text, area: missing.suggestedArea, value: missing.suggestedValue } : null }) : EMPTY_WRAP;
  const wrapSync: WrapSync = response ? { version: response.wrapVersion, writer: response.wrapWriter, writerSeq: response.wrapWriterSeq } : { version: 0, writer: null, writerSeq: 0 };
  return { kind: "ready", link, response, items: list, areas, answers: answerMap(rows), versions: Object.fromEntries(rows.map((a) => [a.itemId, a.version])), wrap, wrapSync };
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
// Start again on a started response (E7-1 About you; E7-6): only a change of the fields or the
// picks writes, moves the last save and, on a submitted response, takes the sign-off back
// (the sign-off was for the answers as submitted, E7-6 acceptance 6).
const startChanges = (r: Response, values: Record<string, string>, picks: string[]) => JSON.stringify(Object.entries(r.fields).sort()) !== JSON.stringify(Object.entries(values).sort()) || JSON.stringify([...r.perspectives].sort()) !== JSON.stringify([...picks].sort());
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
  // created_at and updated_at from the same clock as every later write of this response
  // (saveAnswer, restart and submit keep the greatest of the stored time and their own now),
  // not the database's: with a fixed now, as in the tests, the row would otherwise start in
  // the future of every write made to it.
  const data = { instrumentId: link.instrument.id, itemSetId: link.instrument.itemSetId, inviteId: link.invite.id, fields: fields.values, perspectives: picks.picks, createdAt: now, updatedAt: now };
  // The link re-read under the invite row's lock: a Revoke or a date change committed since
  // openLinkFor wins (src/db/queries/responses.ts).
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  if (link.invite.kind === "personal") {
    const started = await responses.startPersonal(link.ws, { ...data, deviceToken: newDeviceToken() }, stillOpen);
    if (!started) return { status: 404, error: "unknown" };
    if ("refused" in started) return refusalOf(started.refused, token, now);
    if (started.created) {
      await track("response_started", { instrument: link.instrument.id }, { workspaceId: link.ws, userId: null });
      return { response: started.response, device: null };
    }
    if (!startChanges(started.response, fields.values, picks.picks)) return { response: started.response, device: null };
    const updated = await responses.restart(link.ws, started.response.id, { fields: fields.values, perspectives: picks.picks }, now);
    return { response: updated ?? started.response, device: null };
  }
  const existing = cookies.device ? await responses.forDevice(link.ws, link.invite.id, cookies.device) : null;
  if (existing) {
    if (!startChanges(existing, fields.values, picks.picks)) return { response: existing, device: null };
    const updated = await responses.restart(link.ws, existing.id, { fields: fields.values, perspectives: picks.picks }, now);
    return { response: updated ?? existing, device: null };
  }
  const device = newDeviceToken();
  const created = await responses.createPublic(link.ws, { ...data, deviceToken: device }, stillOpen);
  if (!created) return { status: 404, error: "unknown" };
  if ("refused" in created) return refusalOf(created.refused, token, now);
  await track("response_started", { instrument: link.instrument.id }, { workspaceId: link.ws, userId: null });
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
// changedSince (E7-6, on a save the server took): the response is submitted and has changes
// not submitted again, after its latest Submit (submittedAt, ISO 8601).
export type SavedAnswer = { answer: AnswerState; complete: boolean; changedSince?: boolean; submittedAt?: string | null } & Written;
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
    return { stale: { answer: stored, complete: isComplete(stored), version: written.stale.version, writer: written.stale.writer, writerSeq: written.stale.writerSeq, changedSince: written.changedSince, submittedAt: written.submittedAt?.toISOString() ?? null } };
  }
  return { answer: mapped.answer, complete: isComplete(mapped.answer), version: written.version, writer: written.writer, writerSeq: written.writerSeq, changedSince: written.changedSince, submittedAt: written.submittedAt?.toISOString() ?? null };
}

// The Wrap up's answers as the respondent writes them (E7-5; PUT /r/[token]/wrap): the link
// open for this device, the response started and the one the page answers for (checked
// before anything else is read from the body), the answers read as Submit reads them
// (parseWrapInput), then stored under the invite row's lock and the response's when the write
// was made on the stored Wrap up (responses.saveWrap); a stale write gets the stored one back.
export type WrapReply = { wrap: WrapValue; changedSince: boolean; submittedAt: string | null } & WrapSync;
// changedSince (E7-6): the response is submitted and has changes not submitted again, after
// its latest Submit (submittedAt, ISO 8601).
export type WrapSaved = { saved: true; version: number; writer: string | null; writerSeq: number; changedSince: boolean; submittedAt: string | null };
export async function saveWrap(token: string, cookies: RespondentCookies, body: unknown, now = new Date()): Promise<WriteRefusal | WrapSaved | { stale: WrapReply }> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const response = await responseOf(link, cookies.device);
  if (!response || namedResponse(body) !== response.id) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const { items: all, areas } = await itemsOf(link);
  const chapters = chaptersFor(areas, all, response.perspectives);
  const closing = link.instrument.closing;
  const parsed = parseWrapInput(body, { method: link.instrument.method, areas: areasOf(chapters), hasQuestion: Boolean(closing.closingQuestion), missingForm: closing.missingForm });
  if ("error" in parsed) return { status: 422, error: parsed.error };
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  const { response: _named, ...write } = parsed.input;
  void _named;
  const saved = await responses.saveWrap(link.ws, link.invite.id, response.id, write, stillOpen, now);
  if (!saved) return { status: 404, error: "unknown" };
  if ("refused" in saved) return refusalOf(saved.refused, token, now);
  if ("stale" in saved) return { stale: wrapReplyOf(saved.stale) };
  return { saved: true, version: saved.saved.wrapVersion, writer: saved.saved.wrapWriter, writerSeq: saved.saved.wrapWriterSeq, changedSince: changedSinceSubmit(saved.saved), submittedAt: saved.saved.submittedAt?.toISOString() ?? null };
}

// The response a write names (E7-3 onwards): an open window whose cookie was replaced since
// never writes to the response another window started.
const namedResponse = (body: unknown): unknown => (body && typeof body === "object" && !Array.isArray(body) ? (body as { response?: unknown }).response : undefined);

// The stored Wrap up as the page holds it (the sign-off is never stored for the page: it is
// ticked for each Submit).
export const wrapOf = (stored: { confidence: number | null; closingAnswer: string | null; missing: { text: string; area: string | null; value: string | null } | null }): WrapValue => ({ confidence: stored.confidence, signed: false, closingAnswer: stored.closingAnswer ?? "", missing: { text: stored.missing?.text ?? "", area: stored.missing?.area ?? "", value: stored.missing?.value ?? "" } });
const wrapReplyOf = (stored: StoredWrap): WrapReply => ({ wrap: wrapOf(stored), version: stored.version, writer: stored.writer, writerSeq: stored.writerSeq, changedSince: stored.changedSince, submittedAt: stored.submittedAt?.toISOString() ?? null });

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
// its one missing item written in place. A second Submit updates the same response. A personal
// invite's address gets the receipt (email 4) on the first Submit: an address the PM chose,
// never one typed on a public link, which would let anyone send mail through SMEsay. The
// receipt goes after the reply (`receipt`, run by the route with after():
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md); one that fails
// to send does not undo the Submit.
export type Submitted = { submittedAt: Date; name: string | null; version: number; receipt: (() => Promise<void>) | null };
export async function submitResponse(token: string, cookies: RespondentCookies, body: unknown, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<WriteRefusal | Submitted | { stale: WrapReply }> {
  const open = await openLinkFor(token, cookies, now);
  if ("status" in open) return open;
  const { link } = open;
  const response = await responseOf(link, cookies.device);
  // The response the page answers for, before anything else: an open window whose cookie was
  // replaced since never submits the response another window started (as saveAnswer).
  if (!response || namedResponse(body) !== response.id) return { status: 409, error: RESPONDENT_ERRORS.notStarted };
  const { items: all, areas } = await itemsOf(link);
  const chapters = chaptersFor(areas, all, response.perspectives);
  const spec = link.instrument.respondentFields;
  if (missingMandatory(spec, { ...response.fields, ...carriedFields(link.invite, spec) }).length > 0) return { status: 422, error: RESPONDENT_ERRORS.fieldsOpen };
  const closing = link.instrument.closing;
  const parsed = parseSubmitInput(body, { method: link.instrument.method, areas: areasOf(chapters), hasQuestion: Boolean(closing.closingQuestion), missingForm: closing.missingForm, signOff: signOffFor(closing) });
  if ("error" in parsed) return { status: 422, error: parsed.error };
  if (!response.submittedAt && !(await withinPlan(link.ws, "responses", now))) return { status: 403, error: RESPONDENT_ERRORS.planFull };
  const stillOpen = (dates: InviteDates) => dates.token === token && linkState(dates, now) === "open";
  // The items the response's perspectives show as locked (a Start in another window can
  // change them until then).
  let rows: Record<string, AnswerState> = {};
  let visible: RespondentItem[] = [];
  const check = (stored: Answer[], perspectives: string[]) => {
    rows = answerMap(stored);
    visible = chaptersFor(areas, all, perspectives).flatMap((c) => c.items);
    const openItems = visible.filter((it) => !isComplete(rows[it.id])).length;
    return openItems > 0 ? RESPONDENT_ERRORS.itemsOpen(openItems) : null;
  };
  const { response: _named, ...write } = parsed.input;
  void _named;
  const { missing, confidence } = write;
  const saved = await responses.submit(link.ws, link.invite.id, response.id, { ...write, signOffText: signOffFor(closing) }, stillOpen, check, now);
  if (!saved) return { status: 404, error: "unknown" };
  if ("refused" in saved) return refusalOf(saved.refused, token, now);
  if ("stale" in saved) return { stale: wrapReplyOf(saved.stale) };
  if ("invalid" in saved) return { status: 422, error: saved.invalid };
  // The first Submit, decided from the row written under the lock: its stored time is the
  // first Submit's, and every later one is stored at least a millisecond after it, so two
  // Submits at once on one personal link send one receipt, even with the same clock.
  const first = saved.submittedAt !== null && saved.submittedAt.getTime() === saved.firstSubmittedAt?.getTime();
  if (first) await track("response_submitted", { instrument: link.instrument.id, items: visible.length, minutes: Math.max(0, Math.round(((saved.submittedAt ?? now).getTime() - response.createdAt.getTime()) / 60_000)) }, { workspaceId: link.ws, userId: null });
  const to = link.invite.kind === "personal" && first ? link.invite.email : null;
  const receipt = to
    ? async () => {
        const tally = tallyOf(link.instrument.method, visible, rows);
        const mail = receiptEmail({ respondentName: link.invite.name ?? null, projectName: link.project.name, workspaceName: link.brand.name, submittedAt: saved.submittedAt ?? now, closesAt: link.invite.closesAt, url: `${baseUrl}/r/${token}`, counts: { items: visible.length, changed: tally.higher.length + tally.lower.length, rated: tally.rated.length, notNeeded: tally.notNeeded.length, unclear: tally.unclear.length, missing: missing ? 1 : 0, confidence }, rateBlind: !link.instrument.showProposed });
        try { await send({ to, ...mail }); } catch { /* The answers are in; the receipt is a courtesy. */ }
      }
    : null;
  return { submittedAt: saved.submittedAt ?? now, name: firstNameOf(link, saved), version: saved.wrapVersion, receipt };
}
