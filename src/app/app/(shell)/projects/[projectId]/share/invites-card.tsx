// The Personal invites card of Share (stories/E6-2, acceptance 1 and 4): the box and Send
// (invites-form.tsx) on the instrument the link card shows, then the people invited with
// their status (Invited, In progress, Submitted, or Not sent when the email did not go,
// with the reason when one was recorded), the reminders sent (E6-3 sends them) and the
// last date: the response's last save or submit; Remind on a row and "Remind everyone who
// has not submitted" over the list (stories/E6-3, remind-buttons.tsx), with the too-soon
// line in place of Remind when a person was reminded under three days ago and nothing
// for a submitted person or a Not sent row (reminders-rules.ts canRemind); Revoke on every
// row with a live link and New link on a revoked row (stories/E6-4, invite-row-actions.tsx;
// a revoked row reads Revoked with the date). The box and the buttons are on
// while the public link is published and not closed or revoked. The sample shows its list
// read-only. Copy: docs/copy/app.md (Share, Personal invites).
import { linkMark, listInvitees, inviteStatus } from "@/lib/invitees";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { formatUtc, type LinkState } from "@/lib/sharing";
import type { WorkspaceId } from "@/db/types";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canRemind, REMINDERS_COPY, tooSoonLine } from "@/lib/reminders-rules";
import { InvitesForm } from "./invites-form";
import { RemindAllForm, RemindForm } from "./remind-buttons";
import { RenewInvite, RevokeInvite } from "./invite-row-actions";

export async function InvitesCard({ ws, projectId, instrumentId, isSample, linkState }: { ws: WorkspaceId; projectId: string; instrumentId: string; isSample: boolean; linkState: LinkState }) {
  const rows = await listInvitees(ws, instrumentId);
  const now = new Date();
  const due = rows.filter((r) => canRemind(r, now).ok).length;
  const hint = linkState === "draft" ? INVITEES_COPY.needLink : linkState === "closed" ? INVITEES_COPY.linkClosed : linkState === "revoked" ? INVITEES_COPY.linkRevoked : INVITEES_COPY.hint;
  const canSend = linkState === "open" || linkState === "notOpen";
  return (
    <section className="card flex max-w-[720px] flex-col gap-4 p-4" aria-labelledby="share-invites-title" data-testid="invites-card">
      <div className="flex flex-col gap-1">
        <h3 id="share-invites-title" className="text-[15px] font-bold">{INVITEES_COPY.card}</h3>
        <p className="text-sm text-ink-muted">{INVITEES_COPY.line}</p>
      </div>
      {isSample ? <p className="text-[13px] text-ink-muted">{INVITEES_COPY.sample}</p> : <InvitesForm key={instrumentId} projectId={projectId} instrumentId={instrumentId} hint={hint} canSend={canSend} />}
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted" data-testid="invites-empty">{INVITEES_COPY.empty}</p>
      ) : (
        <>
        {!isSample && (
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] text-ink-muted">{REMINDERS_COPY.rule}</p>
            <RemindAllForm projectId={projectId} instrumentId={instrumentId} due={due} canSend={canSend} />
          </div>
        )}
        <Table data-testid="invites-table">
          <TableHeader>
            <TableRow className="border-hairline text-[13px] text-ink-muted hover:bg-transparent">
              <TableHead className="h-auto px-0 py-2 pr-3 font-semibold text-ink-muted">{INVITEES_COPY.headers.person}</TableHead>
              <TableHead className="h-auto px-0 py-2 pr-3 font-semibold text-ink-muted">{INVITEES_COPY.headers.status}</TableHead>
              <TableHead className="h-auto px-0 py-2 pr-3 font-semibold text-ink-muted">{INVITEES_COPY.headers.reminders}</TableHead>
              <TableHead className="h-auto px-0 py-2 text-right font-semibold text-ink-muted"><span className="sr-only">{INVITEES_COPY.headers.actions}</span></TableHead>
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
                    {status === "revoked" && row.revokedAt && <div className="mt-1 text-[13px] text-ink-muted">{INVITEES_COPY.revokedLine(formatUtc(row.revokedAt))}</div>}
                  </TableCell>
                  <TableCell className="px-0 py-2.5 pr-3 whitespace-normal text-ink-muted" data-testid="reminders-cell">{row.remindersSent > 0 && row.lastReminderAt ? INVITEES_COPY.remindersLine(row.remindersSent, formatUtc(row.lastReminderAt)) : INVITEES_COPY.noneSent}</TableCell>
                  <TableCell className="px-0 py-2.5 text-right whitespace-normal">
                    {isSample ? null : (
                      <div className="flex flex-col items-end gap-1.5">
                        {(() => {
                          const check = canRemind(row, now);
                          return <RemindForm projectId={projectId} instrumentId={instrumentId} inviteId={row.id} canSend={canSend} show={check.ok ? "button" : check.why === "tooSoon" ? { tooSoon: tooSoonLine(check) } : "none"} />;
                        })()}
                        {row.revokedAt ? <RenewInvite projectId={projectId} instrumentId={instrumentId} inviteId={row.id} canSend={canSend} /> : <RevokeInvite projectId={projectId} instrumentId={instrumentId} inviteId={row.id} mark={linkMark(row.token)} />}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </>
      )}
    </section>
  );
}
