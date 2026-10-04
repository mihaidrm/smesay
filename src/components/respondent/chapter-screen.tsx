"use client";
// A chapter of the respondent instrument (stories/E7-1, acceptance 1; E7-2, acceptance 1
// and 4; E7-4 adds the chapter row, the progress bar and Continue): the header, the
// chapter's name as the title with its one-line intro (the area's rationale from Shape),
// and its cards in the instrument's layout (E5-3, decision 0016): chapters, the area's
// cards one column on a phone and two from the desktop width (docs/design-system.md,
// Respondent columns: 1000 px); one item per screen, one card with "Item [N] of [M] in
// [AREA]" and Previous and Next item; the single page, every area in order with its
// heading and "All [N] on one page". Phone first.
import { Mark } from "@/components/brand/mark";
import type { Layout, ScaleLabels, ScoringMethod } from "@/db/types";
import { ABOUT_YOU_COPY, BUILD_COPY } from "@/lib/build-copy";
import { RESPONDENT_COPY, type Chapter, type RespondentItem } from "@/lib/respondent-rules";
import { ItemCard, type CardDraft, EMPTY_DRAFT } from "./item-card";
import { RespondentHeader } from "./respondent-header";

export type ChapterScreenProps = {
  workspaceName: string;
  accent: string;
  logoUrl: string | null;
  headerNote: React.ReactNode;
  title: string;
  layout: Layout;
  chapters: Chapter[];
  index: number;
  item: number;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  showProposed: boolean;
  drafts: Record<string, CardDraft>;
  saved: Record<string, boolean>;
  errors?: Record<string, string>;
  // Answers cannot reach the server (E7-3): complete cards not yet saved say so.
  unsaved?: boolean;
  onChange: (itemId: string, draft: CardDraft) => void;
  onItem: (item: number) => void;
  onBack: () => void;
  banner?: React.ReactNode;
};

const BUTTON = "h-12 rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40";

export function ChapterScreen(props: ChapterScreenProps) {
  const { workspaceName, accent, logoUrl, headerNote, title, layout, chapters, index, item, method, labels, showProposed, drafts, saved, errors = {}, unsaved = false, onChange, onItem, onBack, banner } = props;
  const chapter = chapters[index];
  const card = (it: RespondentItem) => (
    <ItemCard key={it.id} idKey={it.id} reference={it.reference} title={it.title} details={it.details} method={method} labels={labels} proposed={it.proposed} showProposed={showProposed} accent={accent} draft={drafts[it.id] ?? EMPTY_DRAFT} saved={saved[it.id] ?? false} unsaved={unsaved} error={errors[it.id] ?? null} onChange={(d) => onChange(it.id, d)} />
  );
  const total = chapters.reduce((n, c) => n + c.items.length, 0);
  const at = Math.min(Math.max(item, 0), Math.max(chapter.items.length - 1, 0));
  return (
    <div className="flex min-h-screen flex-col bg-ground text-ink" data-testid="chapter-screen" data-layout={layout}>
      <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={headerNote} />
      {banner}
      <main className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
        {layout === "page" ? (
          <>
            <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewAllOnOne(total)}</p>
            {chapters.map((c, n) => (
              <section key={c.name ?? "all"} className="flex flex-col gap-3" aria-labelledby={`chapter-heading-${n}`}>
                <div className="flex flex-col gap-1">
                  <h2 id={`chapter-heading-${n}`} className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{c.name ?? title}</h2>
                  {c.intro && <p className="text-sm leading-5 text-ink-muted">{c.intro}</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="chapter-cards">{c.items.map(card)}</div>
              </section>
            ))}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]" data-testid="chapter-title">{chapter.name ?? title}</h1>
              {chapter.intro && <p className="text-sm leading-5 text-ink-muted">{chapter.intro}</p>}
            </div>
            {layout === "item" ? (
              <>
                <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewItemOf(at + 1, chapter.items.length, chapter.name ?? title)}</p>
                <div className="grid grid-cols-1 gap-3 md:max-w-[488px]" data-testid="chapter-cards">{card(chapter.items[at])}</div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => onItem(at - 1)} disabled={at === 0} className={BUTTON} data-testid="previous-item">{RESPONDENT_COPY.previousItem}</button>
                  <button type="button" onClick={() => onItem(at + 1)} disabled={at >= chapter.items.length - 1} className={BUTTON} data-testid="next-item">{RESPONDENT_COPY.nextItem}</button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="chapter-cards">{chapter.items.map(card)}</div>
            )}
          </>
        )}
        <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-ink-muted">{ABOUT_YOU_COPY.poweredBy} <Mark size={16} /> <span className="font-bold text-ink">SMEsay</span></div>
      </main>
      <footer className="flex shrink-0 items-center gap-3 border-t border-hairline bg-surface px-5 pt-3 pb-4">
        <button type="button" onClick={onBack} className={BUTTON} data-testid="chapter-back">{RESPONDENT_COPY.back}</button>
      </footer>
    </div>
  );
}
