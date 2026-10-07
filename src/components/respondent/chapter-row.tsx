"use client";
// The chapter row and the progress bar (stories/E7-4, acceptance 1 and 6; decision 0016;
// the respondent board, note 12): About you, each area with "[done]/[count]", Wrap up, every
// pill a link to its screen (?at=about, ?at=[N], ?at=wrap) that moves in the page without a
// reload; the active pill in the workspace's accent with white text (effectiveAccent(): the
// accent passes 4.5 to 1 on white), on dark lifted with the dark ink (ACCENT_FILL,
// src/lib/brand-rules.ts, E7-7), the others white with a
// hairline. A pill is 32 px high and takes a 48 px hit area (docs/design-system.md,
// Respondent tap targets; the row's 8 px padding keeps the hit area inside its scroll box);
// its count reads "[done] of [count] answered" to a screen reader. A click with a modifier
// key keeps the link's own behaviour (a new tab).
// The rows (design note 115; Mihai, 2026-10-07: "show the areas on 2 rows at the top if they
// are going off screen, and also add a scroll bar"): the pills sit on one row while it fits
// the card; once it would run off, the list takes the width of the wider half of the pills
// and wraps onto two rows, never more; when two rows are still wider than the card the row
// scrolls sideways, at every width, with the active pill brought into view and a thin
// scrollbar under the pills so the respondent sees there is more (scrollbar-width and
// scrollbar-color, both standard: developer.mozilla.org/docs/Web/CSS/scrollbar-width and
// developer.mozilla.org/docs/Web/CSS/scrollbar-color; Safari on iOS ignores both and shows
// its own overlay bar while scrolling); 12 px of bottom padding keeps the bar off the pills.
// The pill widths are measured before paint (useLayoutEffect runs before the browser
// paints, react.dev/reference/react/useLayoutEffect; it does nothing on the server, so the
// server sends one row) and again when the card's width changes (ResizeObserver,
// developer.mozilla.org/docs/Web/API/ResizeObserver). On two rows each pill's hit area
// reaches 3 px above and below it, so the hit areas of the rows meet in the 6 px gap and do
// not overlap; on one row it reaches 8 px. Under the row, a 4 px bar in the accent shows
// the items answered, a progressbar with its numbers
// (developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role).
// The counts are the server's as this page last heard them (an answer counts once the
// server holds it complete); an answer saved on another device shows on the next load
// (E7-4, built notes). The bar moves in 250 ms and the pills change colour in 150 ms, both
// still under reduced motion (docs/design-system.md, Motion). The single long page has no
// row (E5-3), only the bar.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";
import { ACCENT_BAR, ACCENT_FILL, accentVars } from "@/lib/brand-rules";
import { RESPONDENT_COPY, screenParam, type ChapterProgress, type Screen } from "@/lib/respondent-rules";

export type ChapterRowProps = {
  accent: string;
  chapters: { name: string }[];
  progress: ChapterProgress[];
  screen: Screen;
  showRow: boolean;
  onGo: (screen: Screen) => void;
  // While a Submit posts (E7-6) the pills do not move the page.
  locked?: boolean;
  // The builder's preview rings the row when its step changes it (stories/E5-6).
  ring?: boolean;
};

const PILL = "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 after:absolute after:inset-x-0 after:content-[''] text-[13px] font-semibold whitespace-nowrap focus:outline-hidden transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const GAP = 6;
const sum = (widths: number[]) => widths.reduce((a, b) => a + b, 0) + GAP * Math.max(0, widths.length - 1);
const sidePadding = (el: HTMLElement) => { const css = getComputedStyle(el); return parseFloat(css.paddingLeft) + parseFloat(css.paddingRight); };

// The list's width on two rows: null while every pill fits one row of `room` (the card's
// width inside the list's side padding); otherwise the wider of the two halves of the pills,
// which puts the first half on the first row and the rest on the second (a pill goes to the
// next row once the row is full, and the second half fits a row that wide), plus a pixel
// against rounding. Exported for the unit test.
export function twoRowWidth(widths: number[], room: number): number | null {
  if (widths.length < 2 || sum(widths) <= room) return null;
  const half = Math.ceil(widths.length / 2);
  return Math.ceil(Math.max(sum(widths.slice(0, half)), sum(widths.slice(half)))) + 1;
}

export function ChapterRow({ accent, chapters, progress, screen, showRow, onGo, locked = false, ring = false }: ChapterRowProps) {
  const active = useRef<HTMLAnchorElement | null>(null);
  const list = useRef<HTMLOListElement | null>(null);
  // The list's width on two rows, null while one row fits the card (design note 115).
  const [twoRows, setTwoRows] = useState<number | null>(null);
  const key = screenParam(screen);
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [key]);
  useLayoutEffect(() => {
    const ol = list.current;
    const box = ol?.parentElement;
    if (!ol || !box) return;
    // The list's width includes its side padding (border-box), so the padding is taken off
    // the room and put back on the width.
    const measure = () => {
      const pad = sidePadding(ol);
      const width = twoRowWidth(Array.from(ol.children, (li) => li.getBoundingClientRect().width), box.clientWidth - pad);
      setTwoRows(width === null ? null : width + pad);
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(box);
    return () => watch.disconnect();
  });
  const answered = progress.reduce((n, p) => n + p.done, 0);
  const total = progress.reduce((n, p) => n + p.count, 0);
  const pill = (target: Screen, label: React.ReactNode, testId: string, name?: string) => {
    const on = screenParam(target) === key;
    return (
      <li key={testId}>
        <a
          ref={on ? active : undefined}
          href={`?at=${screenParam(target)}`}
          aria-current={on ? "step" : undefined}
          aria-label={name}
          aria-disabled={locked || undefined}
          onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); if (!locked) onGo(target); }}
          className={cn(PILL, twoRows === null ? "after:-inset-y-2" : "after:-inset-y-[3px]", on ? cn("border-transparent", ACCENT_FILL) : cn("border-hairline-strong bg-surface text-ink-muted", !locked && "hover:text-ink"), locked && "cursor-default opacity-40")}
          style={on ? (accentVars(accent) as React.CSSProperties) : undefined}
          data-testid={testId}
        >{label}</a>
      </li>
    );
  };
  return (
    <div className="flex flex-col gap-0 border-b border-hairline bg-surface" data-testid="chapter-nav">
      {showRow && (
        <nav aria-label={RESPONDENT_COPY.chapters} className={cn("relative", ring && "m-1 rounded-4xl ring-2 ring-violet ring-offset-2 ring-offset-surface")} data-ring={ring || undefined}>
          <div className="overflow-x-auto [scrollbar-width:thin] [scrollbar-color:var(--hairline-strong)_transparent]">
            <ol ref={list} className="flex flex-wrap gap-1.5 px-5 pt-2 pb-3 @xl:px-8" style={twoRows === null ? undefined : { width: twoRows }} data-rows={twoRows === null ? 1 : 2} data-testid="chapter-row">
            {pill({ kind: "about" }, RESPONDENT_COPY.aboutYou, "row-about")}
            {chapters.map((c, i) => pill({ kind: "chapter", index: i }, <>{c.name}<span className="font-mono text-[11px] font-medium" aria-hidden="true">{progress[i]?.done ?? 0}/{progress[i]?.count ?? 0}</span></>, `row-chapter-${i + 1}`, `${c.name}, ${RESPONDENT_COPY.pillAnswered(progress[i]?.done ?? 0, progress[i]?.count ?? 0)}`))}
            {pill({ kind: "wrap" }, RESPONDENT_COPY.wrapUp, "row-wrap")}
            </ol>
          </div>
        </nav>
      )}
      <div role="progressbar" aria-label={RESPONDENT_COPY.answeredBar} aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-valuetext={RESPONDENT_COPY.barValue(answered, total)} className="h-1 w-full bg-hairline" data-testid="progress-bar">
        <div className={cn("h-1 transition-[width] duration-[250ms] motion-reduce:transition-none", ACCENT_BAR)} style={{ width: total ? `${(answered / total) * 100}%` : "0%", ...(accentVars(accent) as React.CSSProperties) }} />
      </div>
    </div>
  );
}
