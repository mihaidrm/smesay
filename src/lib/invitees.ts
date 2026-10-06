// Personal invites (stories/E6-2): one invite row of kind personal per address on the
// published instrument, each with its own token (newToken, 32 hex characters as the public
// link's) and email 2 (src/lib/mail/templates/invite.ts) sent from the platform as "[PM NAME]
// via SMEsay" with the PM's address as reply-to. The personal links take the public link's
// open and close instants and follow them (invites.updatePublic, invites.publish) and have
// no passcode (the address is the proof; docs/review-list.md), so the public link is
// published and not closed or revoked. The rows are created first, in one insert under the
// instrument row's lock then the project row's, the link checked and its dates read there
// (invites.createPersonal; the partial unique index invite_personal_email_idx drops a
// second send of the same address racing this one, reported as already invited), then the
// emails go out one by one (a date change or a newer version's publish in that gap still
// sends this email with the dates the rows hold, docs/review-list.md): a send that fails leaves its row
// with send_error and the status Not sent (acceptance 5), the others still go, and pasting
// that address again sends it again on the same row and token (invites.claimResend: a row
// with no outcome yet is another request's for RESEND_AFTER_MINUTES). Up to INVITEES_PER_DAY rows
// per workspace in 24 hours. Words: INVITEES_COPY and INVITEES_ERRORS
// (src/lib/invitees-rules.ts; docs/copy/app.md, Share; docs/copy/errors.md).
import { createHash } from "node:crypto";
import { invites, items, projects, workspaces } from "@/db/queries";
import type { Invite, InviteeRow } from "@/db/queries/invites";
import type { Anonymity, WorkspaceId } from "@/db/types";
import { INVITEES_COPY, INVITEES_ERRORS, INVITEES_PER_DAY, inviteeLine, minutesFor, parseInvitees, type Invitee } from "@/lib/invitees-rules";
import { inviteEmail } from "@/lib/mail/templates/invite";
import { sendMail, type Mail } from "@/lib/mail";
import { NotFoundError } from "@/lib/errors";
import { linkState, newToken, own } from "@/lib/sharing";

export { INVITEES_COPY, INVITEES_ERRORS };

export type Sender = { name: string | null; email: string };
// line: what the box takes to send this person again.
export type SendOutcome = { email: string; line: string; sent: boolean; error: string | null };

// The provider's reason for the row and the message (acceptance 5): the first line, cut
// to REASON_MAX characters, then each word that could carry a host or a credential
// replaced by "[server]": a word holding an @ or a :// (an address, a login, a URL), an
// IPv4 address, two colons with hex between (an IPv6 address), a dotted host name
// (labels of letters, digits, - and _, the last one letters) or a word followed by a
// colon and a port number, anywhere in the word, whatever is glued around them. A status
// code such as 5.1.1 and a time such as 10:30 stay (a time with seconds, or followed by
// a colon, reads as IPv6 and goes). The marks for IPv6 and word:port backtrack on long
// runs of hex letters or dashes, so cutServers cuts its line to REASON_MAX before testing
// (two worst-case words of 200 characters take under a tenth of a millisecond). A
// missing mail variable is the app's own, not the address's: it is thrown, named, as
// sendMail names it. The result can be longer than REASON_MAX by the replacements, and a
// reason that was only servers reads as withheld (docs/review-list.md).
const REASON_MAX = 200;
const SERVER_MARKS = [/@|:\/\//, /\d{1,3}(?:\.\d{1,3}){3}/, /[0-9a-f]*:[0-9a-f]*:[0-9a-f]*/i, /(?:^|[^\w.-])[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}(?![\w])/i, /(?:^|[^\w])[a-z][\w-]*:\d{2,5}(?!\d)/i];
export function cutServers(line: string): string {
  return line.slice(0, REASON_MAX).split(/(\s+)/).map((word) => (word.length > 0 && SERVER_MARKS.some((mark) => mark.test(word)) ? "[server]" : word)).join("");
}
const WITHHELD = "the mail server refused it, and its reason named only servers";
export function reasonOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/^[A-Z_]+ is not set\./.test(text)) throw error;
  const cut = cutServers(text.split("\n")[0] ?? "").trim().replace(/\.$/, "");
  if (!cut) return "the mail server refused it";
  return /[a-z0-9]/i.test(cut.replace(/\[server\]/g, "")) ? cut : WITHHELD;
}

// The words for a refusal under the lock (invites.createPersonal).
export const refusalCopy = (refused: "none" | "replaced" | "revoked" | "closed"): string =>
  refused === "none" ? INVITEES_COPY.needLink : refused === "replaced" ? INVITEES_COPY.linkReplaced : refused === "revoked" ? INVITEES_COPY.linkRevoked : INVITEES_COPY.linkClosed;

export function inviteStatus(row: Pick<InviteeRow, "responseStatus" | "sentAt" | "revokedAt">): keyof typeof INVITEES_COPY.status {
  if (row.revokedAt) return "revoked";
  if (row.responseStatus === "submitted") return "submitted";
  if (row.responseStatus === "inProgress") return "inProgress";
  return row.sentAt === null ? "notSent" : "invited";
}

// The personal invites of the Share page's instrument (acceptance 4).
export async function listInvitees(ws: WorkspaceId, instrumentId: string): Promise<InviteeRow[]> {
  return invites.personalWithStatus(ws, instrumentId);
}

// The link in force must be published and open or opening later for a send; the words
// for the other states.
async function liveLinkFor(ws: WorkspaceId, instrumentId: string, now: Date): Promise<{ error: string } | { link: Invite }> {
  const link = await invites.publicForInstrument(ws, instrumentId);
  if (!link) return { error: INVITEES_COPY.needLink };
  const state = linkState(link, now);
  if (state === "closed") return { error: INVITEES_COPY.linkClosed };
  if (state === "revoked") return { error: INVITEES_COPY.linkRevoked };
  return { link };
}

// Email 2 for a personal invite row, with the sender's name on it.
async function inviteMailFor(ws: WorkspaceId, projectId: string, instrument: { itemSetId: string; intro: string | null; anonymity: Anonymity }, invite: Invite, sender: Sender, baseUrl: string, now: Date): Promise<{ mail: Mail; pmName: string }> {
  const project = await projects.get(ws, projectId);
  const workspace = await workspaces.getById(ws);
  if (!project || !workspace) throw new NotFoundError();
  const itemCount = (await items.forSet(ws, instrument.itemSetId)).length;
  const pmName = sender.name?.trim() || sender.email;
  const mail = inviteEmail({ pmName, workspaceName: workspace.name, projectName: project.name, respondentName: invite.name, itemCount, minutes: minutesFor(itemCount), intro: instrument.intro, url: `${baseUrl}/r/${invite.token}`, namesHidden: instrument.anonymity === "hidden", opensAt: invite.opensAt && invite.opensAt > now ? invite.opensAt : null, closesAt: invite.closesAt });
  return { mail: { ...mail, to: invite.email ?? "", fromName: `${pmName} via SMEsay`, replyTo: sender.email }, pmName };
}

// What the Share page carries for a personal row's link, so a stale tab's Revoke can be
// told apart from the fresh link: a short hash of the token, never the token itself (the
// token is the respondent's proof and stays on the server; SECURITY.md). SHA-256 from
// node's crypto (nodejs.org/api/crypto.html, crypto.createHash); 16 hex characters are
// enough to tell two links of one row apart.
export const linkMark = (token: string): string => createHash("sha256").update(token).digest("hex").slice(0, 16);

// Revoke one personal link (stories/E6-4, acceptance 2): the row gets revoked_at and its
// token shows the inactive page; answers already given are kept. `mark` is linkMark of
// the link the page showed: a stale tab whose row got a new link since is refused.
export async function revokeInvitee(ws: WorkspaceId, projectId: string, instrumentId: string, inviteId: string, mark: string, now = new Date()): Promise<{ error: string } | { invite: Invite }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const row = (await invites.personalWithStatus(ws, instrumentId)).find((r) => r.id === inviteId);
  if (!row) throw new NotFoundError();
  if (row.revokedAt) return { error: INVITEES_ERRORS.alreadyRevoked(row.email ?? "") };
  if (linkMark(row.token) !== mark) return { error: INVITEES_ERRORS.rowChanged(row.email ?? "") };
  const revoked = await invites.revokePersonal(ws, inviteId, row.token, now);
  if (!revoked) return { error: INVITEES_ERRORS.rowChanged(row.email ?? "") };
  return { invite: revoked };
}

// A new link for a revoked personal invite (E6-4, acceptance 2): a fresh token on the same
// row, with the public link's dates read under the locks (invites.renewPersonal; the link
// in force must allow a send, as for sendInvites), then email 2 to the address. A failed
// email leaves the row Not sent, to be pasted again.
export async function renewInvitee(ws: WorkspaceId, projectId: string, instrumentId: string, inviteId: string, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcome: SendOutcome }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  if (owned.instrument.anonymity === "anonymous") return { error: INVITEES_ERRORS.anonymous };
  const live = await liveLinkFor(ws, instrumentId, now);
  if ("error" in live) return live;
  const row = (await invites.personalWithStatus(ws, instrumentId)).find((r) => r.id === inviteId);
  if (!row) throw new NotFoundError();
  const email = row.email ?? "";
  if (!row.revokedAt) return { error: INVITEES_ERRORS.notRevoked(email) };
  const result = await invites.renewPersonal(ws, instrumentId, inviteId, newToken(), now);
  if (!result) throw new NotFoundError();
  if ("refused" in result) return { error: result.refused === "notRevoked" ? INVITEES_ERRORS.notRevoked(email) : result.refused === "replaced" ? INVITEES_COPY.newLinkReplaced : refusalCopy(result.refused) };
  const renewed = result.invite;
  const { mail } = await inviteMailFor(ws, projectId, owned.instrument, renewed, sender, baseUrl, now);
  const line = inviteeLine({ email, name: renewed.name, role: renewed.roleHint });
  try {
    await send(mail);
  } catch (error) {
    const reason = reasonOf(error);
    await invites.update(ws, inviteId, { sendError: reason });
    return { outcome: { email, line, sent: false, error: INVITEES_ERRORS.newLinkNotSent(email, reason) } };
  }
  await invites.update(ws, inviteId, { sentAt: now, sendError: null });
  return { outcome: { email, line, sent: true, error: null } };
}

// Send (acceptance 1, 2 and 5). The project live, the instrument the one Share shows (own),
// its public link published and open or opening later; the list parsed whole before
// anything is created, so one bad address stops the send with nothing sent; an address
// already sent, or revoked (E6-4: New link on its row instead), is refused the same way
// (acceptance 1), while one whose row was never sent (Not sent) goes again on its row;
// then the rows, then the emails. `send` is the
// transport, replaced in the tests to make one address fail.
export async function sendInvites(ws: WorkspaceId, projectId: string, instrumentId: string, rawList: unknown, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcomes: SendOutcome[] }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const { instrument } = owned;
  // E5-7, acceptance 7: the level is locked once the link is published, which a send needs,
  // so the check outside the lock holds.
  if (instrument.anonymity === "anonymous") return { error: INVITEES_ERRORS.anonymous };
  const live = await liveLinkFor(ws, instrumentId, now);
  if ("error" in live) return live;
  const parsed = parseInvitees(rawList);
  if ("error" in parsed) return { error: parsed.error };
  const existing = new Map<string, Invite>();
  for (const person of parsed.invitees) {
    const row = await invites.personalByEmail(ws, instrumentId, person.email);
    if (row?.revokedAt) return { error: INVITEES_ERRORS.revokedAddress(person.email) };
    if (row?.sentAt) return { error: INVITEES_ERRORS.already(person.email) };
    if (row) existing.set(person.email, row);
  }
  const fresh = parsed.invitees.filter((p) => !existing.has(p.email));
  if (fresh.length > 0) {
    const left = Math.max(0, INVITEES_PER_DAY - (await invites.countPersonalSince(ws, 24 * 60, now)));
    if (fresh.length > left) return { error: INVITEES_ERRORS.tooManyToday(left) };
  }
  // The new rows first, under the locks with the link checked and its dates read there (a
  // refusal there leaves nothing claimed); an address another send got in first is absent
  // from the rows and says so.
  const inserted = await invites.createPersonal(ws, instrumentId, fresh.map((p) => ({ ...p, token: newToken() })), now);
  if (!inserted) throw new NotFoundError();
  if ("refused" in inserted) return { error: refusalCopy(inserted.refused) };
  const results = new Map<string, SendOutcome>();
  const created: { person: Invitee; invite: Invite }[] = [];
  const byEmail = new Map(inserted.created.map((i) => [i.email, i]));
  for (const person of fresh) {
    const invite = byEmail.get(person.email);
    if (invite) created.push({ person, invite });
    else results.set(person.email, { email: person.email, line: inviteeLine(person), sent: false, error: INVITEES_ERRORS.already(person.email) });
  }
  // Then the rows sent again: the name and role typed this time replace the old ones. A
  // row another request is sending right now cannot be claimed and says so.
  for (const person of parsed.invitees) {
    const row = existing.get(person.email);
    if (!row) continue;
    const claimed = await invites.claimResend(ws, row.id, { name: person.name ?? row.name, roleHint: person.role ?? row.roleHint }, now);
    if (claimed) { created.push({ person, invite: claimed }); continue; }
    // Not claimed: in flight on another request, or revoked since the row was read.
    const fresh = await invites.get(ws, row.id);
    results.set(person.email, { email: person.email, line: inviteeLine(person), sent: false, error: fresh?.revokedAt ? INVITEES_ERRORS.revokedAddress(person.email) : INVITEES_ERRORS.inFlight(person.email) });
  }
  for (const { person, invite } of created) {
    const { mail } = await inviteMailFor(ws, projectId, instrument, invite, sender, baseUrl, now);
    let reason: string | null = null;
    try {
      await send(mail);
    } catch (error) {
      reason = reasonOf(error);
    }
    if (reason === null) {
      await invites.update(ws, invite.id, { sentAt: now, sendError: null });
      results.set(person.email, { email: person.email, line: inviteeLine(person), sent: true, error: null });
    } else {
      await invites.update(ws, invite.id, { sendError: reason });
      results.set(person.email, { email: person.email, line: inviteeLine(person), sent: false, error: INVITEES_ERRORS.notSent(person.email, reason) });
    }
  }
  // In the order pasted.
  return { outcomes: parsed.invitees.flatMap((p) => { const r = results.get(p.email); return r ? [r] : []; }) };
}
