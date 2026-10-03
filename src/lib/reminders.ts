// Reminders to invitees who have not submitted (stories/E6-3): Remind on a row, or
// "Remind everyone who has not submitted", each a request from the PM (never automatic,
// docs/copy/emails.md). The rule is in src/lib/reminders-rules.ts (canRemind: not
// submitted, the invite sent, not revoked, the last reminder REMIND_AFTER_HOURS ago or
// none) and the claim is one statement (invites.claimReminder), so two presses cannot
// both send; a reminder whose email fails gives the claim back. Email 3
// (src/lib/mail/reminder-email.ts) carries "You have not started yet." or "You answered
// [N] of [M] items." from the invite's newest response and its answers. The link in force
// must be open or opening later (the same checks as sending an invite).
import { answers, invites, items, projects, responses, workspaces } from "@/db/queries";
import type { InviteeRow } from "@/db/queries/invites";
import type { WorkspaceId } from "@/db/types";
import { cutServers, INVITEES_COPY, listInvitees, type Sender } from "@/lib/invitees";
import { reminderEmail } from "@/lib/mail/reminder-email";
import { sendMail, type Mail } from "@/lib/mail";
import { NotFoundError } from "@/lib/errors";
import { canRemind, REMIND_AFTER_HOURS, REMINDERS_COPY, tooSoonLine } from "@/lib/reminders-rules";
import { linkState, own } from "@/lib/sharing";

export { REMINDERS_COPY };

export type RemindOutcome = { email: string; sent: boolean; error: string | null };

// The provider's reason, cut as the invite's is (src/lib/invitees.ts cutServers).
function reasonOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/^[A-Z_]+ is not set\./.test(text)) throw error;
  return cutServers(text.split("\n")[0] ?? "").trim().replace(/\.$/, "") || "the mail server refused it";
}

type Ready = { error: string } | { pmName: string; projectName: string; itemCount: number; rows: InviteeRow[] };

async function ready(ws: WorkspaceId, projectId: string, instrumentId: string, sender: Sender, now: Date): Promise<Ready> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const link = await invites.publicForInstrument(ws, instrumentId);
  if (!link) return { error: INVITEES_COPY.needLink };
  const state = linkState(link, now);
  if (state === "closed") return { error: INVITEES_COPY.linkClosed };
  if (state === "revoked") return { error: INVITEES_COPY.linkRevoked };
  const project = await projects.get(ws, projectId);
  const workspace = await workspaces.getById(ws);
  if (!project || !workspace) throw new NotFoundError();
  const itemCount = (await items.forSet(ws, owned.instrument.itemSetId)).length;
  return { pmName: sender.name?.trim() || sender.email, projectName: project.name, itemCount, rows: await listInvitees(ws, instrumentId) };
}

async function remindRow(ws: WorkspaceId, row: InviteeRow, pmName: string, projectName: string, itemCount: number, sender: Sender, baseUrl: string, now: Date, send: (mail: Mail) => Promise<void>): Promise<RemindOutcome> {
  const email = row.email ?? "";
  const claimed = await invites.claimReminder(ws, row.id, now, REMIND_AFTER_HOURS);
  if (!claimed) return { email, sent: false, error: REMINDERS_COPY.refused(email) };
  const response = await responses.forInvite(ws, row.id);
  if (response?.submittedAt) {
    await invites.unclaimReminder(ws, row.id, row.lastReminderAt);
    return { email, sent: false, error: REMINDERS_COPY.refused(email) };
  }
  const answered = response ? await answers.countForResponse(ws, response.id) : 0;
  const mail = reminderEmail({ pmName, projectName, respondentName: row.name, answered, itemCount, url: `${baseUrl}/r/${row.token}`, closesAt: claimed.closesAt });
  try {
    await send({ ...mail, to: email, fromName: `${pmName} via SMEsay`, replyTo: sender.email });
  } catch (error) {
    const reason = reasonOf(error);
    await invites.unclaimReminder(ws, row.id, row.lastReminderAt);
    return { email, sent: false, error: REMINDERS_COPY.notSent(email, reason) };
  }
  return { email, sent: true, error: null };
}

// Remind one person (acceptance 1 to 3). The rule is checked from the row first, so the
// message names why not; the claim checks it again in one statement.
export async function remindInvitee(ws: WorkspaceId, projectId: string, instrumentId: string, inviteId: string, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcome: RemindOutcome }> {
  const prepared = await ready(ws, projectId, instrumentId, sender, now);
  if ("error" in prepared) return prepared;
  const row = prepared.rows.find((r) => r.id === inviteId);
  if (!row) throw new NotFoundError();
  const check = canRemind(row, now);
  if (!check.ok) return { error: check.why === "tooSoon" ? tooSoonLine(check) : REMINDERS_COPY.refused(row.email ?? "") };
  return { outcome: await remindRow(ws, row, prepared.pmName, prepared.projectName, prepared.itemCount, sender, baseUrl, now, send) };
}

// Remind everyone who has not submitted and is due (acceptance 1): one request, one
// outcome per person reminded or refused on the way; the people not due are left out.
export async function remindAll(ws: WorkspaceId, projectId: string, instrumentId: string, sender: Sender, baseUrl: string, now = new Date(), send: (mail: Mail) => Promise<void> = sendMail): Promise<{ error: string } | { outcomes: RemindOutcome[] }> {
  const prepared = await ready(ws, projectId, instrumentId, sender, now);
  if ("error" in prepared) return prepared;
  const outcomes: RemindOutcome[] = [];
  for (const row of prepared.rows) {
    if (!canRemind(row, now).ok) continue;
    outcomes.push(await remindRow(ws, row, prepared.pmName, prepared.projectName, prepared.itemCount, sender, baseUrl, now, send));
  }
  return { outcomes };
}
