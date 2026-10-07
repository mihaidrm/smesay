"use client";
// The Wrap up page of the respondent instrument (stories/E5-5, acceptance 3; the respondent
// board, note 12; E7-5 renders it at the end of the journey with the real answers): the
// tally, the still-to-finish box, the missing-item form when the PM switched it on, the
// closing question when the PM set one, confidence 1 to 5 (always), the sign-off as one
// 48 px label with a checkbox, and Submit, disabled with the line naming what is still
// needed. One component, used by the respondent app on a link and in the builder's preview
// (stories/E5-6), so the two cannot drift. In preview mode the band says nothing is saved
// and Submit stays disabled. Confidence is a native range input, 1 to 5 (design note 107;
// developer.mozilla.org/docs/Web/HTML/Element/input/range): the thumb in the PM's accent
// through accent-color (developer.mozilla.org/docs/Web/CSS/accent-color), the word of the
// value under it (confidenceWord), Guessing and Certain captioned at the ends. A range input
// always holds a value, so while the form's confidence is null it rests at 3, dimmed and
// marked data-unset, with the prompt in place of the word; a change (a drag, a tap on the
// track, the arrow, Home and End keys the browser handles) sets the confidence, and so does
// a tap that does not move it or Enter or Space while it has the focus, so a respondent who
// agrees with the middle can pick it. E7-4 renders it on the live link with the
// header and chapter row (`top`) and the gaps the page counts (`gaps`): the box "[N] still to
// finish." with "Go to section [N]: [CHAPTER]" to the first one's item ("Go to [CHAPTER]" on
// the single long page, decision 0055), and the list "Still to finish" naming each item
// and what is missing (Not rated yet, Reason not written yet, Question not written yet), each a button to its
// own item, and Back. E7-5: the tally from the respondent's answers, the sections of what
// they suggested (higher, lower, not needed, their questions; agreed items are not listed)
// with Change per row, the missing item, the closing answer, confidence and the sign-off held
// by the page (`value`, `onValue`), and Submit, on once nothing is still needed, "Submitting"
// while it posts (the form cannot change meanwhile) and the server's sentence when it fails;
// what the Wrap up's own save says (`saveNote`: changed elsewhere, or refused) shows above
// the form whatever Submit's state. Phone first. Tap targets on the
// live link are 48 px (docs/design-system.md, Respondent tap targets): the Go to and Change
// buttons keep their pill and take a 48 px hit area. The frame of ./frame.ts (decisions 0051 and 0052):
// from a 576 px column a centered card, Back and Submit centered in its bottom band with the
// line under them, and "Powered by" under the card.
import { useId, useState } from "react";
import { cn } from "cn";
import { PoweredBy, type PoweredByShow } from "./powered-by";
import { FRAME_ACTIONS, FRAME_CARD, FRAME_HEADER, FRAME_LINE, FRAME_OUTER, FRAME_POWERED, FRAME_PRIMARY } from "./frame";
import type { ClosingSpec, ScaleLabels, ScoringMethod } from "@/db/types";
import { ABOUT_YOU_COPY, BUILD_COPY } from "@/lib/build-copy";
import { CONFIDENCE_MAX, CONFIDENCE_MIN, CONFIDENCE_UNSET, confidenceWord, signOffFor, WRAP_UP_COPY } from "@/lib/closing";
import { accentVars } from "@/lib/brand-rules";
import { EMPTY_WRAP, MISSING_MAX, REASON_MAX, RESPONDENT_COPY, RESPONDENT_ERRORS, type Bucket, type Gap, type WrapValue } from "@/lib/respondent-rules";
import { labelFor, scaleFor } from "@/lib/scoring";

export type WrapUpProps = {
  // The way the respondent arrived, for the slide in (design note 99); null on the first screen.
  slide?: "next" | "prev" | null;
  workspaceName: string;
  accent: string;
  closing: ClosingSpec;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  showProposed: boolean;
  // The chapters' names, for Go to; the preview also offers them as the missing item's areas.
  chapters: string[];
  // Whether Go to names the chapter by number, "Go to section [N]: [CHAPTER]" (decision
  // 0055): the chapters are separate screens with names, not the single long page.
  numbered?: boolean;
  // The live link: the areas a missing item can name (areasOf); none means no area asked.
  areas?: string[];
  // How many items this respondent can see; all still to finish in the preview.
  total: number;
  preview?: boolean;
  heading?: "h1" | "h4";
  // The parts the Closing card changes (the form, the question, confidence, the sign-off),
  // ringed as one group in the preview (decision 0021).
  ring?: boolean;
  className?: string;
  // The live link (E7-4): the header and row above, the gaps, moving to a chapter, Back.
  top?: React.ReactNode;
  gaps?: Gap[];
  onGo?: (chapter: number, itemId?: string) => void;
  onBack?: () => void;
  // E7-5: the tally and sections, the form's values, Submit.
  tally?: Record<Bucket, number>;
  sections?: WrapSection[];
  value?: WrapValue;
  onValue?: (value: WrapValue) => void;
  fieldsMissing?: boolean;
  submitting?: boolean;
  submitError?: string | null;
  saveNote?: string | null;
  onSubmit?: () => void;
  poweredBy?: PoweredByShow;
};

export type WrapSection = { bucket: "higher" | "lower" | "notNeeded" | "unclear"; itemId: string; reference: string | null; title: string; value: string | null; text: string | null; chapter: number };
export { EMPTY_WRAP, type WrapValue };

const SECTION_TITLE: Record<WrapSection["bucket"], string> = { higher: WRAP_UP_COPY.tally.higher, lower: WRAP_UP_COPY.tally.lower, notNeeded: WRAP_UP_COPY.tally.notNeeded, unclear: RESPONDENT_COPY.yourQuestions };

const GAP_NOTE: Record<Gap["note"], string> = { notRated: RESPONDENT_COPY.notRated, sayWhy: RESPONDENT_COPY.sayWhy, writeQuestion: RESPONDENT_COPY.writeQuestion, notSaved: RESPONDENT_COPY.notSavedYet };

const FIELD = "h-12 w-full rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] text-ink focus:outline-hidden transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function WrapUp({ workspaceName, accent, closing, method, labels, showProposed, chapters, numbered = false, areas, total, preview = false, heading: Heading = "h1", ring = false, className, top, gaps, onGo, onBack, tally, sections, value, onValue, fieldsMissing = false, submitting = false, submitError = null, saveNote = null, onSubmit, poweredBy = true, slide = null }: WrapUpProps) {
  const open = gaps ? gaps.length : total;
  const Body = "main";
  const firstGap = gaps?.[0];
  const [own, setOwn] = useState<WrapValue>(EMPTY_WRAP);
  const form = value ?? own;
  const setForm = (next: WrapValue) => (onValue ? onValue(next) : setOwn(next));
  const { confidence, signed } = form;
  const setConfidence = (n: number) => setForm({ ...form, confidence: n });
  const setSigned = (on: boolean) => setForm({ ...form, signed: on });
  const setMissing = (patch: Partial<WrapValue["missing"]>) => setForm({ ...form, missing: { ...form.missing, ...patch } });
  const prefix = useId();
  // The slider's value: the confidence, or the middle while none is picked.
  const slider = confidence ?? CONFIDENCE_UNSET;
  const unset = confidence === null;
  // A tap that did not move the thumb, or Enter or Space: the value under the thumb counts.
  const pickCurrent = (el: HTMLInputElement) => { const n = el.valueAsNumber; if (confidence !== n) setConfidence(n); };
  const tileKeys: Bucket[] = showProposed ? ["agreed", "higher", "lower", "notNeeded", "unclear", ...((tally?.rated ?? 0) > 0 ? (["rated"] as Bucket[]) : [])] : ["rated", "notNeeded", "unclear"];
  const tileLabel: Record<Bucket, string> = { agreed: WRAP_UP_COPY.tally.agreed, higher: WRAP_UP_COPY.tally.higher, lower: WRAP_UP_COPY.tally.lower, notNeeded: WRAP_UP_COPY.tally.notNeeded, unclear: WRAP_UP_COPY.tally.unclear, rated: WRAP_UP_COPY.tally.rated };
  const needed = [...(open > 0 ? [WRAP_UP_COPY.needItems(open)] : []), ...(fieldsMissing ? [RESPONDENT_COPY.needFields] : []), ...(confidence === null ? [WRAP_UP_COPY.needConfidence] : []), ...(signed ? [] : [WRAP_UP_COPY.needSignOff])];
  const disabled = needed.length > 0;
  // Only the confidence left: the sentence that says how (stories/E7-5, acceptance 2).
  const onlyConfidence = needed.length === 1 && confidence === null;
  const live = Boolean(onSubmit);
  return (
    <div className={cn(FRAME_OUTER, "min-h-full", className)} data-testid="wrap-up" data-preview={preview || undefined}>
      <div className={FRAME_CARD}>
      {preview && <div className="bg-sun-soft px-5 py-1.5 text-center text-xs font-semibold text-sun-text">{ABOUT_YOU_COPY.previewNote}</div>}
      {top ?? (
        <header className={cn("flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3", FRAME_HEADER)}>
          <span className="grow text-[15px] font-bold">{workspaceName}</span>
          <span className="font-mono text-xs text-ink-muted">{BUILD_COPY.previewProgress(0, total)}</span>
        </header>
      )}
      <Body className="flex grow flex-col overflow-x-clip bg-ground px-5 pt-4 pb-5 @xl:px-8 @xl:pt-6 @xl:pb-8">
        {/* The slide moves this inner block, so the Body's clip holds it (design note 99). */}
        <div className="flex grow flex-col gap-4" data-slide={slide ?? undefined}>
        <Heading className="text-[22px] leading-7 font-extrabold tracking-[-0.025em] focus:outline-hidden" tabIndex={Heading === "h1" ? -1 : undefined} data-screen-heading={Heading === "h1" || undefined}>{WRAP_UP_COPY.title}</Heading>
        <div className={cn("grid gap-1.5", tileKeys.length === 6 ? "grid-cols-3 sm:grid-cols-6" : tileKeys.length === 5 ? "grid-cols-5" : "grid-cols-3")} data-testid="wrap-up-tally">
          {tileKeys.map((key) => (
            <div key={key} className="card flex flex-col items-center gap-0.5 px-1 py-2" data-tile={key}>
              <span className="font-mono text-lg font-extrabold">{tally?.[key] ?? 0}</span>
              <span className="text-center text-[10px] leading-3 text-ink-muted">{tileLabel[key]}</span>
            </div>
          ))}
        </div>
        {open > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-sun-soft px-4 py-3 text-sm text-sun-text" data-testid="wrap-up-gaps">
            <span className="font-semibold">{WRAP_UP_COPY.toFinish(open)}</span>
            {gaps && firstGap && onGo && chapters[firstGap.chapter] ? (
              <button type="button" disabled={submitting} onClick={() => onGo(firstGap.chapter, firstGap.itemId)} className="relative max-w-full rounded-full border border-current px-3 py-1 text-left text-[13px] font-semibold break-words focus:outline-hidden after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-sun-soft disabled:opacity-40" data-testid="wrap-up-go">{WRAP_UP_COPY.goTo(chapters[firstGap.chapter], numbered ? firstGap.chapter + 1 : null)}</button>
            ) : (
              !gaps && chapters[0] && <span className="shrink-0 rounded-full border border-current px-3 py-1 text-[13px] font-semibold">{WRAP_UP_COPY.goTo(chapters[0], numbered ? 1 : null)}</span>
            )}
          </div>
        ) : gaps ? (
          <p className="rounded-xl bg-mint-soft px-4 py-3 text-sm font-semibold text-mint-text" data-testid="wrap-up-all">{RESPONDENT_COPY.allAnswered(total)}</p>
        ) : (
          <p className="text-sm text-ink-muted">{WRAP_UP_COPY.noItems}</p>
        )}
        {gaps && gaps.length > 0 && (
          <section className="flex flex-col gap-2" aria-labelledby={`${prefix}-gaps-title`} data-testid="wrap-up-unfinished">
            <h2 id={`${prefix}-gaps-title`} className="text-sm font-semibold">{RESPONDENT_COPY.stillToFinish}</h2>
            <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline bg-surface">
              {gaps.map((g) => (
                <li key={g.itemId}>
                  <button type="button" disabled={submitting} onClick={() => onGo?.(g.chapter, g.itemId)} className="flex min-h-12 w-full items-baseline gap-2 px-4 py-3 text-left text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40" data-testid="unfinished-item">
                    {g.reference && <span className="shrink-0 font-mono text-[11px] text-ink-muted">{g.reference}</span>}
                    <span className="min-w-0 grow">{g.title}</span>
                    <span className={cn("shrink-0 text-xs font-semibold", g.note === "notRated" ? "font-normal text-ink-muted" : "text-sun-text")}>{GAP_NOTE[g.note]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {sections && (["higher", "lower", "notNeeded", "unclear"] as const).map((bucket) => {
          const rows = sections.filter((r) => r.bucket === bucket);
          if (rows.length === 0) return null;
          return (
            <section key={bucket} className="flex flex-col gap-2" aria-labelledby={`${prefix}-${bucket}`} data-testid={`wrap-up-section-${bucket}`}>
              <h2 id={`${prefix}-${bucket}`} className="text-sm font-semibold">{SECTION_TITLE[bucket]} <span className="font-mono text-ink-muted">{rows.length}</span></h2>
              <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline bg-surface">
                {rows.map((r) => (
                  <li key={r.itemId} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <div className="flex min-w-0 grow flex-col gap-0.5">
                      <span>{r.reference && <span className="mr-2 font-mono text-[11px] text-ink-muted">{r.reference}</span>}{r.title}</span>
                      {(r.value || r.text) && <span className="text-[13px] text-ink-muted">{[r.value ? labelFor(method, labels, r.value) : null, r.text].filter(Boolean).join(": ")}</span>}
                    </div>
                    <button type="button" disabled={submitting} onClick={() => onGo?.(r.chapter, r.itemId)} aria-label={`${RESPONDENT_COPY.change}: ${r.title}`} className="relative shrink-0 rounded-full border border-hairline-strong px-3 py-1 text-[13px] font-semibold focus:outline-hidden after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40" data-testid="section-change">{RESPONDENT_COPY.change}</button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {live && open === 0 && sections && sections.length === 0 && showProposed && <p className="text-sm text-ink-muted" data-testid="wrap-up-nothing">{WRAP_UP_COPY.nothingToReview}</p>}
        {saveNote && <p className="rounded-xl bg-sun-soft px-4 py-3 text-sm text-sun-text" role="status" data-testid="wrap-up-save-note">{saveNote}</p>}
        <fieldset disabled={submitting} className={cn("m-0 flex min-w-0 flex-col gap-4 border-0 p-0", ring && "rounded-xl ring-2 ring-violet ring-offset-8 ring-offset-ground")} data-testid="wrap-up-closing">
        {closing.missingForm && (
          <fieldset className="flex flex-col gap-2.5" data-testid="wrap-up-missing">
            <legend className="float-left mb-1 w-full text-sm font-semibold">{WRAP_UP_COPY.missingTitle}</legend>
            <label htmlFor={`${prefix}-missing`} className="clear-both text-[13px] text-ink-muted">{WRAP_UP_COPY.missingText}</label>
            <input id={`${prefix}-missing`} type="text" maxLength={MISSING_MAX} value={form.missing.text} onChange={(e) => setMissing({ text: e.target.value })} className={FIELD} />
            {(areas ?? chapters).length > 0 && (
              <>
                <label htmlFor={`${prefix}-area`} className="text-[13px] text-ink-muted">{WRAP_UP_COPY.missingArea}</label>
                <select id={`${prefix}-area`} value={form.missing.area} onChange={(e) => setMissing({ area: e.target.value })} className={FIELD} data-testid="wrap-up-area">
                  <option value="">{WRAP_UP_COPY.choose}</option>
                  {(areas ?? chapters).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
            <label htmlFor={`${prefix}-value`} className="text-[13px] text-ink-muted">{WRAP_UP_COPY.missingValue}</label>
            <select id={`${prefix}-value`} value={form.missing.value} onChange={(e) => setMissing({ value: e.target.value })} className={FIELD}>
              <option value="">{WRAP_UP_COPY.choose}</option>
              {scaleFor(method, labels).map((v) => <option key={v.code} value={v.code}>{v.label}</option>)}
            </select>
          </fieldset>
        )}
        {closing.closingQuestion && (
          <div className="flex flex-col gap-1.5" data-testid="wrap-up-question">
            <label htmlFor={`${prefix}-closing`} className="text-sm font-semibold">{closing.closingQuestion}</label>
            <textarea id={`${prefix}-closing`} rows={3} maxLength={REASON_MAX} value={form.closingAnswer} onChange={(e) => setForm({ ...form, closingAnswer: e.target.value })} className={cn(FIELD, "h-auto py-3")} />
          </div>
        )}
        <div className="flex flex-col gap-1" data-testid="wrap-up-confidence">
          <div id={`${prefix}-confidence-title`} className="mb-1 text-sm font-semibold">{WRAP_UP_COPY.confidenceTitle}</div>
          {/* 48 px tall for the tap target (docs/design-system.md, Respondent tap targets); the
              browser centres the track in the box. The thumb at 40 percent until a value is
              picked (developer.mozilla.org/docs/Web/CSS/::-webkit-slider-thumb and
              ::-moz-range-thumb). No transition of its own, so reduced motion has nothing to stop. */}
          <input type="range" min={CONFIDENCE_MIN} max={CONFIDENCE_MAX} step={1} value={slider}
            onChange={(e) => setConfidence(e.target.valueAsNumber)}
            onPointerUp={(e) => { if (unset) pickCurrent(e.currentTarget); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickCurrent(e.currentTarget); } }}
            aria-labelledby={`${prefix}-confidence-title`} aria-describedby={`${prefix}-confidence-word`} aria-valuetext={confidenceWord(slider)}
            data-unset={unset || undefined} style={accentVars(accent) as React.CSSProperties}
            className={cn("block h-12 w-full rounded-full accent-(--brand-accent) focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground dark:accent-(--brand-accent-dark)", unset && "[&::-moz-range-thumb]:opacity-40 [&::-webkit-slider-thumb]:opacity-40")}
            data-testid="confidence-slider" />
          <div className="flex justify-between font-mono text-[10px] text-ink-muted" aria-hidden="true"><span>{WRAP_UP_COPY.guessing}</span><span>{WRAP_UP_COPY.certain}</span></div>
          <p id={`${prefix}-confidence-word`} className={cn("min-h-6 text-center text-base font-semibold", unset && "text-ink-muted")} data-testid="confidence-word">{unset ? WRAP_UP_COPY.confidencePrompt : confidenceWord(confidence)}</p>
        </div>
        <label htmlFor={`${prefix}-signoff`} className="flex min-h-12 items-start gap-3 rounded-xl border border-hairline-strong bg-surface px-4 py-3 text-[15px] leading-5 has-[:checked]:border-violet has-[:checked]:bg-violet-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ground" data-testid="wrap-up-signoff">
          <input id={`${prefix}-signoff`} type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--violet)] focus:outline-hidden" />
          <span>{signOffFor(closing)}</span>
        </label>
        </fieldset>
        </div>
      </Body>
      <div className={FRAME_ACTIONS}>
        <div className="flex items-center gap-3 @xl:justify-center">
        {onBack && <button type="button" disabled={submitting} onClick={onBack} className="h-12 rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40" data-testid="wrap-up-back">{RESPONDENT_COPY.back}</button>}
        <button type="button" disabled={disabled || preview || submitting} aria-busy={submitting || undefined} aria-describedby={`${prefix}-note`} onClick={() => { if (!disabled && !preview && !submitting) onSubmit?.(); }} className={cn("h-12 grow rounded-full bg-ink px-6 text-base font-bold text-ground transition-opacity focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 @xl:grow-0", FRAME_PRIMARY)} data-testid="wrap-up-submit">{submitting ? RESPONDENT_COPY.submitting : WRAP_UP_COPY.submit}</button>
        </div>
        <div id={`${prefix}-note`} aria-live="polite" className={cn("min-h-5 text-sm", FRAME_LINE, submitError && !disabled ? "text-danger" : "text-ink-muted")} data-testid="wrap-up-note">{onlyConfidence && !preview ? RESPONDENT_ERRORS.confidence : disabled ? WRAP_UP_COPY.stillNeeded(needed) : preview ? WRAP_UP_COPY.previewSubmit : (submitError ?? WRAP_UP_COPY.allIn)}</div>
      </div>
      </div>
      <PoweredBy show={poweredBy} className={FRAME_POWERED} />
    </div>
  );
}
