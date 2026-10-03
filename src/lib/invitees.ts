// Personal invites (stories/E6-2): one invite row of kind personal per address on the
// published instrument, each with its own token (newToken, 32 hex characters as the public
// link's) and email 2 (src/lib/mail/invite-email.ts) sent from the platform as "[PM NAME]
// via SMEsay" with the PM's address as reply-to. The personal links take the public link's
// open and close instants and follow them (invites.updatePublic, invites.publish) and have
// no passcode (the address is the proof; docs/review-list.md), so the public link is
// published and not closed or revoked. The rows are created first, one by one (the partial
// unique index invite_personal_email_idx refuses a second send of the same address racing
// this one, reported as already invited; postgresql.org/docs/current/errcodes-appendix.html,
// 23505 unique_violation, wrapped by the ORM, src/db/queries/onboarding.ts
// isUniqueViolation), then the emails go out one by one: a send that fails leaves its row
// with send_error and the status Not sent (acceptance 5), the others still go, and pasting
// that address again sends it again on the same row and token (invites.claimResend: a row
// with no outcome yet is another request's for RESEND_AFTER_MINUTES). Up to INVITEES_PER_DAY rows
// per workspace in 24 hours. Words: INVITEES_COPY and INVITEES_ERRORS
// (src/lib/invitees-rules.ts; docs/copy/app.md, Share; docs/copy/errors.md).
import { invites, items, projects, workspaces } from "@/db/queries";
import type { Invite, InviteeRow } from "@/db/queries/invites";
import { isUniqueViolation } from "@/db/queries/onboarding";
import type { WorkspaceId } from "@/db/types";
import { INVITEES_COPY, INVITEES_ERRORS, INVITEES_PER_DAY, inviteeLine, minutesFor, parseInvitees, type Invitee } from "@/lib/invitees-rules";
import { inviteEmail } from "@/lib/mail/invite-email";
import { sendMail, type Mail } from "@/lib/mail";
import { NotFoundError } from "@/lib/errors";
import { linkState, newToken, own } from "@/lib/sharing";

export { INVITEES_COPY, INVITEES_ERRORS };

export type Sender = { name: string | null; email: string };
// line: what the box takes to send this person again.
export type SendOutcome = { email: string; line: string; sent: boolean; error: string | null };

// The provider's reason, one line, for the row and the message (acceptance 5). A missing
// mail variable is the app's own, not the address's: it is thrown, named, as sendMail
// names it. Anything shaped like a connection string is cut, so a server's reason never
// carries a host or a credential onto the row.
function reasonOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/ is not set\./.test(text)) throw error;
  return text.split("\n")[0]?.replace(/\S+:\/\/\S+/g, "[server]").trim().slice(0, 200) || "the mail server refused it";
}

export function inviteStatus(row: Pick<InviteeRow, "responseStatus" | "sentAt">): keyof typeof INVITEES_COPY.status {
  if (row.responseStatus === "submitted") return "submitted";
  if (row.responseStatus === "inProgress") return "inProgress";
  return row.sentAt === null ? "notSent" : "invited";
}

// The personal invites of the Share page's instrument (acceptance 4).
export async function listInvitees(ws: WorkspaceId, instrumentId: string): Promise<InviteeRow[]> {
  return invites.personalWithStatus(ws, instrumentId);
}

// Send (acceptance 1, 2 and 5). The project live, the instrument the one Share shows (own),
// its public link published and open or opening later; the list parsed whole before
// anything is created, so one bad address stops the send with nothing sent; an address
// already sent is refused the same way (acceptance 1), while one whose row was never sent
// (Not sent) goes again on its row; then the rows, then the emails. `send` is the
// transport, replaced in the tests to make one address fail.
export async function sendInvites(ws: WorkspaceId, projectId: string, instrumentId: string, rawList: unknown, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcomes: SendOutcome[] }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const { instrument } = owned;
  const link = await invites.publicForInstrument(ws, instrumentId);
  if (!link) return { error: INVITEES_COPY.needLink };
  const state = linkState(link, now);
  if (state === "closed") return { error: INVITEES_COPY.linkClosed };
  if (state === "revoked") return { error: INVITEES_COPY.linkRevoked };
  const parsed = parseInvitees(rawList);
  if ("error" in parsed) return { error: parsed.error };
  const existing = new Map<string, Invite>();
  for (const person of parsed.invitees) {
    const row = await invites.personalByEmail(ws, instrumentId, person.email);
    if (row?.sentAt) return { error: INVITEES_ERRORS.already(person.email) };
    if (row) existing.set(person.email, row);
  }
  const fresh = parsed.invitees.filter((p) => !existing.has(p.email)).length;
  if (fresh > 0 && (await invites.countPersonalSince(ws, 24 * 60)) + fresh > INVITEES_PER_DAY) return { error: INVITEES_ERRORS.tooManyToday };
  const project = await projects.get(ws, projectId);
  const workspace = await workspaces.getById(ws);
  if (!project || !workspace) throw new NotFoundError();
  const itemCount = (await items.forSet(ws, instrument.itemSetId)).length;
  const pmName = sender.name?.trim() || sender.email;
  const outcomes: SendOutcome[] = [];
  const created: { person: Invitee; invite: Invite }[] = [];
  for (const person of parsed.invitees) {
    const row = existing.get(person.email);
    if (row) {
      // Sent again on its row: the name and role typed this time replace the old ones. A
      // row another request is sending right now cannot be claimed and is reported as
      // already invited.
      const claimed = await invites.claimResend(ws, row.id, { name: person.name ?? row.name, roleHint: person.role ?? row.roleHint }, now);
      if (claimed) created.push({ person, invite: claimed });
      else outcomes.push({ email: person.email, line: inviteeLine(person), sent: false, error: INVITEES_ERRORS.already(person.email) });
      continue;
    }
    try {
      const invite = await invites.create(ws, { instrumentId, kind: "personal", token: newToken(), email: person.email, name: person.name, roleHint: person.role, opensAt: link.opensAt, closesAt: link.closesAt });
      created.push({ person, invite });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Another send of this address got in first; its row stands and sends, this one says so.
      outcomes.push({ email: person.email, line: inviteeLine(person), sent: false, error: INVITEES_ERRORS.already(person.email) });
    }
  }
  for (const { person, invite } of created) {
    const mail = inviteEmail({ pmName, workspaceName: workspace.name, projectName: project.name, respondentName: invite.name, itemCount, minutes: minutesFor(itemCount), intro: instrument.intro, url: `${baseUrl}/r/${invite.token}`, closesAt: invite.closesAt });
    let reason: string | null = null;
    try {
      await send({ ...mail, to: person.email, fromName: `${pmName} via SMEsay`, replyTo: sender.email });
    } catch (error) {
      reason = reasonOf(error);
    }
    if (reason === null) {
      await invites.update(ws, invite.id, { sentAt: now, sendError: null });
      outcomes.push({ email: person.email, line: inviteeLine(person), sent: true, error: null });
    } else {
      await invites.update(ws, invite.id, { sendError: reason });
      outcomes.push({ email: person.email, line: inviteeLine(person), sent: false, error: INVITEES_ERRORS.notSent(person.email, reason) });
    }
  }
  return { outcomes };
}
