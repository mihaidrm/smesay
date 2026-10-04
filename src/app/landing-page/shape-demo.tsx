"use client";
// The Shape step's fragment (stories/E12-1 as amended on 2026-10-04, design note 53, concept
// 3 of the brainstorm Mihai asked for): one card, two sides, a switch between them. "Your
// sheet" shows four rows of the Marlow spreadsheet as imported (the seed's original texts,
// src/db/seed/sample.ts); "Shaped" shows the same rows sorted under their areas and written
// in plain words (the seed's reader texts). The card opens on "Your sheet" and turns to
// "Shaped" once, 900 ms after it is first seen, so the visitor watches the change; with
// reduced motion, without IntersectionObserver or without JavaScript it rests on "Shaped".
// Both sides are drawn in one grid cell and the hidden one is invisible, so the card does not
// change height when it turns.
// The switch is the landing's variant of the segmented control (design note 53: a violet-soft
// track, since the tint track does not show on the tint card, 32 px options, the active one
// white with a small shadow), two toggle buttons with aria-pressed
// (developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed). The
// card is watched with IntersectionObserver and its threshold option (developer.mozilla.org/
// docs/Web/API/IntersectionObserver/IntersectionObserver), the first switch to the sheet is
// queued with queueMicrotask (developer.mozilla.org/docs/Web/API/Window/queueMicrotask), and
// the hidden side keeps its box with visibility: hidden (developer.mozilla.org/docs/Web/CSS/
// visibility).
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

const ROWS: { original: string; reader: string; area: string }[] = [
  { original: "OCR receipt capture via mobile (auto-fill amt/date/vendor).", reader: "Photograph a receipt and the amount, date and merchant are filled in automatically.", area: "Submitting" },
  { original: "Multi-allocation of single expense line to 2+ cost centres/projects.", reader: "Split one receipt across two projects or cost centres.", area: "Submitting" },
  { original: "Approval actionable from notification email (no login).", reader: "Managers approve or reject from the email, without logging in.", area: "Approving" },
  { original: "Policy engine: auto-flag out-of-policy claims pre-approval.", reader: "Expenses over the policy limit are flagged before they reach the approver.", area: "Approving" },
];
const SIDES = ["Your sheet", "Shaped"] as const;
type Side = (typeof SIDES)[number];

export function ShapeDemo() {
  const [side, setSide] = useState<Side>("Shaped");
  const touched = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Start on the sheet only while the card is still below the fold, so nothing changes under the reader's eyes.
    if (el.getBoundingClientRect().top > window.innerHeight) queueMicrotask(() => { if (!touched.current) setSide("Your sheet"); });
    else return;
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      seen.disconnect();
      timer = setTimeout(() => { if (!touched.current) setSide("Shaped"); }, 900);
    }, { threshold: 0.6 });
    seen.observe(el);
    return () => { seen.disconnect(); if (timer) clearTimeout(timer); };
  }, []);
  const pick = (next: Side) => { touched.current = true; setSide(next); };
  const areas = [...new Set(ROWS.map((r) => r.area))];
  return (
    <div ref={box} className="flex flex-col gap-2.5" data-testid="shape-demo" data-side={side}>
      <div className="flex self-start rounded-full bg-[#EEEAFF] p-[3px] text-[13px] font-semibold" role="group" aria-label="Show the list">
        {SIDES.map((s) => (
          <button key={s} type="button" aria-pressed={side === s} onClick={() => pick(s)} className={cn("h-8 rounded-full px-3.5 whitespace-nowrap outline-hidden transition-[background-color,box-shadow,color] duration-150 focus-visible:ring-2 focus-visible:ring-[#6D4CF5] focus-visible:ring-offset-2 motion-reduce:transition-none", side === s ? "bg-white text-[#15131F] shadow-[0_2px_8px_rgba(45,32,110,0.14)]" : "text-[#5E5A72] hover:text-[#15131F]")}>{s}</button>
        ))}
      </div>
      {/* Both sides share one grid cell, so the card keeps the taller side's height and nothing jumps. */}
      <div className="grid">
        <div className={cn("grid grid-cols-[34px_minmax(0,1fr)] self-start overflow-hidden rounded-[10px] border border-[#E6E3F0] bg-white font-mono text-[12px] text-[#5E5A72] [grid-area:1/1]", side !== "Your sheet" && "invisible")} aria-hidden={side !== "Your sheet"} data-testid="shape-sheet">
          {ROWS.map((r, i) => (
            <div key={r.original} className="contents">
              <span className={cn("border-r border-[#E6E3F0] bg-[#F7F6FB] px-2 py-2.5 text-center", i > 0 && "border-t")}>{i + 2}</span>
              <span className={cn("truncate px-2.5 py-2.5", i > 0 && "border-t border-[#E6E3F0]")}>{r.original}</span>
            </div>
          ))}
        </div>
        <div className={cn("flex flex-col gap-2 rounded-[14px] bg-[#F7F6FB] p-3.5 text-[13px] leading-[19px] [grid-area:1/1]", side !== "Shaped" && "invisible")} aria-hidden={side !== "Shaped"} data-testid="shape-shaped">
          {areas.map((area) => (
            <div key={area} className="flex flex-col gap-1">
              <span className="text-[12px] font-bold tracking-[0.02em] text-[#5A3BE0]">{area}</span>
              {ROWS.filter((r) => r.area === area).map((r) => <span key={r.reader}>{r.reader}</span>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
