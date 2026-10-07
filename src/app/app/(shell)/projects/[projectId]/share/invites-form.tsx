"use client";
// The Personal invites box (stories/E6-2, acceptance 1): the people, apart by commas,
// spaces or new lines, Send; the server parses and sends (src/lib/invitees.ts). After a
// send the box keeps only the addresses that were not sent, one per line, so Send again
// tries just those (acceptance 5); the messages are listed under the count sent. The box
// is off, with the reason as its hint, while the public link is not published, closed or
// revoked. Typed addresses not yet sent register with the unsaved changes guard
// (stories/E5-9) under the card's title; Discard remounts the box empty (useDiscard).
import { useActionState, useId, useState } from "react";
import { useDiscard, useUnsavedForm } from "@/components/app/unsaved";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INVITEES_COPY } from "@/lib/invitees-rules";
import { isUnsaved } from "@/lib/unsaved";
import { sendInvitesAction, type InvitesFormState } from "../../actions";

const NONE: InvitesFormState = { error: null, saved: false, sent: 0, failed: [], again: [] };

type Props = { projectId: string; instrumentId: string; hint: string; canSend: boolean };

export function InvitesForm(props: Props) {
  const [epoch, discard] = useDiscard();
  return <Form key={epoch} {...props} discard={discard} />;
}

function Form({ projectId, instrumentId, hint, canSend, discard }: Props & { discard: () => void }) {
  const [state, action, pending] = useActionState<InvitesFormState, FormData>(sendInvitesAction, NONE);
  const [people, setPeople] = useState("");
  const [dirty, setDirty] = useState(false);
  const unsaved = useUnsavedForm({ id: "share-invites", label: INVITEES_COPY.card, dirty: isUnsaved(dirty, pending, state), reset: discard });
  // The box is set from the result once (state adjusted during render on a changed result:
  // react.dev/learn/you-might-not-need-an-effect, "Adjusting some state when a prop changes").
  const [seen, setSeen] = useState(state);
  if (state !== seen) { setSeen(state); if (state.saved) setPeople(state.again.join("\n")); }
  const id = useId();
  return (
    <form {...unsaved.props} action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-3" data-testid="invites-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-people`} className="text-[13px]">{INVITEES_COPY.field}</Label>
        <Textarea id={`${id}-people`} name="people" value={people} rows={4} aria-describedby={`${id}-hint`} disabled={!canSend} onChange={(e) => { setPeople(e.target.value); setDirty(true); }} className="min-h-[104px] rounded-xl border-hairline-strong bg-surface px-3.5 py-2.5 text-sm" />
        <p id={`${id}-hint`} className="text-[13px] text-ink-muted">{hint}</p>
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
