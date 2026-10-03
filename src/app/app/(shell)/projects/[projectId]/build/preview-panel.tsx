"use client";
// The preview panel of Build (stories/E5-1 and E5-2; the shell of design note 13, filled
// in by E5-6): "Preview", the Phone pill, the caption, a screen switch between the About
// you page and the first chapter's cards, and the 390 px frame. The About you screen rings
// the fields, the Items screen rings the rating rows (decision 0021: Build rings what it
// changes). The screen choice lives in this component, keyed on the instrument alone, so a
// save of any card keeps the screen; the About you page re-mounts on its own key and the
// cards on theirs, which clears a pick made in the preview (nothing is stored there). At
// most ten cards are drawn (a set can hold 2,000 rows); the line under them says so.
import { useState } from "react";
import { AboutYou, type AboutYouProps } from "@/components/respondent/about-you";
import { ItemCard, type ItemCardProps } from "@/components/respondent/item-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BUILD_COPY } from "@/lib/build-copy";

type Screen = "about" | "items";

export function PreviewPanel({ about, chapter, total }: { about: Omit<AboutYouProps, "preview" | "heading" | "ring">; chapter: { name: string | null; count: number; cards: Omit<ItemCardProps, "ring">[] }; total: number }) {
  const [screen, setScreen] = useState<Screen>("about");
  return (
    <aside className="flex w-[460px] shrink-0 flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4" aria-labelledby="preview-title" data-testid="preview-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 id="preview-title" className="text-[15px] font-bold">{BUILD_COPY.preview}</h3>
        <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-ink-muted">{BUILD_COPY.previewDevice}</span>
      </div>
      <p className="flex items-center gap-2 text-[13px] text-ink-muted"><span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-sm bg-violet" />{BUILD_COPY.previewCaption}</p>
      <SegmentedControl value={screen} onChange={setScreen} label={BUILD_COPY.previewScreenSwitch} options={[{ value: "about", label: BUILD_COPY.previewScreens.about }, { value: "items", label: BUILD_COPY.previewScreens.items }]} className="self-start" />
      <div className="mx-auto h-[720px] w-[390px] overflow-y-auto rounded-[28px] border border-hairline-strong bg-ground">
        {screen === "about" ? (
          <AboutYou key={`${JSON.stringify(about.fields)}-${about.intro}-${about.title}`} {...about} preview heading="h4" ring="fields" />
        ) : (
          <div className="flex min-h-full flex-col bg-ground text-ink" data-testid="chapter-preview">
            <div className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3">
              <span className="grow text-[15px] font-bold">{about.workspaceName}</span>
              <span className="font-mono text-xs text-ink-muted">{BUILD_COPY.previewProgress(0, total)}</span>
            </div>
            <div className="flex flex-col gap-3 px-5 pt-3.5 pb-5">
              <div className="flex gap-1.5 overflow-hidden">
                <span className="h-[30px] shrink-0 rounded-full border border-hairline-strong px-3 text-xs leading-[28px] font-semibold text-ink-muted">{BUILD_COPY.previewScreens.about}</span>
                {chapter.name && <span className="h-[30px] shrink-0 rounded-full bg-violet-soft px-3 text-xs leading-[30px] font-semibold text-violet-text">{chapter.name}</span>}
              </div>
              <h4 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{chapter.name ?? about.title} <span className="text-sm font-medium text-ink-muted">{BUILD_COPY.previewItems(chapter.count)}</span></h4>
              {chapter.count === 0 && <p className="text-sm text-ink-muted">{BUILD_COPY.previewEmptyChapter}</p>}
              {chapter.cards.map((card, i) => <ItemCard key={`${i}-${card.method}-${card.showProposed}-${JSON.stringify(card.labels)}`} {...card} ring />)}
              {chapter.count > chapter.cards.length && <p className="text-[13px] text-ink-muted">{BUILD_COPY.previewMore(chapter.cards.length, chapter.count)}</p>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
