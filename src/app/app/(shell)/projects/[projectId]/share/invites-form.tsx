"use client";
// The Personal invites box (stories/E6-2, acceptance 1): the people, one per line or apart
// by commas, Send; the server parses and sends (src/lib/invitees.ts). After a send the box
// clears when everything went; the addresses that were not sent are listed, one line each
// (acceptance 5), and stay in the box to try again.
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { sendInvitesAction, type InvitesFormState } from "../../actions";

const NONE: InvitesFormState = { error: null, saved: false, sent: 0, failed: [] };

export function InvitesForm({ projectId, instrumentId, canSend }: { projectId: string; instrumentId: string; canSend: boolean }) {
  const [state, action, pending] = useActionState<InvitesFormState, FormData>(sendInvitesAction, NONE);
  const [people, setPeople] = useState("");
  const [dirty, setDirty] = useState(false);
  // The box clears after a send with nothing failed (state adjusted during render on a
  // changed result: react.dev/learn/you-might-not-need-an-effect).
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state.saved && state.failed.length === 0) setPeople(""); }
  const id = useId();
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-3" data-testid="invites-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-people`} className="text-[13px]">{INVITEES_COPY.field}</Label>
        <textarea id={`${id}-people`} name="people" value={people} rows={4} aria-describedby={`${id}-hint`} disabled={!canSend} onChange={(e) => { setPeople(e.target.value); setDirty(true); }} className="min-h-[104px] w-full rounded-xl border border-hairline-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50" />
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">{canSend ? INVITEES_COPY.hint : INVITEES_COPY.needLink}</p>
      </div>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && (
        <div role="status" className="flex flex-col gap-1 text-[13px]">
          <p className="text-agree-text">{INVITEES_COPY.sent(state.sent)}</p>
          {state.failed.map((line) => <p key={line} className="text-danger">{line}</p>)}
        </div>
      )}
      <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending} disabled={!canSend}>{INVITEES_COPY.send}</Button></div>
    </form>
  );
}
