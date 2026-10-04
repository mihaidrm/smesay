"use client";
// Revoke and New link on a row of the Personal invites card (stories/E6-4, acceptance 2):
// Revoke sets the row's link to the inactive page; New link, on a revoked row, makes a
// fresh token and sends email 2 to the address, saying so under the button. Each is its
// own form on a server action, kept mounted across the row's states so the message
// survives the refresh.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { renewInviteAction, revokeInviteAction, type InvitesFormState, type ProjectFormState } from "../../actions";

// mark: a short hash of the link the row showed (src/lib/invitees.ts linkMark; never the
// token), so a stale tab cannot revoke a fresh one.
export function RevokeInvite({ projectId, instrumentId, inviteId, mark }: { projectId: string; instrumentId: string; inviteId: string; mark: string }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(revokeInviteAction, { error: null, saved: false });
  return (
    <form action={action} className="flex flex-col items-end gap-1" data-testid="revoke-invite-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <input type="hidden" name="mark" value={mark} />
      <Button type="submit" variant="destructive" size="small" loading={pending}>{INVITEES_COPY.revoke}</Button>
      {state.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
    </form>
  );
}

export function RenewInvite({ projectId, instrumentId, inviteId, canSend }: { projectId: string; instrumentId: string; inviteId: string; canSend: boolean }) {
  const [state, action, pending] = useActionState<InvitesFormState, FormData>(renewInviteAction, { error: null, saved: false, sent: 0, failed: [], again: [] });
  return (
    <form action={action} className="flex flex-col items-end gap-1" data-testid="renew-invite-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" variant="secondary" size="small" loading={pending} disabled={!canSend}>{INVITEES_COPY.newLink}</Button>
      {state.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
      {!state.error && state.saved && state.failed.map((line, i) => <p key={`${i}-${line}`} role="status" className="text-[13px] text-danger">{line}</p>)}
    </form>
  );
}
