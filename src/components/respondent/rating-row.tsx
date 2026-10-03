"use client";
// The rating row of a respondent card (decision 0018; docs/design-system.md, Rating row):
// the method's values as pills, Unclear last, 38 px high, 10 px text, radius 999, 2 px
// apart, always one row (a long label wraps to two lines inside the pill); the proposed
// value with a dashed muted border and the caption "proposed" (shown only when the
// instrument shows proposals); the 1 to 5 scale carries "no fit" and "fits fully" under
// its ends, flush with the row's edges since a 390 px row of six pills is narrower than the
// words. The selected pill fills with the PM's accent and white text (E7-2 acceptance 7;
// the accent passes 4.5 to 1 on white by src/lib/brand-rules.ts; the dark lift of the
// accent is E7-7's, docs/review-list.md). A radio group per the ARIA pattern
// (w3.org/WAI/ARIA/apg/patterns/radio): one tab stop, the arrow keys move and select, each
// caption is its pill's description, the group is named "Your rating" and the item.
import { useRef } from "react";
import { cn } from "cn";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { scaleFor, SCORING_COPY, UNCLEAR } from "@/lib/scoring";

export function RatingRow({ method, labels, proposed, showProposed, value, accent, onChange, name, ring }: {
  method: ScoringMethod; labels: ScaleLabels | null; proposed: string | null; showProposed: boolean; value: string | null; accent: string;
  onChange?: (code: string) => void; name: string; ring?: boolean;
}) {
  const pills = [...scaleFor(method, labels).map((v) => ({ code: v.code, label: v.label, caption: v.caption })), { code: UNCLEAR, label: SCORING_COPY.unclear, caption: undefined as string | undefined }];
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const groupId = `rating-${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}-${method}`;
  const selectedIndex = pills.findIndex((p) => p.code === value);
  const move = (from: number, delta: number) => {
    const to = (from + delta + pills.length) % pills.length;
    buttons.current[to]?.focus();
    onChange?.(pills[to].code);
  };
  return (
    <div role="radiogroup" aria-label={`${SCORING_COPY.yourRating}: ${name}`} className={cn("flex flex-col gap-1", ring && "rounded-lg ring-2 ring-violet ring-offset-4 ring-offset-surface")} data-testid="rating-row" data-method={method}>
      <span aria-hidden="true" className="font-mono text-[11px] leading-[14px] text-ink-muted">{SCORING_COPY.yourRating}</span>
      <div className="flex gap-0.5">
        {pills.map((p, i) => {
          const isProposed = showProposed && p.code === proposed;
          const selected = value === p.code;
          const caption = isProposed ? SCORING_COPY.proposed : p.caption;
          const captionId = caption ? `${groupId}-${p.code}-caption` : undefined;
          const tabbable = selectedIndex === -1 ? i === 0 : selected;
          return (
            <div key={p.code} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <button
                ref={(el) => { buttons.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-describedby={captionId}
                tabIndex={tabbable ? 0 : -1}
                onClick={() => onChange?.(p.code)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(i, 1); }
                  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(i, -1); }
                  if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange?.(p.code); }
                }}
                data-code={p.code}
                data-proposed={isProposed || undefined}
                className={cn(
                  "flex h-[38px] w-full items-center justify-center overflow-hidden rounded-full border px-0.5 text-center text-[10px] leading-3 font-semibold tracking-[-0.01em] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  selected ? "border-transparent text-white" : isProposed ? "border-[1.5px] border-dashed border-ink-muted text-ink" : "border-hairline-strong text-ink-muted",
                )}
                style={selected ? { background: accent } : undefined}
              >
                <span className="line-clamp-2">{p.label}</span>
              </button>
              <span id={captionId} className={cn("h-3.5 w-max whitespace-nowrap font-mono text-[10px] leading-[14px] text-ink-muted", i === 0 && "self-start", i === pills.length - 2 && caption && !isProposed && "self-end")}>{caption ?? ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
