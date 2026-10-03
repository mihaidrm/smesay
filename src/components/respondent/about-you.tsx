"use client";
// The About you page of the respondent instrument (stories/E5-1, acceptance 3; the respondent
// board, note 12; E7-1 renders it at /r/[token]). The PM's name and initials in the header,
// the title and the intro, the fields the PM configured (a dropdown is a native select at
// 48 px, E7-1 acceptance 2), Start disabled at 40 percent until every required field is
// filled, with the hint under it (aria-describedby on Start, aria-required on the fields;
// the wording by decision 0043), and the footer. One component for the Build preview and
// the real page, so the two cannot drift (stories/E5-6, acceptance 3). In preview mode the
// header says nothing is saved and Start does nothing (E5-6, acceptance 4). Phone first:
// the column is the screen width; on desktop E7-1 puts it in the 560 px column.
import { useId, useState } from "react";
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { initials } from "@/components/app/tiles";
import type { RespondentFieldSpec, ResponseFields } from "@/db/types";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { missingMandatory, startHint } from "@/lib/respondent-fields";

export type AboutYouProps = {
  workspaceName: string;
  // effectiveAccent() of the workspace (src/lib/brand-rules.ts): at least 4.5 to 1 on white,
  // so white initials read on it too.
  accent: string;
  title: string;
  intro: string | null;
  fields: RespondentFieldSpec[];
  // The first chapter's name for the Start label; null while the list has no areas.
  firstChapter: string | null;
  preview?: boolean;
  // h1 on its own page; a lower level inside the Build page, which has its own h1 (E5-6
  // moves the preview into an iframe, its own document).
  heading?: "h1" | "h4";
  // The part the Build step rings in the preview (stories/E5-6, acceptance 2).
  ring?: "fields";
  onStart?: (values: ResponseFields) => void;
  className?: string;
};

const FIELD = "h-12 w-full rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] text-ink outline-none transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function AboutYou({ workspaceName, accent, title, intro, fields, firstChapter, preview = false, heading: Heading = "h1", ring, onStart, className }: AboutYouProps) {
  const [values, setValues] = useState<ResponseFields>({});
  const prefix = useId();
  const missing = missingMandatory(fields, values);
  const disabled = missing.length > 0;
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));
  return (
    <div className={cn("flex min-h-full flex-col bg-ground text-ink", className)} data-testid="about-you" data-preview={preview || undefined}>
      {preview && <div className="bg-sun-soft px-5 py-1.5 text-center text-xs font-semibold text-sun-text">{ABOUT_YOU_COPY.previewNote}</div>}
      <header className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white" style={{ background: accent }}>{initials(workspaceName)}</span>
        <span className="grow text-[15px] font-bold">{workspaceName}</span>
      </header>
      <div className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
        <div className="flex flex-col gap-1">
          <Heading className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{title}</Heading>
          {intro && <p className="text-sm leading-5 text-ink-muted" data-testid="about-you-intro">{intro}</p>}
        </div>
        <div className={cn("flex flex-col gap-3.5", ring === "fields" && "rounded-xl ring-2 ring-violet ring-offset-8 ring-offset-ground")} data-testid="about-you-fields">
          {fields.map((f) => {
            const id = `${prefix}-${f.key}`;
            const label = f.mandatory ? f.label : `${f.label} (${ABOUT_YOU_COPY.optional})`;
            return (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-sm font-semibold">{label}</label>
                {f.type === "dropdown" ? (
                  <select id={id} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} aria-required={f.mandatory || undefined} className={FIELD} data-field={f.key}>
                    <option value="">{ABOUT_YOU_COPY.choose}</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input id={id} type={f.type === "email" ? "email" : "text"} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} autoComplete={f.key === "name" ? "name" : f.type === "email" ? "email" : "off"} aria-required={f.mandatory || undefined} className={FIELD} data-field={f.key} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-ink-muted">{ABOUT_YOU_COPY.footer(workspaceName)}</p>
        <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-hairline bg-surface px-5 pt-3 pb-4">
        <button type="button" disabled={disabled} aria-describedby={`${prefix}-hint`} onClick={() => { if (!disabled && !preview) onStart?.(values); }} className="h-12 rounded-full bg-ink px-6 text-base font-bold text-ground transition-opacity disabled:opacity-40" data-testid="about-you-start">
          {firstChapter ? ABOUT_YOU_COPY.startWith(firstChapter) : ABOUT_YOU_COPY.start}
        </button>
        <div id={`${prefix}-hint`} aria-live="polite" className="min-h-5 text-sm text-ink-muted" data-testid="about-you-hint">{disabled ? startHint(fields) : ""}</div>
      </div>
    </div>
  );
}
