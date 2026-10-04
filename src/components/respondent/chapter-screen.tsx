"use client";
// A chapter of the respondent instrument (stories/E7-1, acceptance 1: Start lands here;
// E7-2 makes the cards answer and save; E7-4 adds the chapter row, the progress bar and the
// footer's Continue): the header, the chapter's name as the title with its one-line intro
// (the area's rationale from Shape), and its cards, one column on a phone and two from the
// desktop width (docs/design-system.md, Respondent columns: 1000 px). Phone first.
import { Mark } from "@/components/brand/mark";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";
import { RESPONDENT_COPY, type Chapter } from "@/lib/respondent-rules";
import { ItemCard } from "./item-card";
import { RespondentHeader } from "./respondent-header";

export type ChapterScreenProps = {
  workspaceName: string;
  accent: string;
  logoUrl: string | null;
  headerNote: string | null;
  title: string;
  chapter: Chapter;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  showProposed: boolean;
  onBack: () => void;
};

export function ChapterScreen({ workspaceName, accent, logoUrl, headerNote, title, chapter, method, labels, showProposed, onBack }: ChapterScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink" data-testid="chapter-screen">
      <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={headerNote} />
      <main className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]" data-testid="chapter-title">{chapter.name ?? title}</h1>
          {chapter.intro && <p className="text-sm leading-5 text-ink-muted">{chapter.intro}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="chapter-cards">
          {chapter.items.map((it) => (
            <ItemCard key={it.id} reference={it.reference} title={it.title} details={it.details} method={method} labels={labels} proposed={it.proposed} showProposed={showProposed} accent={accent} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>
      </main>
      <footer className="flex shrink-0 items-center gap-3 border-t border-hairline bg-surface px-5 pt-3 pb-4">
        <button type="button" onClick={onBack} className="h-12 rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="chapter-back">{RESPONDENT_COPY.back}</button>
      </footer>
    </div>
  );
}
