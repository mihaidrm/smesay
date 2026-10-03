// Personal invites (stories/E6-2): one invite row of kind personal per address on the
// published instrument, each with its own token (newToken, 32 hex characters as the public
// link's) and email 2 (src/lib/mail/invite-email.ts) sent from the platform as "[PM NAME]
// via SMEsay" with the PM's address as reply-to. The personal links take the public link's
// open and close instants and no passcode (the address is the proof; docs/review-list.md),
// so the public link is published first. The rows are created first, one by one (the
// partial unique index invite_personal_email_idx refuses a second send of the same address
// racing this one; postgresql.org/docs/current/errcodes-appendix.html, 23505
// unique_violation), then the emails go out one by one: a send that fails leaves its row
// with send_error and the status Not sent (acceptance 5), and the others still go. Words:
// INVITEES_COPY and INVITEES_ERRORS (src/lib/invitees-rules.ts; docs/copy/app.md, Share;
// docs/copy/errors.md).
import { invites, items, projects, workspaces } from "@/db/queries";
import type { Invite, InviteeRow } from "@/db/queries/invites";
import type { WorkspaceId } from "@/db/types";
import { INVITEES_COPY, INVITEES_ERRORS, minutesFor, parseInvitees, type Invitee } from "@/lib/invitees-rules";
import { inviteEmail } from "@/lib/mail/invite-email";
import { sendMail, type Mail } from "@/lib/mail";
import { NotFoundError } from "@/lib/errors";
import { newToken, own } from "@/lib/sharing";

export { INVITEES_COPY, INVITEES_ERRORS };

export type Sender = { name: string | null; email: string };
export type SendOutcome = { email: string; sent: boolean; error: string | null };

const uniqueViolation = (error: unknown): boolean => typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505";

// The provider's reason, one line, for the row and the message (acceptance 5).
function reasonOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.split("\n")[0]?.trim().slice(0, 200) || "the mail server refused it";
}

export function inviteStatus(row: Pick<InviteeRow, "responseStatus" | "sendError" | "sentAt">): keyof typeof INVITEES_COPY.status {
  if (row.responseStatus === "submitted") return "submitted";
  if (row.responseStatus === "inProgress") return "inProgress";
  return row.sendError !== null && row.sentAt === null ? "notSent" : "invited";
}

// The personal invites of the Share page's instrument (acceptance 4).
export async function listInvitees(ws: WorkspaceId, instrumentId: string): Promise<InviteeRow[]> {
  return invites.personalWithStatus(ws, instrumentId);
}

// Send (acceptance 1, 2 and 5). The project live, the instrument the one Share shows (own),
// its public link published; the list parsed whole before anything is created, so one bad
// address stops the send with nothing sent; an address already invited is refused the same
// way (acceptance 1); then the rows, then the emails. `send` is the transport, replaced in
// the tests to make one address fail.
export async function sendInvites(ws: WorkspaceId, projectId: string, instrumentId: string, rawList: unknown, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcomes: SendOutcome[] }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const { instrument } = owned;
  const link = await invites.publicForInstrument(ws, instrumentId);
  if (!link) return { error: INVITEES_COPY.needLink };
  const parsed = parseInvitees(rawList);
  if ("error" in parsed) return { error: parsed.error };
  for (const person of parsed.invitees) {
    if (await invites.personalByEmail(ws, instrumentId, person.email)) return { error: INVITEES_ERRORS.already(person.email) };
  }
  const project = await projects.get(ws, projectId);
  const workspace = await workspaces.getById(ws);
  if (!project || !workspace) throw new NotFoundError();
  const itemCount = (await items.forSet(ws, instrument.itemSetId)).length;
  const pmName = sender.name?.trim() || sender.email;
  const created: { person: Invitee; invite: Invite }[] = [];
  for (const person of parsed.invitees) {
    try {
      const invite = await invites.create(ws, { instrumentId, kind: "personal", token: newToken(), email: person.email, name: person.name, roleHint: person.role, opensAt: link.opensAt, closesAt: link.closesAt });
      created.push({ person, invite });
    } catch (error) {
      if (!uniqueViolation(error)) throw error;
      // Another send of this address got in first; its row stands, and the rest still go.
    }
  }
  const outcomes: SendOutcome[] = [];
  for (const { person, invite } of created) {
    const mail = inviteEmail({ pmName, workspaceName: workspace.name, projectName: project.name, respondentName: person.name, itemCount, minutes: minutesFor(itemCount), intro: instrument.intro, url: `${baseUrl}/r/${invite.token}`, closesAt: invite.closesAt });
    try {
      await send({ ...mail, to: person.email, fromName: `${pmName} via SMEsay`, replyTo: sender.email });
      await invites.update(ws, invite.id, { sentAt: now, sendError: null });
      outcomes.push({ email: person.email, sent: true, error: null });
    } catch (error) {
      const reason = reasonOf(error);
      await invites.update(ws, invite.id, { sendError: reason });
      outcomes.push({ email: person.email, sent: false, error: INVITEES_ERRORS.notSent(person.email, reason) });
    }
  }
  return { outcomes };
}
