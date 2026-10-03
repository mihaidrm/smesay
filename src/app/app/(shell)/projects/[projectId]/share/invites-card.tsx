// The Personal invites card of Share (stories/E6-2, acceptance 1 and 4): the box and Send
// (invites-form.tsx) on the instrument the link card shows, then the people invited with
// their status (Invited, In progress, Submitted, or Not sent when the email did not go,
// with the reason when one was recorded), the reminders sent (E6-3 sends them) and the
// last date: the response's last save or submit. The box is on while the public link is
// published and not closed or revoked. The sample shows its list read-only. Copy:
// docs/copy/app.md (Share, Personal invites).
import { listInvitees, inviteStatus } from "@/lib/invitees";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { formatUtc, type LinkState } from "@/lib/sharing";
import type { WorkspaceId } from "@/db/types";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvitesForm } from "./invites-form";

export async function InvitesCard({ ws, projectId, instrumentId, isSample, linkState }: { ws: WorkspaceId; projectId: string; instrumentId: string; isSample: boolean; linkState: LinkState }) {
  const rows = await listInvitees(ws, instrumentId);
  const hint = linkState === "draft" ? INVITEES_COPY.needLink : linkState === "closed" ? INVITEES_COPY.linkClosed : linkState === "revoked" ? INVITEES_COPY.linkRevoked : INVITEES_COPY.hint;
  const canSend = linkState === "open" || linkState === "notOpen";
  return (
    <section className="card flex max-w-[720px] flex-col gap-4" aria-labelledby="share-invites-title" data-testid="invites-card">
      <div className="flex flex-col gap-1">
        <h3 id="share-invites-title" className="text-[15px] font-bold">{INVITEES_COPY.card}</h3>
        <p className="text-sm text-ink-muted">{INVITEES_COPY.line}</p>
      </div>
      {isSample ? <p className="text-[13px] text-ink-muted">{INVITEES_COPY.sample}</p> : <InvitesForm key={instrumentId} projectId={projectId} instrumentId={instrumentId} hint={hint} canSend={canSend} />}
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted" data-testid="invites-empty">{INVITEES_COPY.empty}</p>
      ) : (
        <Table data-testid="invites-table">
          <TableHeader>
            <TableRow className="border-hairline text-[13px] text-ink-muted hover:bg-transparent">
              <TableHead className="h-auto px-0 py-2 pr-3 font-semibold text-ink-muted">{INVITEES_COPY.headers.person}</TableHead>
              <TableHead className="h-auto px-0 py-2 pr-3 font-semibold text-ink-muted">{INVITEES_COPY.headers.status}</TableHead>
              <TableHead className="h-auto px-0 py-2 font-semibold text-ink-muted">{INVITEES_COPY.headers.reminders}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = inviteStatus(row);
              return (
                <TableRow key={row.id} className="border-hairline align-top hover:bg-transparent" data-testid="invite-row" data-status={status}>
                  <TableCell className="px-0 py-2.5 pr-3 whitespace-normal">
                    <div className="font-semibold">{row.name ?? row.email}</div>
                    <div className="text-[13px] text-ink-muted">{[row.name ? row.email : null, row.roleHint].filter(Boolean).join(", ")}</div>
                  </TableCell>
                  <TableCell className="px-0 py-2.5 pr-3 whitespace-normal">
                    {status === "submitted" ? <StatusPill status="agree">{INVITEES_COPY.status.submitted}</StatusPill> : status === "notSent" ? <StatusPill status="pushedBack">{INVITEES_COPY.status.notSent}</StatusPill> : <NeutralPill>{INVITEES_COPY.status[status]}</NeutralPill>}
                    {row.answeredAt && <div className="mt-1 text-[13px] text-ink-muted">{formatUtc(row.answeredAt)}</div>}
                    {status === "notSent" && <div className="mt-1 text-[13px] text-ink-muted">{row.sendError ?? INVITEES_COPY.notSentHint}</div>}
                  </TableCell>
                  <TableCell className="px-0 py-2.5 whitespace-normal text-ink-muted">{row.remindersSent > 0 && row.lastReminderAt ? INVITEES_COPY.remindersLine(row.remindersSent, formatUtc(row.lastReminderAt)) : INVITEES_COPY.noneSent}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
