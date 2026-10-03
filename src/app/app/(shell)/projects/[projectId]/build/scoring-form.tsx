"use client";
// The Scoring card of Build (stories/E5-2): the method as three radio cards (the PM app
// board), the "Show the proposed value" switch (decision 0003), and one label input per
// value of the chosen method (up to 20 characters, empty keeps the default). The server
// applies the rule again (saveScoring in src/lib/instruments.ts). Locked once the
// instrument is published: every control disabled with the line. "Saved." until the next
// change; Save is secondary like the other Build cards (design note 38).
import { useActionState, useId, useState } from "react";
import { Toggle } from "@/components/app/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { LABEL_MAX, METHODS, SCALES } from "@/lib/scoring";
import { cn } from "cn";
import { saveScoringAction, type ProjectFormState } from "../../actions";

export function ScoringForm({ projectId, instrumentId, method: initialMethod, showProposed: initialShow, labels: initialLabels, locked }: {
  projectId: string; instrumentId: string; method: ScoringMethod; showProposed: boolean; labels: ScaleLabels | null; locked: boolean;
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveScoringAction, { error: null, saved: false });
  const [method, setMethod] = useState<ScoringMethod>(initialMethod);
  const [showProposed, setShowProposed] = useState(initialShow);
  const [labels, setLabels] = useState<ScaleLabels>(initialLabels ?? {});
  const [dirty, setDirty] = useState(false);
  const id = useId();
  const touch = () => setDirty(true);
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-4" data-testid="scoring-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="showProposed" value={showProposed ? "1" : "0"} />
      <input type="hidden" name="labels" value={JSON.stringify(labels)} />
      <fieldset disabled={locked} className="flex flex-col gap-2">
        <legend className="text-[13px] font-medium">{BUILD_COPY.methodLabel}</legend>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <label key={m.key} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface", active ? "border-violet bg-violet-soft" : "border-hairline-strong bg-surface hover:bg-tint", locked && "cursor-not-allowed opacity-60")}>
                <input type="radio" name="method" value={m.key} checked={active} onChange={() => { setMethod(m.key); touch(); }} className="sr-only" />
                <span className="text-sm font-semibold">{m.label}</span>
                <span className="text-[13px] text-ink-muted">{m.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="item-row flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span id={`${id}-proposed`} className="text-sm font-semibold">{BUILD_COPY.showProposedTitle}</span>
          <span className="text-[13px] text-ink-muted">{BUILD_COPY.showProposedLine}</span>
        </div>
        <Toggle checked={showProposed} onChange={(next) => { setShowProposed(next); touch(); }} disabled={locked} aria-labelledby={`${id}-proposed`} />
      </div>
      <fieldset disabled={locked} className="flex flex-col gap-2">
        <legend className="flex flex-col gap-0.5"><span className="text-sm font-semibold">{BUILD_COPY.labelsTitle}</span><span className="text-[13px] text-ink-muted">{BUILD_COPY.labelsLine}</span></legend>
        <div className="grid grid-cols-5 gap-2" data-testid="scale-labels">
          {SCALES[method].map((v) => (
            <div key={v.code} className="flex flex-col gap-1">
              <label htmlFor={`${id}-label-${v.code}`} className="text-xs text-ink-muted">{v.label}</label>
              <Input id={`${id}-label-${v.code}`} value={labels[v.code] ?? ""} placeholder={v.label} maxLength={LABEL_MAX} onChange={(e) => { const text = e.target.value; setLabels((l) => { const next = { ...l }; if (text) next[v.code] = text; else delete next[v.code]; return next; }); touch(); }} className="h-9" />
            </div>
          ))}
        </div>
      </fieldset>
      {locked && <p className="text-[13px] text-ink-muted" data-testid="scoring-locked">{BUILD_COPY.locked}</p>}
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      {!locked && <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending}>{BUILD_COPY.save}</Button></div>}
    </form>
  );
}
