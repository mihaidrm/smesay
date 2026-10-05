"use client";
// The Scoring card of Build (stories/E5-2): the method as three radio cards (the PM app
// board), the "Show the proposed value" switch (decision 0003), and one label input per
// value of the chosen method (up to 20 characters, empty keeps the default), and when a
// reason is required as three radio cards (stories/E5-2, acceptance 6; design note 98). The
// server applies the rule again (saveScoring in src/lib/instruments.ts). Locked once the
// instrument is published: the method, the switch, the labels and the reason rule disabled
// with the line;
// the layout (stories/E5-3, three radio cards) still changes. "Saved." until the next
// change; Save is secondary like the other Build cards (design note 38). The section
// headings are plain blocks named through aria-labelledby, not legends: a legend sits
// outside the fieldset's flex flow and loses the gap (Mihai, 2026-10-03: "there is
// basically 0 gap").
import { useActionState, useId, useState } from "react";
import { Toggle } from "@/components/app/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Layout, ReasonRule, ScaleLabels, ScoringMethod } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { LABEL_MAX, LAYOUTS_META, METHODS, REASON_RULES_META, SCALES } from "@/lib/scoring";
import { cn } from "cn";
import { saveScoringAction, type ProjectFormState } from "../../actions";

export function ScoringForm({ projectId, instrumentId, method: initialMethod, showProposed: initialShow, labels: initialLabels, reasonRule: initialRule, layout: initialLayout, locked }: {
  projectId: string; instrumentId: string; method: ScoringMethod; showProposed: boolean; labels: ScaleLabels | null; reasonRule: ReasonRule; layout: Layout; locked: boolean;
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveScoringAction, { error: null, saved: false });
  const [method, setMethod] = useState<ScoringMethod>(initialMethod);
  const [showProposed, setShowProposed] = useState(initialShow);
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [reasonRule, setReasonRule] = useState<ReasonRule>(initialRule);
  // Labels per method: MoSCoW and keep, change, drop share the code C, so a word typed for
  // Could must not surface under Change (audit of 2026-10-03). Only the chosen method's
  // labels are posted.
  const [labelsByMethod, setLabelsByMethod] = useState<Record<ScoringMethod, ScaleLabels>>({ moscow: {}, fit: {}, kcd: {}, [initialMethod]: initialLabels ?? {} });
  const labels = labelsByMethod[method];
  const [dirty, setDirty] = useState(false);
  const id = useId();
  const touch = () => setDirty(true);
  return (
    <form action={action} onSubmit={() => setDirty(false)} noValidate className="flex flex-col gap-4" data-testid="scoring-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="instrumentId" value={instrumentId} />
      <input type="hidden" name="showProposed" value={showProposed ? "1" : "0"} />
      <input type="hidden" name="labels" value={JSON.stringify(labels)} />
      <fieldset disabled={locked} aria-labelledby={`${id}-method`} className="flex flex-col gap-2">
        <div id={`${id}-method`} className="text-[13px] font-medium">{BUILD_COPY.methodLabel}</div>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <label key={m.key} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface", active ? "border-violet bg-violet-soft" : "border-hairline-strong bg-surface hover:bg-tint", locked && "cursor-not-allowed opacity-40")}>
                <input type="radio" name="method" value={m.key} checked={active} onChange={() => { setMethod(m.key); touch(); }} className="sr-only" />
                <span className="text-sm font-semibold">{m.label}</span>
                <span className="text-[13px] text-ink-muted">{m.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="item-row flex items-center justify-between gap-4 px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <span id={`${id}-proposed`} className="text-sm font-semibold">{BUILD_COPY.showProposedTitle}</span>
          <span id={`${id}-proposed-line`} className="text-[13px] text-ink-muted">{BUILD_COPY.showProposedLine}</span>
        </div>
        <Toggle checked={showProposed} onChange={(next) => { setShowProposed(next); touch(); }} disabled={locked} aria-labelledby={`${id}-proposed`} aria-describedby={`${id}-proposed-line`} />
      </div>
      <fieldset disabled={locked} aria-labelledby={`${id}-labels`} aria-describedby={`${id}-labels-line`} className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5"><span id={`${id}-labels`} className="text-sm font-semibold">{BUILD_COPY.labelsTitle}</span><span id={`${id}-labels-line`} className="text-[13px] text-ink-muted">{BUILD_COPY.labelsLine}</span></div>
        <div className="grid grid-cols-5 gap-2" data-testid="scale-labels">
          {SCALES[method].map((v) => (
            <div key={v.code} className="flex flex-col gap-1">
              <label htmlFor={`${id}-label-${v.code}`} className="text-xs text-ink-muted">{v.label}</label>
              <Input id={`${id}-label-${v.code}`} value={labels[v.code] ?? ""} placeholder={v.label} maxLength={LABEL_MAX} aria-label={`${BUILD_COPY.labelFor} ${v.label}`} onChange={(e) => { const text = e.target.value; setLabelsByMethod((all) => { const next = { ...all[method] }; if (text) next[v.code] = text; else delete next[v.code]; return { ...all, [method]: next }; }); touch(); }} className="h-9" />
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={locked} aria-labelledby={`${id}-reason`} aria-describedby={`${id}-reason-line`} className="flex flex-col gap-2" data-testid="reason-rule">
        <div className="flex flex-col gap-0.5"><span id={`${id}-reason`} className="text-sm font-semibold">{BUILD_COPY.reasonRuleLabel}</span><span id={`${id}-reason-line`} className="text-[13px] text-ink-muted">{BUILD_COPY.reasonRuleLine}</span></div>
        <div className="grid grid-cols-3 gap-2">
          {REASON_RULES_META.map((r) => {
            const active = reasonRule === r.key;
            return (
              <label key={r.key} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface", active ? "border-violet bg-violet-soft" : "border-hairline-strong bg-surface hover:bg-tint", locked && "cursor-not-allowed opacity-40")}>
                <input type="radio" name="reasonRule" value={r.key} checked={active} onChange={() => { setReasonRule(r.key); touch(); }} className="sr-only" />
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-[13px] text-ink-muted">{r.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {locked && <p className="text-[13px] text-ink-muted" data-testid="scoring-locked">{BUILD_COPY.locked}</p>}
      <fieldset aria-labelledby={`${id}-layout`} aria-describedby={`${id}-layout-line`} className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5"><span id={`${id}-layout`} className="text-sm font-semibold">{BUILD_COPY.layoutLabel}</span><span id={`${id}-layout-line`} className="text-[13px] text-ink-muted">{BUILD_COPY.layoutLine}</span></div>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS_META.map((l) => {
            const active = layout === l.key;
            return (
              <label key={l.key} className={cn("flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface", active ? "border-violet bg-violet-soft" : "border-hairline-strong bg-surface hover:bg-tint")}>
                <input type="radio" name="layout" value={l.key} checked={active} onChange={() => { setLayout(l.key); touch(); }} className="sr-only" />
                <span className="text-sm font-semibold">{l.label}</span>
                <span className="text-[13px] text-ink-muted">{l.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {state.error && !dirty && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {!state.error && !dirty && state.saved && <p role="status" className="text-[13px] text-agree-text">{BUILD_COPY.saved}</p>}
      <div className="flex justify-end"><Button type="submit" variant="secondary" loading={pending}>{BUILD_COPY.save}</Button></div>
    </form>
  );
}
