"use client";
// The preview panel of Build (stories/E5-1 to E5-3; the shell of design note 13, filled
// in by E5-6): "Preview", the Phone pill, the caption, a screen switch between the About
// you page, the items and the Wrap up (stories/E5-5: the Closing card opens it when it
// takes focus, through the PreviewScreen context), and the 390 px frame. The About you screen rings the fields; the
// items screen rings the chapter row and the rating rows (decision 0021: Build rings what
// it changes); the Wrap up rings the parts the Closing card changes. The items screen follows the layout (decision 0016): chapters shows the
// first area's cards under the chapter row; one item per screen shows one card with "Item
// 1 of N in [AREA]"; the single page lists every area in order with no chapter row and
// "All N on one page". The chapter row shows About you, every area (the first active) and
// Wrap up, fading at the right edge when it is longer than the frame (the board's mask);
// it is a picture, not navigation (free movement is E7-4's). The screen choice lives in
// the PreviewScreen context, keyed on the instrument by the page, so a save of any card keeps the screen;
// the About you page re-mounts on its own key and the cards on theirs (the layout in the
// key), which clears the field values typed in the preview (nothing is stored there); the
// perspective picks live here and survive a save of the names. At most
// PREVIEW_CARDS are drawn across the areas (a set can hold 2,000 rows); each area with
// fewer cards drawn than it holds says so under them. The perspectives picked on the About
// you screen narrow the items screen to what that respondent would see (stories/E5-4): the
// counts over every row (tags carries one entry per row), the cards from the candidates the
// page sent (by position in the chapter), a chapter emptied by the picks dropped from the
// row and the Start label, and the "nothing to rate" screen when the picks leave no item.
import { useState } from "react";
import { cn } from "cn";
import { isVisible } from "@/lib/perspectives";
import { AboutYou, type AboutYouProps } from "@/components/respondent/about-you";
import { ItemCard, type ItemCardProps } from "@/components/respondent/item-card";
import { WrapUp, type WrapUpProps } from "@/components/respondent/wrap-up";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Layout } from "@/db/types";
import { BUILD_COPY, PREVIEW_CARDS } from "@/lib/build-copy";
import { CLOSING_COPY } from "@/lib/closing";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { usePreviewScreen } from "./preview-screen";

export type PreviewCard = Omit<ItemCardProps, "ring"> & { perspectives: string[] };
export type PreviewChapter = { name: string | null; tags: string[][]; cards: { index: number; card: PreviewCard }[] };

const cardKey = (card: Omit<ItemCardProps, "ring">, i: number, layout: Layout) => `${i}-${layout}-${card.method}-${card.showProposed}-${JSON.stringify(card.labels)}`;

export function PreviewPanel({ about, chapters: allChapters, layout, perspectives, wrap }: { about: Omit<AboutYouProps, "preview" | "heading" | "ring" | "perspectives" | "picked" | "onPickPerspectives" | "firstChapter">; chapters: PreviewChapter[]; layout: Layout; perspectives: string[]; wrap: Pick<WrapUpProps, "closing" | "method" | "labels" | "showProposed"> }) {
  const { screen, setScreen } = usePreviewScreen();
  const [picked, setPicked] = useState<string[]>([]);
  // What this respondent would see: every chapter with a visible item (or none at all), its
  // visible count, and the first PREVIEW_CARDS visible cards across the chapters.
  const chapters = allChapters.reduce<{ left: number; out: { name: string | null; count: number; cards: PreviewCard[] }[] }>((acc, c) => {
    const visible = c.tags.flatMap((t, i) => (isVisible({ perspectives: t }, picked) ? [i] : []));
    if (visible.length === 0 && c.tags.length > 0) return acc;
    const byIndex = new Map(c.cards.map(({ index, card }) => [index, card]));
    const cards = visible.slice(0, acc.left).flatMap((i) => { const card = byIndex.get(i); return card ? [card] : []; });
    return { left: acc.left - cards.length, out: [...acc.out, { name: c.name, count: visible.length, cards }] };
  }, { left: PREVIEW_CARDS, out: [] }).out;
  const total = chapters.reduce((n, c) => n + c.count, 0);
  const nothingVisible = total === 0 && allChapters.some((c) => c.tags.length > 0);
  const first = chapters[0] ?? { name: null, count: 0, cards: [] };
  const firstChapter = chapters[0]?.name ?? null;
  return (
    <aside className="flex w-[460px] shrink-0 flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4" aria-labelledby="preview-title" data-testid="preview-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 id="preview-title" className="text-[15px] font-bold">{BUILD_COPY.preview}</h3>
        <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-ink-muted">{BUILD_COPY.previewDevice}</span>
      </div>
      <p className="flex items-center gap-2 text-[13px] text-ink-muted"><span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-sm bg-violet" />{screen === "wrapup" ? BUILD_COPY.previewCaptionWrapUp : BUILD_COPY.previewCaption}</p>
      <SegmentedControl value={screen} onChange={setScreen} label={BUILD_COPY.previewScreenSwitch} options={[{ value: "about", label: BUILD_COPY.previewScreens.about }, { value: "items", label: BUILD_COPY.previewScreens.items }, { value: "wrapup", label: CLOSING_COPY.previewScreen }]} className="self-start" />
      <div className="mx-auto h-[720px] w-[390px] overflow-x-hidden overflow-y-auto rounded-[28px] border border-hairline-strong bg-ground" data-testid="preview-frame">
        {screen === "wrapup" ? (
          <WrapUp key={JSON.stringify(wrap.closing)} workspaceName={about.workspaceName} accent={about.accent} {...wrap} chapters={chapters.flatMap((c) => (c.name ? [c.name] : []))} total={total} preview heading="h4" ring />
        ) : screen === "about" ? (
          <AboutYou key={`${JSON.stringify(about.fields)}-${about.intro}-${about.title}-${perspectives.join("|")}`} {...about} firstChapter={firstChapter} perspectives={perspectives} picked={picked} onPickPerspectives={setPicked} preview heading="h4" ring="fields" />
        ) : (
          <div className="flex min-h-full flex-col bg-ground text-ink" data-testid="chapter-preview" data-layout={layout}>
            <div className="flex items-center gap-2.5 border-b border-hairline bg-surface px-5 pt-4 pb-3">
              <span className="grow text-[15px] font-bold">{about.workspaceName}</span>
              <span className="font-mono text-xs text-ink-muted">{BUILD_COPY.previewProgress(0, total)}</span>
            </div>
            <div className="flex flex-col gap-3 px-5 pt-3.5 pb-5">
              {nothingVisible ? (
                <p className="text-sm text-ink-muted" data-testid="nothing-visible">{PERSPECTIVES_COPY.nothingVisible}</p>
              ) : (
              <>
              {layout !== "page" && (
                <div className="flex gap-1.5 overflow-hidden rounded-full ring-2 ring-violet ring-offset-4 ring-offset-ground [mask-image:linear-gradient(90deg,#000_82%,transparent)]" data-testid="chapter-row">
                  <span className="h-[30px] shrink-0 rounded-full border border-hairline-strong px-3 text-xs leading-[28px] font-semibold text-ink-muted">{BUILD_COPY.previewScreens.about}</span>
                  {chapters.map((c, i) => c.name && <span key={c.name} className={cn("h-[30px] shrink-0 rounded-full px-3 text-xs leading-[30px] font-semibold whitespace-nowrap", i === 0 ? "bg-violet-soft text-violet-text" : "border border-hairline-strong leading-[28px] text-ink-muted")}>{c.name}</span>)}
                  <span className="h-[30px] shrink-0 rounded-full border border-hairline-strong px-3 text-xs leading-[28px] font-semibold text-ink-muted">{BUILD_COPY.previewWrapUp}</span>
                </div>
              )}
              {layout === "page" ? (
                <>
                  <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewAllOnOne(total)}</p>
                  {chapters.map((c) => (
                    <section key={c.name ?? "all"} className="flex flex-col gap-3">
                      <h4 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{c.name ?? about.title} <span className="text-sm font-medium text-ink-muted">{BUILD_COPY.previewItems(c.count)}</span></h4>
                      {c.count === 0 && <p className="text-sm text-ink-muted">{BUILD_COPY.previewEmptyChapter}</p>}
                      {c.cards.map((card, i) => <ItemCard key={cardKey(card, i, layout)} {...card} ring />)}
                      {c.count > c.cards.length && <p className="text-[13px] text-ink-muted">{BUILD_COPY.previewMore(c.cards.length, c.count)}</p>}
                    </section>
                  ))}
                </>
              ) : (
                <>
                  <h4 className="text-[22px] leading-7 font-extrabold tracking-[-0.025em]">{first.name ?? about.title} <span className="text-sm font-medium text-ink-muted">{BUILD_COPY.previewItems(first.count)}</span></h4>
                  {first.count === 0 && <p className="text-sm text-ink-muted">{BUILD_COPY.previewEmptyChapter}</p>}
                  {layout === "item" && first.count > 0 && <p className="text-sm text-ink-muted" data-testid="layout-note">{BUILD_COPY.previewItemOf(1, first.count, first.name ?? about.title)}</p>}
                  {(layout === "item" ? first.cards.slice(0, 1) : first.cards).map((card, i) => <ItemCard key={cardKey(card, i, layout)} {...card} ring />)}
                  {layout === "chapters" && first.count > first.cards.length && <p className="text-[13px] text-ink-muted">{BUILD_COPY.previewMore(first.cards.length, first.count)}</p>}
                </>
              )}
              </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
