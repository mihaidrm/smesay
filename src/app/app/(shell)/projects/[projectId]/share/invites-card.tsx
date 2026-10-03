// The Personal invites card of Share (stories/E6-2, acceptance 1 and 4): the box and Send
// (invites-form.tsx) on the instrument the link card shows, then the people invited with
// their status (Invited, In progress, Submitted, or Not sent when the email failed), the
// reminders sent (E6-3 sends them) and the last date: the response's last save or submit.
// The sample shows its list read-only. Copy: docs/copy/app.md (Share, Personal invites).
import { listInvitees, inviteStatus } from "@/lib/invitees";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { formatUtc } from "@/lib/sharing";
import type { WorkspaceId } from "@/db/types";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { InvitesForm } from "./invites-form";

export async function InvitesCard({ ws, projectId, instrumentId, isSample, published }: { ws: WorkspaceId; projectId: string; instrumentId: string; isSample: boolean; published: boolean }) {
  const rows = await listInvitees(ws, instrumentId);
  return (
    <section className="card flex max-w-[720px] flex-col gap-4" aria-labelledby="share-invites-title" data-testid="invites-card">
      <div className="flex flex-col gap-1">
        <h3 id="share-invites-title" className="text-[15px] font-bold">{INVITEES_COPY.card}</h3>
        <p className="text-sm text-ink-muted">{INVITEES_COPY.line}</p>
      </div>
      {isSample ? <p className="text-[13px] text-ink-muted">{INVITEES_COPY.sample}</p> : <InvitesForm key={instrumentId} projectId={projectId} instrumentId={instrumentId} canSend={published} />}
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted" data-testid="invites-empty">{INVITEES_COPY.empty}</p>
      ) : (
        <table className="w-full border-collapse text-sm" data-testid="invites-table">
          <thead>
            <tr className="border-b border-hairline text-left text-[13px] text-ink-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">{INVITEES_COPY.headers.person}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{INVITEES_COPY.headers.status}</th>
              <th scope="col" className="py-2 font-semibold">{INVITEES_COPY.headers.reminders}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = inviteStatus(row);
              return (
                <tr key={row.id} className="border-b border-hairline last:border-b-0 align-top" data-testid="invite-row" data-status={status}>
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold">{row.name ?? row.email}</div>
                    <div className="text-[13px] text-ink-muted">{[row.name ? row.email : null, row.roleHint].filter(Boolean).join(", ")}</div>
                  </td>
                  <td className="py-2.5 pr-3">
                    {status === "submitted" ? <StatusPill status="agree">{INVITEES_COPY.status.submitted}</StatusPill> : status === "notSent" ? <StatusPill status="pushedBack">{INVITEES_COPY.status.notSent}</StatusPill> : <NeutralPill>{INVITEES_COPY.status[status]}</NeutralPill>}
                    {row.answeredAt && <div className="mt-1 text-[13px] text-ink-muted">{formatUtc(row.answeredAt)}</div>}
                    {status === "notSent" && row.sendError && <div className="mt-1 text-[13px] text-ink-muted">{row.sendError}</div>}
                  </td>
                  <td className="py-2.5 text-ink-muted">{row.remindersSent > 0 && row.lastReminderAt ? INVITEES_COPY.remindersLine(row.remindersSent, formatUtc(row.lastReminderAt)) : INVITEES_COPY.noneSent}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
