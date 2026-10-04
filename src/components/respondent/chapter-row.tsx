"use client";
// The chapter row and the progress bar (stories/E7-4, acceptance 1 and 6; decision 0016;
// the respondent board, note 12): About you, each area with "[done]/[count]", Wrap up, every
// pill a link to its screen (?at=about, ?at=[N], ?at=wrap) that moves in the page without a
// reload; the active pill in the workspace's accent (effectiveAccent(), white text: the
// accent passes 4.5 to 1 on white, src/lib/brand-rules.ts), the others white with a
// hairline. A pill is 32 px high and takes a 48 px hit area (docs/design-system.md,
// Respondent tap targets; the row's 8 px padding keeps the hit area inside its scroll box);
// its count reads "[done] of [count] answered" to a screen reader. A click with a modifier
// key keeps the link's own behaviour (a new tab). It scrolls sideways when long, with the
// active pill brought into view. Under
// it, a 4 px bar in the accent shows the items answered, a progressbar with its numbers
// (developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role).
// The counts are the server's as this page last heard them (an answer counts once the
// server holds it complete); an answer saved on another device shows on the next load
// (E7-4, built notes). The bar moves in 250 ms and the pills change colour in 150 ms, both
// still under reduced motion (docs/design-system.md, Motion). The single long page has no
// row (E5-3), only the bar.
import { useEffect, useRef } from "react";
import { cn } from "cn";
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
};

const PILL = "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] text-[13px] font-semibold whitespace-nowrap outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function ChapterRow({ accent, chapters, progress, screen, showRow, onGo, locked = false }: ChapterRowProps) {
  const active = useRef<HTMLAnchorElement | null>(null);
  const key = screenParam(screen);
  useEffect(() => {
    active.current?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [key]);
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
          className={cn(PILL, on ? "border-transparent text-white" : cn("border-hairline-strong bg-surface text-ink-muted", !locked && "hover:text-ink"), locked && "cursor-default opacity-40")}
          style={on ? { background: accent } : undefined}
          data-testid={testId}
        >{label}</a>
      </li>
    );
  };
  return (
    <div className="flex flex-col gap-0 border-b border-hairline bg-surface" data-testid="chapter-nav">
      {showRow && (
        <nav aria-label={RESPONDENT_COPY.chapters} className="relative">
          <ol className="flex gap-1.5 overflow-x-auto px-5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="chapter-row">
            {pill({ kind: "about" }, RESPONDENT_COPY.aboutYou, "row-about")}
            {chapters.map((c, i) => pill({ kind: "chapter", index: i }, <>{c.name}<span className="font-mono text-[11px] font-medium" aria-hidden="true">{progress[i]?.done ?? 0}/{progress[i]?.count ?? 0}</span></>, `row-chapter-${i + 1}`, `${c.name}, ${RESPONDENT_COPY.pillAnswered(progress[i]?.done ?? 0, progress[i]?.count ?? 0)}`))}
            {pill({ kind: "wrap" }, RESPONDENT_COPY.wrapUp, "row-wrap")}
          </ol>
        </nav>
      )}
      <div role="progressbar" aria-label={RESPONDENT_COPY.answeredBar} aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-valuetext={RESPONDENT_COPY.barValue(answered, total)} className="h-1 w-full bg-hairline" data-testid="progress-bar">
        <div className="h-1 transition-[width] duration-[250ms] motion-reduce:transition-none" style={{ width: total ? `${(answered / total) * 100}%` : "0%", background: accent }} />
      </div>
    </div>
  );
}
