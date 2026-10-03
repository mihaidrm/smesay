"use client";
// The reminder buttons of the Personal invites card (stories/E6-3): "Remind everyone who
// has not submitted" over the list and Remind on a row. Each is its own form on a server
// action; the result ("[N] reminders sent." and one line per person not sent) shows under
// the button that was pressed. The row's part stays mounted whatever the rule says, so the
// message survives the refresh that follows a send: it shows the button when the person
// can be reminded, the too-soon line when not yet, and nothing for a submitted person or a
// Not sent row (reminders-rules.ts canRemind). The server applies the rule again.
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { REMINDERS_COPY } from "@/lib/reminders-rules";
import { remindAction, remindAllAction, type RemindFormState } from "../../actions";

const NONE: RemindFormState = { error: null, saved: false, sent: 0, failed: [] };

function Outcome({ state }: { state: RemindFormState }) {
  if (state.error) return <p role="alert" className="text-[13px] text-danger">{state.error}</p>;
  if (!state.saved) return null;
  return (
    <div role="status" className="flex flex-col gap-0.5 text-[13px]">
      <p className={state.sent > 0 ? "text-agree-text" : "text-ink-muted"}>{state.sent > 0 ? REMINDERS_COPY.sent(state.sent) : state.failed.length === 0 ? REMINDERS_COPY.noneDue : ""}</p>
      {state.failed.map((line) => <p key={line} className="text-danger">{line}</p>)}
    </div>
  );
}

export function RemindAllForm({ projectId, instrumentId, due, canSend }: { projectId: string; instrumentId: string; due: number; canSend: boolean }) {
  const [state, action, pending] = useActionState<RemindFormState, FormData>(remindAllAction, NONE);
  return (
    <form action={action} className="flex flex-col items-end gap-1" data-testid="remind-all-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <Button type="submit" variant="secondary" loading={pending} disabled={!canSend || due === 0} title={due === 0 ? REMINDERS_COPY.noneDue : undefined}>{REMINDERS_COPY.remindAll}</Button>
      {due === 0 && !state.saved && !state.error && <p className="text-[13px] text-ink-muted">{REMINDERS_COPY.noneDue}</p>}
      <Outcome state={state} />
    </form>
  );
}

// show: "button", the too-soon line as a string, or "none".
export function RemindForm({ projectId, instrumentId, inviteId, canSend, show }: { projectId: string; instrumentId: string; inviteId: string; canSend: boolean; show: "button" | "none" | { tooSoon: string } }) {
  const [state, action, pending] = useActionState<RemindFormState, FormData>(remindAction, NONE);
  return (
    <form action={action} className="flex flex-col items-end gap-1" data-testid="remind-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      {show === "button" ? <Button type="submit" variant="secondary" size="small" loading={pending} disabled={!canSend}>{REMINDERS_COPY.remind}</Button> : show === "none" ? null : <span className="text-[13px] text-ink-muted" data-testid="remind-too-soon">{show.tooSoon}</span>}
      <Outcome state={state} />
    </form>
  );
}
