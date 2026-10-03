"use client";
// The Wrap up page of the respondent instrument (stories/E5-5, acceptance 3; the respondent
// board, note 12; E7-5 renders it at the end of the journey with the real answers): the
// tally, the still-to-finish box, the missing-item form when the PM switched it on, the
// closing question when the PM set one, confidence 1 to 5 (always), the sign-off as one
// 48 px label with a checkbox, and Submit, disabled with the line naming what is still
// needed. One component for the Build preview and the real page, so the two cannot drift.
// In preview mode nothing is answered: the tally is zero, every item is still to finish,
// the picks stay in memory and Submit stays disabled. Phone first.
import { useId, useState } from "react";
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import type { ClosingSpec, ScaleLabels, ScoringMethod } from "@/db/types";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { signOffFor, WRAP_UP_COPY } from "@/lib/closing";
import { scaleFor } from "@/lib/scoring";

export type WrapUpProps = {
  workspaceName: string;
  accent: string;
  closing: ClosingSpec;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  showProposed: boolean;
  // The chapters for the missing-item form's area dropdown and the first unfinished one.
  chapters: string[];
  // How many items this respondent can see; all still to finish in the preview.
  total: number;
  preview?: boolean;
  heading?: "h1" | "h4";
  // The parts the Closing card changes (the form, the question, confidence, the sign-off),
  // ringed as one group in the preview (decision 0021).
  ring?: boolean;
  className?: string;
};

const FIELD = "h-12 w-full rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] text-ink outline-none transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function WrapUp({ workspaceName, accent, closing, method, labels, showProposed, chapters, total, preview = false, heading: Heading = "h1", ring = false, className }: WrapUpProps) {
  const [confidence, setConfidence] = useState<number | null>(null);
  const [signed, setSigned] = useState(false);
  const prefix = useId();
  const tiles = showProposed
    ? [WRAP_UP_COPY.tally.agreed, WRAP_UP_COPY.tally.higher, WRAP_UP_COPY.tally.lower, WRAP_UP_COPY.tally.notNeeded, WRAP_UP_COPY.tally.unclear]
    : [WRAP_UP_COPY.tally.rated, WRAP_UP_COPY.tally.notNeeded, WRAP_UP_COPY.tally.unclear];
  const needed = [...(total > 0 ? [WRAP_UP_COPY.needItems(total)] : []), ...(confidence === null ? [WRAP_UP_COPY.needConfidence] : []), ...(signed ? [] : [WRAP_UP_COPY.needSignOff])];
  const disabled = needed.length > 0;
  return (
    <div className={cn("flex min-h-full flex-col bg-ground text-ink", className)} data-testid="wrap-up" data-preview={preview || undefined}>
      {preview && <div className="bg-sun-soft px-5 py-1.5 text-center text-xs font-semibold text-sun-text">{ABOUT_YOU_COPY.previewNote}</div>}
      <header className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3">
        <span className="grow text-[15px] font-bold">{workspaceName}</span>
        <span className="font-mono text-xs text-ink-muted">0 of {total}</span>
      </header>
      <div className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
        <Heading className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{WRAP_UP_COPY.title}</Heading>
        <div className={cn("grid gap-1.5", showProposed ? "grid-cols-5" : "grid-cols-3")} data-testid="wrap-up-tally">
          {tiles.map((label) => (
            <div key={label} className="card flex flex-col items-center gap-0.5 px-1 py-2">
              <span className="font-mono text-lg font-extrabold">0</span>
              <span className="text-center text-[10px] leading-3 text-ink-muted">{label}</span>
            </div>
          ))}
        </div>
        {total > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-sun-soft px-4 py-3 text-sm text-sun-text" data-testid="wrap-up-gaps">
            <span className="font-semibold">{WRAP_UP_COPY.toFinish(total)}</span>
            {chapters[0] && <button type="button" className="shrink-0 rounded-full border border-current px-3 py-1 text-[13px] font-semibold">{WRAP_UP_COPY.goTo(chapters[0])}</button>}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{WRAP_UP_COPY.nothingToReview}</p>
        )}
        <div className={cn("flex flex-col gap-4", ring && "rounded-xl ring-2 ring-violet ring-offset-8 ring-offset-ground")} data-testid="wrap-up-closing">
        {closing.missingForm && (
          <fieldset className="flex flex-col gap-2.5" data-testid="wrap-up-missing">
            <legend className="float-left mb-1 w-full text-sm font-semibold">{WRAP_UP_COPY.missingTitle}</legend>
            <label htmlFor={`${prefix}-missing`} className="clear-both text-[13px] text-ink-muted">{WRAP_UP_COPY.missingText}</label>
            <input id={`${prefix}-missing`} type="text" className={FIELD} />
            <label htmlFor={`${prefix}-area`} className="text-[13px] text-ink-muted">{WRAP_UP_COPY.missingArea}</label>
            <select id={`${prefix}-area`} defaultValue="" className={FIELD}>
              <option value="">{WRAP_UP_COPY.choose}</option>
              {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label htmlFor={`${prefix}-value`} className="text-[13px] text-ink-muted">{WRAP_UP_COPY.missingValue}</label>
            <select id={`${prefix}-value`} defaultValue="" className={FIELD}>
              <option value="">{WRAP_UP_COPY.choose}</option>
              {scaleFor(method, labels).map((v) => <option key={v.code} value={v.code}>{v.label}</option>)}
            </select>
          </fieldset>
        )}
        {closing.closingQuestion && (
          <div className="flex flex-col gap-1.5" data-testid="wrap-up-question">
            <label htmlFor={`${prefix}-closing`} className="text-sm font-semibold">{closing.closingQuestion}</label>
            <textarea id={`${prefix}-closing`} rows={3} className={cn(FIELD, "h-auto py-3")} />
          </div>
        )}
        <fieldset className="flex flex-col gap-2" data-testid="wrap-up-confidence">
          <legend className="float-left mb-1 w-full text-sm font-semibold">{WRAP_UP_COPY.confidenceTitle}</legend>
          <div className="clear-both flex gap-1" role="radiogroup" aria-label={WRAP_UP_COPY.confidenceTitle}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = confidence === n;
              return (
                <button key={n} type="button" role="radio" aria-checked={on} onClick={() => setConfidence(n)} style={on ? { background: accent, borderColor: accent } : undefined} className={cn("h-12 flex-1 rounded-full border text-base font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground", on ? "text-white" : "border-hairline-strong bg-surface text-ink-muted")}>{n}</button>
              );
            })}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-ink-muted"><span>{WRAP_UP_COPY.guessing}</span><span>{WRAP_UP_COPY.certain}</span></div>
        </fieldset>
        <label htmlFor={`${prefix}-signoff`} className="flex min-h-12 items-start gap-3 rounded-xl border border-hairline-strong bg-surface px-4 py-3 text-[15px] leading-5 has-[:checked]:border-violet has-[:checked]:bg-violet-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ground" data-testid="wrap-up-signoff">
          <input id={`${prefix}-signoff`} type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--violet)]" />
          <span>{signOffFor(closing)}</span>
        </label>
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-hairline bg-surface px-5 pt-3 pb-4">
        <button type="button" disabled={disabled || preview} aria-describedby={`${prefix}-note`} className="h-12 rounded-full bg-ink px-6 text-base font-bold text-ground transition-opacity disabled:opacity-40" data-testid="wrap-up-submit">{WRAP_UP_COPY.submit}</button>
        <div id={`${prefix}-note`} aria-live="polite" className="min-h-5 text-sm text-ink-muted" data-testid="wrap-up-note">{disabled ? WRAP_UP_COPY.stillNeeded(needed) : WRAP_UP_COPY.allIn}</div>
      </div>
    </div>
  );
}
