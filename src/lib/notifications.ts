// The emails the product sends on its own (stories/E16-1, E16-2; decision 0067; design note
// 132): the closing summary (7) and the daily digest (9) from the hourly job, the
// everyone-has-submitted email (8) from the Submit that completes the personal invites, and
// the getting-started series (11) from the job, behind LIFECYCLE_EMAILS. Every send goes to a
// person with the kind on (src/db/queries/emails.ts), carries the stop link and the
// List-Unsubscribe headers (RFC 8058, rfc-editor.org/rfc/rfc8058: the List-Unsubscribe-Post
// header "List-Unsubscribe=One-Click" and a POST to the List-Unsubscribe address), and is
// marked before it goes, so a crash after the mark loses one email rather than sending two.
// The job reads across workspaces through queries/internal (as jobs:purge does) and the rest
// through the scoped helpers with the workspace id the row carries.
import { emails, instruments, invites, items, projects } from "@/db/queries";
import { agreement } from "@/db/queries/results";
import { internal, type Closing } from "@/db/queries/internal";
import type { EmailState, WorkspaceId } from "@/db/types";
import { log } from "@/lib/log";
import { sendMail, type Mail } from "@/lib/mail";
import { stopLink } from "@/lib/mail/stop-link";
import { closingEmail } from "@/lib/mail/templates/closing";
import { completeEmail } from "@/lib/mail/templates/complete";
import { digestEmail, type DigestRow } from "@/lib/mail/templates/digest";
import { SERIES_DAYS, SERIES_STEPS, seriesEmail, type SeriesStep } from "@/lib/mail/templates/series";
import type { ResultsFilter } from "@/lib/results-filter";

export type Send = (mail: Mail) => Promise<void>;
export type Report = { closings: number; digests: number; series: number; seriesDue: number; skipped: number; failed: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// A close older than this when the job first sees it sends nothing (acceptance 1).
export const CLOSING_LOOKBACK_MS = 48 * HOUR;
// The digest's hour (UTC) and the least time between two digests to one person.
export const DIGEST_HOUR_UTC = 6;
const DIGEST_GAP_MS = 20 * HOUR;
// The series writes to sign-ups up to this old; an older account is left alone (design note 132).
export const SERIES_MAX_AGE_DAYS = 21;
export const SERIES_FLAG = "LIFECYCLE_EMAILS";

const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };

export const greeting = (name: string): string | null => name.trim() || null;

// When a validation's link closes (acceptance 1): the public link's close date while it is not
// revoked; with no public link, the last personal invite's; null while anything live has no
// close date or nothing is live.
export function closeInstant(rows: Closing["invites"]): Date | null {
  const live = rows.filter((i) => i.revokedAt === null);
  const pick = (kind: "public" | "personal") => {
    const mine = live.filter((i) => i.kind === kind);
    if (mine.length === 0 || mine.some((i) => i.closesAt === null)) return null;
    return mine.map((i) => i.closesAt!).sort((a, b) => b.getTime() - a.getTime())[0];
  };
  return live.some((i) => i.kind === "public") ? pick("public") : pick("personal");
}

async function topItems(ws: WorkspaceId, instrumentId: string, itemSetId: string): Promise<{ text: string; percent: number }[]> {
  const counts = await agreement.byItem(ws, instrumentId, NONE);
  const texts = new Map((await items.forSet(ws, itemSetId)).map((it) => [it.id, it.readerText ?? it.originalText]));
  return counts
    .filter((c) => c.percent !== null && c.percent < 100)
    .sort((a, b) => a.percent! - b.percent!)
    .slice(0, 3)
    .map((c) => ({ text: texts.get(c.itemId) ?? "", percent: c.percent! }));
}

export async function sendClosingSummaries(origin: string, now = new Date(), send: Send = sendMail): Promise<{ sent: number; skipped: number; failed: number }> {
  const out = { sent: 0, skipped: 0, failed: 0 };
  for (const c of await internal.unsentClosings()) {
    const at = closeInstant(c.invites);
    if (at === null || at.getTime() > now.getTime()) continue;
    if (!(await internal.markClosedEmail(c.instrumentId, now))) continue;
    if (at.getTime() < now.getTime() - CLOSING_LOOKBACK_MS) { out.skipped += 1; continue; }
    try {
      const ws = c.workspaceId;
      const personalRows = c.invites.filter((i) => i.kind === "personal" && i.revokedAt === null);
      const personal = personalRows.length ? { invited: personalRows.length, submitted: personalRows.filter((i) => i.submitted > 0).length } : null;
      const publicRows = c.invites.filter((i) => i.kind === "public");
      const publicCount = publicRows.length ? publicRows.reduce((n, i) => n + i.submitted, 0) : null;
      const top = await topItems(ws, c.instrumentId, c.itemSetId);
      const url = new URL(`/app/projects/${c.projectId}/results`, origin).toString();
      for (const r of await emails.recipients(ws, "validations")) {
        const stop = stopLink(origin, r.token, "validations");
        const mail = closingEmail({ memberName: greeting(r.name), projectName: c.projectName, workspaceName: c.workspaceName, closedAt: at, personal, publicCount, topItems: top, url, stop: { reason: `you are a member of ${c.workspaceName}.`, url: stop.url } });
        await send({ to: r.email, ...mail, headers: stop.headers });
        out.sent += 1;
      }
    } catch (error) {
      out.failed += 1;
      log("error", "The closing summary could not be sent.", { workspace: c.workspaceId, project: c.projectId, error: error instanceof Error ? error.name : "error" });
    }
  }
  return out;
}

// The Submit that completes the personal invites (acceptance 2): called after the reply, with
// the workspace the link carries. True when the email went.
export async function notifyComplete(ws: WorkspaceId, instrumentId: string, origin: string, now = new Date(), send: Send = sendMail): Promise<boolean> {
  const rows = (await invites.personalWithStatus(ws, instrumentId)).filter((r) => r.revokedAt === null);
  if (rows.length === 0 || rows.some((r) => r.responseStatus !== "submitted")) return false;
  if (!(await instruments.claimCompleteEmail(ws, instrumentId, now))) return false;
  const instrument = await instruments.get(ws, instrumentId);
  const project = instrument ? await projects.get(ws, instrument.projectId) : null;
  if (!instrument || !project) return false;
  const pub = await invites.publicForInstrument(ws, instrumentId);
  const publicOpen = pub !== null && pub.revokedAt === null && (pub.closesAt === null || pub.closesAt.getTime() > now.getTime());
  const closesAt = rows.map((r) => r.closesAt).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const url = new URL(`/app/projects/${project.id}/results`, origin).toString();
  let sent = false;
  for (const r of await emails.recipients(ws, "validations")) {
    const stop = stopLink(origin, r.token, "validations");
    const mail = completeEmail({ memberName: greeting(r.name), projectName: project.name, invited: rows.length, closesAt, publicOpen, url, stop: { reason: `you are a member of ${project.name}'s workspace.`, url: stop.url } });
    try { await send({ to: r.email, ...mail, headers: stop.headers }); sent = true; } catch (error) {
      log("error", "The everyone-has-submitted email could not be sent.", { workspace: ws, project: project.id, error: error instanceof Error ? error.name : "error" });
    }
  }
  return sent;
}

// The digest (acceptance 3): at DIGEST_HOUR_UTC, to each person with it on, the open
// validations of their workspaces with a submission in the last day.
export async function sendDigests(origin: string, now = new Date(), send: Send = sendMail): Promise<{ sent: number; failed: number }> {
  const out = { sent: 0, failed: 0 };
  if (now.getUTCHours() !== DIGEST_HOUR_UTC) return out;
  const candidates = (await internal.digestCandidates(new Date(now.getTime() - DAY), now)).filter((c) => c.closesAt === null || c.closesAt.getTime() > now.getTime());
  if (candidates.length === 0) return out;
  const memberships = await internal.memberIds([...new Set(candidates.map((c) => c.workspaceId))]);
  const people = await emails.people([...new Set(memberships.map((m) => m.userId))], "digest");
  for (const p of people) {
    if (p.state.digestAt && now.getTime() - new Date(p.state.digestAt).getTime() < DIGEST_GAP_MS) continue;
    const mine = new Set(memberships.filter((m) => m.userId === p.userId).map((m) => m.workspaceId));
    const rows: DigestRow[] = candidates.filter((c) => mine.has(c.workspaceId)).map((c) => ({ projectName: c.projectName, workspaceName: c.workspaceName, fresh: c.fresh, submitted: c.submitted, invited: c.invited, closesAt: c.closesAt, url: new URL(`/app/projects/${c.projectId}/results`, origin).toString() }));
    if (rows.length === 0) continue;
    await emails.markDigest(p.userId, now);
    try {
      const stop = stopLink(origin, p.token, "digest");
      await send({ to: p.email, ...digestEmail({ memberName: greeting(p.name), rows, stop: { reason: "you turned on the daily digest in Settings.", url: stop.url } }), headers: stop.headers });
      out.sent += 1;
    } catch (error) {
      out.failed += 1;
      log("error", "The digest could not be sent.", { error: error instanceof Error ? error.name : "error" });
    }
  }
  return out;
}

export type SeriesStage = { createdAt: Date; hasList: boolean; published: boolean; steps: EmailState["steps"] };
export type SeriesDue = { send: SeriesStep | null; handled: Record<string, string> };

// Which step of the series goes to a person now (E16-2, acceptance 1): the latest step whose
// day has come and whose condition holds, once; the earlier due steps are marked skipped.
// Nothing once a validation is published: every step left is marked skipped.
export function seriesDue(person: SeriesStage, now: Date): SeriesDue {
  const age = (now.getTime() - person.createdAt.getTime()) / DAY;
  const left = SERIES_STEPS.filter((s) => !(s in person.steps));
  if (person.published) return { send: null, handled: Object.fromEntries(left.map((s) => [s, "skipped"])) };
  const due = left.filter((s) => age >= SERIES_DAYS[s]);
  const holds: Record<SeriesStep, boolean> = { start: true, import: !person.hasList, share: true, last: true };
  const send = [...due].reverse().find((s) => holds[s]) ?? null;
  const handled: Record<string, string> = {};
  for (const s of due) handled[s] = s === send ? now.toISOString() : "skipped";
  return { send, handled };
}

export async function sendSeries(origin: string, now = new Date(), send: Send = sendMail, env: Record<string, string | undefined> = process.env): Promise<{ sent: number; due: number; failed: number }> {
  const out = { sent: 0, due: 0, failed: 0 };
  const enabled = env[SERIES_FLAG] === "on";
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hello@smesay.com";
  const stages = await internal.seriesPeople(new Date(now.getTime() - SERIES_MAX_AGE_DAYS * DAY), new Date(now.getTime() - SERIES_DAYS.start * DAY));
  const people = await emails.people(stages.map((s) => s.userId), "guide");
  for (const p of people) {
    const stage = stages.find((s) => s.userId === p.userId)!;
    const due = seriesDue({ createdAt: p.createdAt, hasList: stage.hasList, published: stage.published, steps: p.state.steps }, now);
    if (due.send) out.due += 1;
    if (!enabled) continue;
    if (Object.keys(due.handled).length > 0) await emails.markSteps(p.userId, due.handled);
    if (!due.send) continue;
    try {
      const stop = stopLink(origin, p.token, "guide");
      const mail = seriesEmail({ step: due.send, name: greeting(p.name), workspaceName: stage.workspace?.name ?? null, project: stage.project, origin, supportEmail, stop: { reason: `you signed up for SMEsay on ${p.createdAt.toISOString().slice(0, 10)}.`, url: stop.url } });
      await send({ to: p.email, ...mail, headers: stop.headers, replyTo: due.send === "last" ? supportEmail : undefined });
      out.sent += 1;
    } catch (error) {
      out.failed += 1;
      log("error", "A getting-started email could not be sent.", { step: due.send, error: error instanceof Error ? error.name : "error" });
    }
  }
  return out;
}

// npm run jobs:emails: everything due now.
export async function sendDueEmails(origin: string, now = new Date(), send: Send = sendMail, env: Record<string, string | undefined> = process.env): Promise<Report> {
  const closings = await sendClosingSummaries(origin, now, send);
  const digests = await sendDigests(origin, now, send);
  const series = await sendSeries(origin, now, send, env);
  return { closings: closings.sent, digests: digests.sent, series: series.sent, seriesDue: series.due, skipped: closings.skipped, failed: closings.failed + digests.failed + series.failed };
}
