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
import { answers, items, itemSets, links, responses } from "@/db/queries";
import type { Answer } from "@/db/queries/answers";
import type { Link } from "@/db/queries/links";
import type { InviteDates, Response } from "@/db/queries/responses";
import { textFor } from "@/lib/item-text";
import { viewOf, type LinkView } from "@/lib/link-access";
import { answeredCount, carriedFields, parseFieldValues, parsePicks, type AnswerState, type AreaMeta, type RespondentItem } from "@/lib/respondent-rules";
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
  | { kind: "ready"; link: Link; response: Response | null; items: RespondentItem[]; areas: AreaMeta[]; answers: Record<string, AnswerState> };

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
      const visible = all.filter((it) => it.perspectives.length === 0 || it.perspectives.some((p) => response.perspectives.includes(p)));
      const answered = answeredCount(visible, rows);
      if (answered > 0) return { kind: "closedOwn", link, closedAt: view.closedAt, response, answered, total: visible.length };
    }
  }
  if (view.kind !== "open") return view;
  const response = await responseOf(link, cookies.device);
  const { items: list, areas } = await itemsOf(link);
  return { kind: "ready", link, response, items: list, areas, answers: response ? answerMap(await answers.forResponse(link.ws, response.id)) : {} };
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
