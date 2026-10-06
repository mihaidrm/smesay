"use client";
// The "Who sees whose answers" card of Build (stories/E5-7, acceptance 1 and 2; design note
// 100): Named, Names hidden and Anonymous as three radio cards, drawn like the method's
// (scoring-form.tsx), above the Respondent fields card, whose rule it sets. The server checks
// the level again and refuses it while a text or email field exists under Names hidden or
// Anonymous (saveAnonymity in src/lib/instruments.ts). Locked once the validation is
// published: the cards disabled with the line. "Saved." until the next change; Save is
// secondary like the other Build cards (design note 38).
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Anonymity } from "@/db/types";
import { ANONYMITY_META } from "@/lib/anonymity";
import { BUILD_COPY } from "@/lib/build-copy";
import { cn } from "cn";
import { saveAnonymityAction, type ProjectFormState } from "../../actions";

export function AnonymityForm({ projectId, instrumentId, anonymity: initial, locked }: { projectId: string; instrumentId: string; anonymity: Anonymity; locked: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveAnonymityAction, { error: null, saved: false });
  const [level, setLevel] = useState<Anonymity>(initial);
  const [dirty, setDirty] = useState(false);
  const id = useId();
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-4" data-testid="anonymity-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <fieldset disabled={locked} aria-labelledby="build-anonymity-title" aria-describedby={locked ? `${id}-locked` : undefined} className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          {ANONYMITY_META.map((m) => {
            const active = level === m.key;
            return (
              <label key={m.key} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface", active ? "border-violet bg-violet-soft" : "border-hairline-strong bg-surface hover:bg-tint", locked && "cursor-not-allowed opacity-40")} data-testid={`anonymity-${m.key}`}>
                <input type="radio" name="anonymity" value={m.key} checked={active} onChange={() => { setLevel(m.key); setDirty(true); }} className="sr-only" />
                <span className="text-sm font-semibold">{m.label}</span>
                <span className="text-[13px] text-ink-muted">{m.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {locked && <p id={`${id}-locked`} className="text-[13px] text-ink-muted" data-testid="anonymity-locked">{BUILD_COPY.anonymityLocked}</p>}
      {state.error && !dirty && <p role="alert" className="text-sm text-danger" data-testid="anonymity-error">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      {!locked && <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending}>{BUILD_COPY.save}</Button></div>}
    </form>
  );
}
