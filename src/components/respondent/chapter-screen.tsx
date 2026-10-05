"use client";
// A chapter of the respondent instrument (stories/E7-1, acceptance 1; E7-2, acceptance 1
// and 4; E7-4 adds the chapter row, the progress bar and Continue): the header, the
// chapter's name as the title with its one-line intro (the area's rationale from Shape),
// and its cards in the instrument's layout (E5-3, decision 0016): chapters, the area's
// cards one column on a phone and two from the desktop width (docs/design-system.md,
// Respondent columns: 1000 px); one item per screen, one card with "Item [N] of [M] in
// [AREA]" and Previous and Next item; the single page, every area in order with its
// heading and "All [N] on one page". Phone first. E7-4: the chapter row and the bar under
// the header (`nav`), and the footer with Back, "Continue to [NEXT AREA]" or "Continue to
// Wrap up" (never blocked) and the note "[N] of [M] still to rate here. You can come back
// later." or "All [M] rated in this chapter." The frame of ./frame.ts (decisions 0051 and 0052): from a
// 576 px column the screen is a centered card, its cards on the ground inside it, the
// footer's buttons centered with the note under them (under them on a phone too, as Start's
// hint, and Continue is described by it), and "Powered by" under the card.
import { useEffect, useId, useRef } from "react";
import { cn } from "cn";
import { PoweredBy, type PoweredByShow } from "./powered-by";
import type { Layout, ReasonRule, ScaleLabels, ScoringMethod } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { RESPONDENT_COPY, type Chapter, type RespondentItem } from "@/lib/respondent-rules";
import { ItemCard, type CardDraft, EMPTY_DRAFT } from "./item-card";
import { RespondentHeader } from "./respondent-header";
import { FRAME_ACTIONS, FRAME_CARD, FRAME_HEADER, FRAME_OUTER, FRAME_POWERED, FRAME_PRIMARY } from "./frame";

export type ChapterScreenProps = {
  // The way the respondent arrived, for the slide in (design note 99); null on the first screen.
  slide?: "next" | "prev" | null;
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
  // When a card needs its text written to count (E5-2, acceptance 6; design note 98).
  reasonRule: ReasonRule;
  drafts: Record<string, CardDraft>;
  saved: Record<string, boolean>;
  // What a saved card says, when not "Saved" (the visitors' sample: "Saved on this device").
  savedLabel?: string;
  errors?: Record<string, string>;
  // Answers cannot reach the server (E7-3): complete cards not yet saved say so.
  unsaved?: boolean;
  onChange: (itemId: string, draft: CardDraft) => void;
  onItem: (item: number) => void;
  onBack: () => void;
  banner?: React.ReactNode;
  nav?: React.ReactNode;
  // The builder's preview (stories/E5-6): the parts of the cards its step rings.
  rings?: { rating?: boolean; card?: boolean; wording?: boolean };
  continueLabel: string;
  footerNote: string;
  onContinue: () => void;
  poweredBy?: PoweredByShow;
};

const BUTTON = "h-12 rounded-full border border-hairline-strong bg-surface px-6 text-base font-semibold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40";
// Previous and Next item sit on the ground, not the footer: their ring offset is the ground.
const ON_GROUND = "focus-visible:ring-offset-ground";

export function ChapterScreen(props: ChapterScreenProps) {
  const { slide = null, workspaceName, accent, logoUrl, headerNote, title, layout, chapters, index, item, method, labels, showProposed, reasonRule, drafts, saved, savedLabel, errors = {}, unsaved = false, onChange, onItem, onBack, banner, nav, continueLabel, footerNote, onContinue, poweredBy = true, rings = {} } = props;
  const chapter = chapters[index];
  const noteId = useId();
  const card = (it: RespondentItem) => (
    <ItemCard key={it.id} idKey={it.id} reference={it.reference} title={it.title} details={it.details} method={method} labels={labels} proposed={it.proposed} showProposed={showProposed} reasonRule={reasonRule} accent={accent} draft={drafts[it.id] ?? EMPTY_DRAFT} saved={saved[it.id] ?? false} savedLabel={savedLabel} unsaved={unsaved} error={errors[it.id] ?? null} onChange={(d) => onChange(it.id, d)} ring={rings.rating} ringCard={rings.card} ringWording={rings.wording} />
  );
  const total = chapters.reduce((n, c) => n + c.items.length, 0);
  const at = Math.min(Math.max(item, 0), Math.max(chapter.items.length - 1, 0));
  // Previous and Next item sit in the content that remounts for the slide (design note 99), so
  // the pressed button is gone after the move; the new one of the same name takes the focus,
  // or the other when the end of the chapter disabled it (WCAG 2.4.3, focus order).
  const moved = useRef<"previous-item" | "next-item" | null>(null);
  useEffect(() => {
    const which = moved.current;
    moved.current = null;
    if (!which) return;
    const pick = (id: string) => document.querySelector<HTMLButtonElement>(`[data-testid="${id}"]:not(:disabled)`);
    (pick(which) ?? pick(which === "next-item" ? "previous-item" : "next-item"))?.focus();
  }, [at]);
  return (
    <div className={FRAME_OUTER} data-testid="chapter-screen" data-layout={layout}>
      <div className={FRAME_CARD}>
      <RespondentHeader workspaceName={workspaceName} accent={accent} logoUrl={logoUrl} note={headerNote} className={FRAME_HEADER} />
      {nav}
      {banner}
      <main className="flex grow flex-col gap-4 overflow-x-clip bg-ground px-5 pt-4 pb-5 @xl:px-8 @xl:pt-6 @xl:pb-8">
        {/* A new chapter, or a new item on the one-item layout, mounts its content afresh, so the
            slide plays on it and on nothing else (design note 99). The main clips the 24 px of
            the slide; long words in the titles wrap, so the clip never hides text. */}
        <div key={layout === "page" ? "page" : `${index}-${layout === "item" ? at : 0}`} className="flex grow flex-col gap-4" data-slide={slide ?? undefined}>
        {layout === "page" ? (
          <>
            <h1 className="sr-only" tabIndex={-1} data-screen-heading>{title}</h1>
            <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewAllOnOne(total)}</p>
            {chapters.map((c, n) => (
              <section key={c.name ?? "all"} className="flex flex-col gap-3" aria-labelledby={`chapter-heading-${n}`}>
                <div className="flex flex-col gap-1">
                  <h2 id={`chapter-heading-${n}`} className="text-[22px] leading-7 font-extrabold tracking-[-0.025em] wrap-break-word">{c.name ?? title}</h2>
                  {c.intro && <p className="text-sm leading-5 wrap-break-word text-ink-muted">{c.intro}</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="chapter-cards">{c.items.map(card)}</div>
              </section>
            ))}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em] wrap-break-word focus:outline-hidden" tabIndex={-1} data-screen-heading data-testid="chapter-title">{chapter.name ?? title}</h1>
              {chapter.intro && <p className="text-sm leading-5 wrap-break-word text-ink-muted">{chapter.intro}</p>}
            </div>
            {layout === "item" ? (
              <>
                <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewItemOf(at + 1, chapter.items.length, chapter.name ?? title)}</p>
                <div className="grid grid-cols-1 gap-3 md:max-w-[488px]" data-testid="chapter-cards">{card(chapter.items[at])}</div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { moved.current = "previous-item"; onItem(at - 1); }} disabled={at === 0} className={cn(BUTTON, ON_GROUND)} data-testid="previous-item">{RESPONDENT_COPY.previousItem}</button>
                  <button type="button" onClick={() => { moved.current = "next-item"; onItem(at + 1); }} disabled={at >= chapter.items.length - 1} className={cn(BUTTON, ON_GROUND)} data-testid="next-item">{RESPONDENT_COPY.nextItem}</button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="chapter-cards">{chapter.items.map(card)}</div>
            )}
          </>
        )}
        </div>
      </main>
      <footer className={FRAME_ACTIONS}>
        <div className="flex items-center gap-3 @xl:justify-center">
          <button type="button" onClick={onBack} className={BUTTON} data-testid="chapter-back">{RESPONDENT_COPY.back}</button>
          <button type="button" onClick={onContinue} aria-describedby={noteId} className={cn("h-12 min-w-0 grow truncate rounded-full bg-ink px-6 text-base font-bold text-ground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface @xl:grow-0", FRAME_PRIMARY)} data-testid="chapter-continue">{continueLabel}</button>
        </div>
        <p id={noteId} className="text-sm text-ink-muted @xl:text-center" aria-live="polite" data-testid="chapter-note">{footerNote}</p>
      </footer>
      </div>
      <PoweredBy show={poweredBy} className={FRAME_POWERED} />
    </div>
  );
}
