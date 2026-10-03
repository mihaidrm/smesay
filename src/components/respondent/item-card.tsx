"use client";
// A respondent card (decision 0018; docs/design-system.md, Rating row): the reference in
// mono, the title clamped to two lines, the rating row, one slot for the details text, and
// the footer with the status note. The frame is 260 px on phone and desktop. Preview mode
// keeps the pick in memory only (stories/E5-6, acceptance 4); E7-2 adds the comment box,
// the saved state and the autosave. One component for the Build preview and the real app.
import { useState } from "react";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { labelFor, SCORING_COPY } from "@/lib/scoring";
import { RatingRow } from "./rating-row";

export type ItemCardProps = {
  reference: string | null;
  title: string;
  details: string | null;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  proposed: string | null;
  showProposed: boolean;
  accent: string;
  ring?: boolean;
};

export function ItemCard({ reference, title, details, method, labels, proposed, showProposed, accent, ring }: ItemCardProps) {
  const [value, setValue] = useState<string | null>(null);
  const picked = labelFor(method, labels, value);
  return (
    <fieldset className="card flex h-[260px] flex-col gap-2 p-3" data-testid="item-card">
      <legend className="float-left flex w-full items-baseline gap-2">
        {reference && <span className="shrink-0 font-mono text-[11px] text-ink-muted">{reference}</span>}
        <span className="line-clamp-2 text-base leading-[23px] font-semibold">{title}</span>
      </legend>
      <div className="clear-both" />
      <RatingRow method={method} labels={labels} proposed={proposed} showProposed={showProposed} value={value} accent={accent} onChange={setValue} name={title} ring={ring} />
      <div className="min-h-0 grow overflow-y-auto rounded-lg bg-ground px-2.5 py-1.5 text-[13px] leading-[18px] text-ink-muted">{details ?? ""}</div>
      <div className="flex h-6 shrink-0 items-center justify-end text-xs" aria-live="polite" data-testid="item-card-note">
        {picked ? <span className="font-semibold text-ink">{picked}</span> : <span className="text-ink-muted">{SCORING_COPY.notRated}</span>}
      </div>
    </fieldset>
  );
}
