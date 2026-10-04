"use client";
// The About you page of the respondent instrument (stories/E5-1, acceptance 3; the respondent
// board, note 12; E7-1 renders it at /r/[token]). The PM's name and initials in the header,
// the title and the intro, the fields the PM configured (a dropdown is a native select at
// 48 px, E7-1 acceptance 2), Start disabled at 40 percent until every required field is
// filled, with the hint under it (aria-describedby on Start, aria-required on the fields;
// the wording by decision 0043), the perspectives question as checkboxes when the
// instrument has perspectives (stories/E5-4), and the footer. One component for the Build preview and
// the real page, so the two cannot drift (stories/E5-6, acceptance 3). In preview mode the
// header says nothing is saved and Start does nothing (E5-6, acceptance 4). Phone first:
// the column is the screen width; on desktop E7-1 puts it in the 560 px column, where the
// fields are 360 px and Start is 280 px, left-aligned (docs/design-system.md, Respondent
// columns). The widths follow the component's own width, not the window's (a container
// query: tailwindcss.com/docs/responsive-design, container queries; @lg is 32rem), so the
// Build preview's 390 px frame keeps the phone layout on a desktop screen.
import { useId, useState } from "react";
import { cn } from "cn";
import { Mark } from "@/components/brand/mark";
import { RespondentHeader } from "./respondent-header";
import type { RespondentFieldSpec, ResponseFields } from "@/db/types";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { missingMandatory, startHint } from "@/lib/respondent-fields";

export type AboutYouProps = {
  workspaceName: string;
  // The workspace's logo (E7-1, acceptance 1); the initials when there is none.
  logoUrl?: string | null;
  // The header's note, "Closes [DATE]" on a live link (stories/E6-1, acceptance 5; E7-1).
  headerNote?: string | null;
  // effectiveAccent() of the workspace (src/lib/brand-rules.ts): at least 4.5 to 1 on white,
  // so white initials read on it too.
  accent: string;
  title: string;
  intro: string | null;
  fields: RespondentFieldSpec[];
  // The values a personal link carries (stories/E6-2, acceptance 3), keyed by configured
  // fields only (the page filters them): a field with one is not asked; the About you page
  // says who is answering instead.
  prefilled?: ResponseFields;
  // The values and picks saved on this device's response (E7-1: About you again after Start).
  initialValues?: ResponseFields;
  initialPicks?: string[];
  // Start's state on the real page: the request in flight, and the sentence when it failed.
  starting?: boolean;
  startError?: string | null;
  // The first chapter's name for the Start label; null while the list has no areas.
  firstChapter: string | null;
  // The perspectives to pick from (stories/E5-4); none means the question is not asked.
  // Controlled from the preview panel, which filters the items by the picks.
  perspectives?: string[];
  picked?: string[];
  onPickPerspectives?: (picked: string[]) => void;
  preview?: boolean;
  // h1 on its own page; a lower level inside the Build page, which has its own h1 (E5-6
  // moves the preview into an iframe, its own document).
  heading?: "h1" | "h4";
  // The part the Build step rings in the preview (stories/E5-6, acceptance 2).
  ring?: "fields";
  onStart?: (values: ResponseFields, picks: string[]) => void;
  // The live page after Start (E7-4): the chapter row and the bar under the header.
  nav?: React.ReactNode;
  className?: string;
};

const FIELD = "h-12 w-full @lg:w-[360px] rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] text-ink outline-none transition-colors focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground";

export function AboutYou({ workspaceName, logoUrl = null, headerNote = null, accent, title, intro, fields, prefilled, initialValues, initialPicks, starting = false, startError = null, firstChapter, perspectives = [], picked, onPickPerspectives, preview = false, heading: Heading = "h1", ring, onStart, nav, className }: AboutYouProps) {
  const [values, setValues] = useState<ResponseFields>({ ...(initialValues ?? {}), ...(prefilled ?? {}) });
  const asked = fields.filter((f) => !prefilled?.[f.key]);
  const filled = fields.flatMap((f) => (prefilled?.[f.key] ? [prefilled[f.key]] : []));
  const [ownPicks, setOwnPicks] = useState<string[]>(initialPicks ?? []);
  const picks = picked ?? ownPicks;
  const togglePick = (name: string) => {
    const next = picks.includes(name) ? picks.filter((p) => p !== name) : [...picks, name];
    setOwnPicks(next);
    onPickPerspectives?.(next);
  };
  const prefix = useId();
  const missing = missingMandatory(fields, values);
  const disabled = missing.length > 0;
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));
  return (
    <div className={cn("@container flex min-h-full flex-col bg-ground text-ink", className)} data-testid="about-you" data-preview={preview || undefined}>
      {preview && <div className="bg-sun-soft px-5 py-1.5 text-center text-xs font-semibold text-sun-text">{ABOUT_YOU_COPY.previewNote}</div>}
      <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={headerNote} noteTestId="about-you-note" />
      {nav}
      <div className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
        <div className="flex flex-col gap-1">
          <Heading className="text-[22px] leading-7 font-extrabold tracking-[-0.025em] outline-hidden" tabIndex={Heading === "h1" ? -1 : undefined} data-screen-heading={Heading === "h1" || undefined}>{title}</Heading>
          {intro && <p className="text-sm leading-5 text-ink-muted" data-testid="about-you-intro">{intro}</p>}
        </div>
        <div className={cn("flex flex-col gap-3.5", ring === "fields" && "rounded-xl ring-2 ring-violet ring-offset-8 ring-offset-ground")} data-testid="about-you-fields">
          {filled.length > 0 && (
            <div className="flex flex-col gap-0.5 text-sm" data-testid="answering-as">
              <span className="font-semibold">{ABOUT_YOU_COPY.answeringAs(filled.join(", "))}</span>
              <span className="text-ink-muted">{ABOUT_YOU_COPY.answeringAsNote}</span>
            </div>
          )}
          {asked.map((f) => {
            // "field-" keeps a field's slug apart from the perspective ids (p-0...) and the hints.
            const id = `${prefix}-field-${f.key}`;
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
        {perspectives.length > 0 && (
          <fieldset className="flex flex-col gap-2" aria-describedby={`${prefix}-p-hint`} data-testid="about-you-perspectives">
            <legend className="float-left mb-1 w-full text-sm font-semibold">{ABOUT_YOU_COPY.perspectivesQuestion}</legend>
            <div id={`${prefix}-p-hint`} className="clear-both text-[13px] text-ink-muted">{ABOUT_YOU_COPY.perspectivesHint}</div>
            {perspectives.map((name, i) => {
              // The id from the position: a name's characters (any script) do not make one.
              const id = `${prefix}-p-${i}`;
              return (
                <label key={name} htmlFor={id} className="flex min-h-12 items-center gap-3 rounded-xl border border-hairline-strong bg-surface px-4 text-[17px] has-[:checked]:border-violet has-[:checked]:bg-violet-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ground">
                  <input id={id} type="checkbox" checked={picks.includes(name)} onChange={() => togglePick(name)} className="size-5 shrink-0 accent-[var(--violet)]" />
                  <span>{name}</span>
                </label>
              );
            })}
          </fieldset>
        )}
        <p className="text-sm text-ink-muted">{ABOUT_YOU_COPY.footer(workspaceName)}</p>
        <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-hairline bg-surface px-5 pt-3 pb-4">
        <button type="button" disabled={disabled || starting} aria-busy={starting || undefined} aria-describedby={`${prefix}-hint`} onClick={() => { if (!disabled && !preview && !starting) onStart?.(values, picks); }} className="h-12 rounded-full bg-ink px-6 text-base font-bold text-ground transition-opacity disabled:opacity-40 @lg:w-[280px] @lg:self-start" data-testid="about-you-start">
          {firstChapter ? ABOUT_YOU_COPY.startWith(firstChapter) : ABOUT_YOU_COPY.start}
        </button>
        <div id={`${prefix}-hint`} aria-live="polite" className={cn("min-h-5 text-sm", startError && !disabled ? "text-danger" : "text-ink-muted")} data-testid="about-you-hint">{disabled ? startHint(fields) : (startError ?? "")}</div>
      </div>
    </div>
  );
}
