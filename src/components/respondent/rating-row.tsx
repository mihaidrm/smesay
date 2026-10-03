"use client";
// The rating row of a respondent card (decision 0018; docs/design-system.md, Rating row):
// the method's values as pills, Unclear last, 38 px high, 10 px text, radius 999, 2 px
// apart, always one row; the proposed value with a dashed muted border and the caption
// "proposed" (shown only when the instrument shows proposals); the 1 to 5 scale carries
// "no fit" and "fits fully" under its ends (the two captions sit flush with the row's
// edges, since a 390 px row of six pills is narrower than the words). The selected pill
// fills with the PM's accent
// and white text (E7-2 acceptance 7; the accent passes 4.5 to 1 on white by
// src/lib/brand-rules.ts). A radio group: one answer per card, keyboard reachable.
import { cn } from "cn";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { scaleFor, SCORING_COPY, UNCLEAR } from "@/lib/scoring";

export function RatingRow({ method, labels, proposed, showProposed, value, accent, onChange, name, ring }: {
  method: ScoringMethod; labels: ScaleLabels | null; proposed: string | null; showProposed: boolean; value: string | null; accent: string;
  onChange?: (code: string) => void; name: string; ring?: boolean;
}) {
  const pills = [...scaleFor(method, labels).map((v) => ({ code: v.code, label: v.label, caption: v.caption })), { code: UNCLEAR, label: SCORING_COPY.unclear, caption: undefined as string | undefined }];
  return (
    <div role="radiogroup" aria-label={SCORING_COPY.yourRating} className={cn("flex flex-col gap-1", ring && "rounded-lg ring-2 ring-violet ring-offset-4 ring-offset-surface")} data-testid="rating-row" data-method={method}>
      <span className="font-mono text-[11px] leading-[14px] text-ink-muted">{SCORING_COPY.yourRating}</span>
      <div className="flex gap-0.5">
        {pills.map((p, i) => {
          const isProposed = showProposed && p.code === proposed;
          const selected = value === p.code;
          const caption = isProposed ? SCORING_COPY.proposed : p.caption;
          return (
            <div key={p.code} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange?.(p.code)}
                data-code={p.code}
                data-proposed={isProposed || undefined}
                className={cn(
                  "h-[38px] w-full overflow-hidden rounded-full border px-0.5 text-[10px] font-semibold tracking-[-0.01em] whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  selected ? "border-transparent text-white" : isProposed ? "border-[1.5px] border-dashed border-ink-muted text-ink" : "border-hairline-strong text-ink-muted",
                )}
                style={selected ? { background: accent } : undefined}
              >
                {p.label}
              </button>
              <span className={cn("h-3.5 w-max whitespace-nowrap font-mono text-[10px] leading-[14px] text-ink-muted", i === 0 && "self-start", i === pills.length - 2 && caption && !isProposed && "self-end")}>{caption ?? ""}</span>
            </div>
          );
        })}
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}
