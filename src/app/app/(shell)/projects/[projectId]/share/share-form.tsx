"use client";
// The public link card's form (stories/E6-1, acceptance 1): the open and close date-times
// as datetime-local inputs in the browser's zone (named under them, since the workspace has
// no zone of its own, docs/review-list.md), posted as ISO instants in hidden fields; the
// passcode field; Publish on a draft, Save once published. The server applies the rule
// again (src/lib/sharing.ts). datetime-local values carry no zone, so the conversion is
// `new Date(value).toISOString()` here, in the browser (developer.mozilla.org/docs/Web/HTML/
// Element/input/datetime-local, "Value"). The local text and the zone name exist only in the
// browser: the server render shows empty fields and no zone, and the client fills them once
// mounted, through useSyncExternalStore's server snapshot
// (react.dev/reference/react/useSyncExternalStore, "Adding support for server rendering"),
// so the two renders agree. A spring-forward gap or an ambiguous hour follows the browser's
// own reading of `new Date(local)` (docs/review-list.md). "Saved." until the next change.
import { useActionState, useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHARE_COPY } from "@/lib/sharing-copy";
import { publishAction, saveLinkAction, type ProjectFormState } from "../../actions";

// The local wall-clock text a datetime-local input shows for an instant.
function toLocal(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
const toIso = (local: string): string => (local ? new Date(local).toISOString() : "");

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export function ShareForm({ projectId, instrumentId, published, opensAt, closesAt, hasPasscode }: { projectId: string; instrumentId: string; published: boolean; opensAt: string | null; closesAt: string | null; hasPasscode: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(published ? saveLinkAction : publishAction, { error: null, saved: false });
  const mounted = useMounted();
  const [opensTyped, setOpens] = useState<string | null>(null);
  const [closesTyped, setCloses] = useState<string | null>(null);
  const opens = opensTyped ?? (mounted ? toLocal(opensAt ? new Date(opensAt) : null) : "");
  const closes = closesTyped ?? (mounted ? toLocal(closesAt ? new Date(closesAt) : null) : "");
  const [passcode, setPasscode] = useState("");
  const [remove, setRemove] = useState(false);
  const [dirty, setDirty] = useState(false);
  const id = useId();
  const zone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const touch = () => setDirty(true);
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-4" data-testid="share-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="opensAt" value={toIso(opens)} />
      <input type="hidden" name="closesAt" value={toIso(closes)} />
      <input type="hidden" name="removePasscode" value={remove ? "1" : "0"} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-opens`} className="text-[13px]">{SHARE_COPY.opensLabel}</Label>
          <Input id={`${id}-opens`} type="datetime-local" value={opens} aria-describedby={`${id}-opens-hint`} onChange={(e) => { setOpens(e.target.value); touch(); }} />
          <p id={`${id}-opens-hint`} className="text-[13px] text-ink-muted">{SHARE_COPY.opensHint}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${id}-closes`} className="text-[13px]">{SHARE_COPY.closesLabel}</Label>
          <Input id={`${id}-closes`} type="datetime-local" value={closes} onChange={(e) => { setCloses(e.target.value); touch(); }} />
        </div>
      </div>
      <p className="min-h-[18px] text-[13px] text-ink-muted" data-testid="share-zone">{zone ? SHARE_COPY.zone(zone) : ""}</p>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-passcode`} className="text-[13px]">{SHARE_COPY.passcodeLabel}</Label>
        <Input id={`${id}-passcode`} name="passcode" type="text" autoComplete="off" value={passcode} aria-describedby={`${id}-passcode-hint`} disabled={remove} onChange={(e) => { setPasscode(e.target.value); touch(); }} />
        <p id={`${id}-passcode-hint`} className="text-[13px] text-ink-muted">{hasPasscode && !remove ? SHARE_COPY.passcodeSet : SHARE_COPY.passcodeHint}</p>
        {hasPasscode && (
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={remove} onChange={(e) => { setRemove(e.target.checked); touch(); }} className="size-4 accent-[var(--violet)]" />
            {SHARE_COPY.removePasscode}
          </label>
        )}
      </div>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{SHARE_COPY.saved}</p>}
      <div className="flex justify-end"><Button type="submit" variant={published ? "secondary" : "primary"} loading={pending}>{published ? SHARE_COPY.save : SHARE_COPY.publish}</Button></div>
    </form>
  );
}
