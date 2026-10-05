"use client";
// A respondent card (decision 0018; docs/design-system.md, Rating row; stories/E7-2): the
// reference in mono, the title clamped to two lines, the rating row, one slot, and the
// footer with Details, "+ comment" and the status note. The frame is 260 px on phone and
// desktop; with a box open it may grow, so the box keeps two lines (52 px) under a
// two-line title and a two-line prompt, and the footer grows when the server's sentence
// wraps. The slot shows one thing: the reason box when the answer needs one (a value
// other than the proposal: "Why [VALUE] and not [PROPOSED]? ..."; Not needed: "Why is it
// not needed ..."; Unclear: "What would you need to know to rate it?"), the comment box
// when "+ comment" is open on an answer that takes one, else the details text; Details
// shows the details in the slot over a box and back. The note says exactly what is missing
// ("Not rated yet", "Say why.", "Write your question.") or "Saved" once the server has the
// complete answer (aria-live polite). Typed text stays when the respondent switches between
// answers on the same card (note 12, finding 4): the reason and the comment are kept here
// whatever the answer. Two modes: the Build preview keeps the pick in memory (no
// onChange, stories/E5-6, acceptance 4); the respondent app controls the draft and the
// saved state (E7-2, E7-3). One component for both, so the two cannot drift.
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "cn";
import type { ScaleLabels, ScoringMethod } from "@/db/types";
import { answerFor, needsReason, noteFor, RESPONDENT_COPY, type AnswerState } from "@/lib/respondent-rules";
import { labelFor } from "@/lib/scoring";
import { RatingRow } from "./rating-row";

export type CardDraft = { picked: string | null; reason: string; comment: string };
export const EMPTY_DRAFT: CardDraft = { picked: null, reason: "", comment: "" };

export type ItemCardProps = {
  reference: string | null;
  title: string;
  details: string | null;
  method: ScoringMethod;
  labels: ScaleLabels | null;
  proposed: string | null;
  showProposed: boolean;
  accent: string;
  // The builder's preview rings what its step changes (stories/E5-6, acceptance 2): the
  // rating row (Build), the whole card (Import) or its wording (Shape).
  ring?: boolean;
  ringCard?: boolean;
  ringWording?: boolean;
  // The respondent app: the draft, whether the server has its complete answer, and the change.
  idKey?: string;
  draft?: CardDraft;
  saved?: boolean;
  // The saved note's words, when not "Saved" (the visitors' sample, stories/E12-4).
  savedLabel?: string;
  // The server's sentence when it refused the answer (a stale page); shown in the note.
  error?: string | null;
  // The page cannot reach the server (E7-3): a complete answer not yet saved says so.
  unsaved?: boolean;
  onChange?: (draft: CardDraft) => void;
};

// The answer a draft stands for, as the server will store it (the same mapping).
export function answerOfDraft(draft: CardDraft, method: ScoringMethod, showProposed: boolean, proposed: string | null): AnswerState | null {
  if (draft.picked === null) return null;
  const mapped = answerFor(method, showProposed, proposed, { picked: draft.picked, reason: draft.reason.trim() || null, comment: draft.comment.trim() || null });
  return "answer" in mapped ? mapped.answer : null;
}

const BOX = "min-h-[52px] w-full grow resize-none rounded-xl border border-hairline-strong bg-surface px-2.5 py-1.5 text-sm leading-5 text-ink focus:outline-hidden focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
// The toggles keep their text size and take a 48 px tall hit area (docs/design-system.md,
// Respondent tap targets), as the Wrap up's Go to and Change pills do: 12 px above the text,
// which reaches the box above and no further, and 20 px below it, into the card's padding and
// 4 px past it (the cards are 12 px apart). The box sits over the row (relative z-10), so a
// tap on its edge stays the box's.
const TOGGLE = "relative rounded-sm text-xs font-semibold after:absolute after:-inset-x-1.5 after:-top-3 after:-bottom-5 after:content-[''] text-ink-muted underline-offset-2 focus:outline-hidden hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function ItemCard({ reference, title, details, method, labels, proposed, showProposed, accent, ring, ringCard = false, ringWording = false, idKey, draft: controlled, saved = false, savedLabel = RESPONDENT_COPY.saved, unsaved = false, error = null, onChange }: ItemCardProps) {
  const [own, setOwn] = useState<CardDraft>(EMPTY_DRAFT);
  const draft = controlled ?? own;
  const set = (next: CardDraft) => (onChange ? onChange(next) : setOwn(next));
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Details longer than their slot scroll; a keyboard reaches them then (axe,
  // scrollable-region-focusable: a scrolling region takes focus when nothing in it can). A
  // ResizeObserver reports on its first observe and on every size change
  // (developer.mozilla.org/docs/Web/API/ResizeObserver/observe), and the check runs again
  // once the fonts have loaded (developer.mozilla.org/docs/Web/API/FontFaceSet/ready), as
  // text set in the final font can need more room in a box of the same size. A long word or
  // link wraps (Tailwind's wrap-anywhere sets overflow-wrap: anywhere, node_modules/
  // tailwindcss/dist/lib.js), so the details scroll only down; the width is checked too. The
  // region keeps its tab stop while it has focus.
  const detailsRef = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  const [commentOpen, setCommentOpen] = useState(() => Boolean(controlled?.comment));
  const prefix = useId();
  const answer = answerOfDraft(draft, method, showProposed, proposed);
  const reasonNeeded = answer !== null && needsReason(answer.kind);
  const commentAllowed = answer !== null && !reasonNeeded;
  const slot: "reason" | "comment" | "details" = detailsOpen && details ? "details" : reasonNeeded ? "reason" : commentAllowed && commentOpen ? "comment" : "details";
  useEffect(() => {
    const el = detailsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let live = true;
    const check = () => { if (live) setScrolls((was) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1 || (was && document.activeElement === el)); };
    const observer = new ResizeObserver(check);
    observer.observe(el);
    void document.fonts?.ready.then(check);
    return () => { live = false; observer.disconnect(); };
  }, [details, slot]);
  const note = noteFor(answer);
  const noteText = error ? error : note === "notRated" ? RESPONDENT_COPY.notRated : note === "sayWhy" ? RESPONDENT_COPY.sayWhy : note === "writeQuestion" ? RESPONDENT_COPY.writeQuestion : onChange ? (saved ? savedLabel : unsaved ? RESPONDENT_COPY.notSavedYet : "") : (labelFor(method, labels, draft.picked) ?? "");
  const prompt = !answer ? "" : answer.kind === "unclear" ? RESPONDENT_COPY.unclearPrompt : answer.kind === "disagree" ? RESPONDENT_COPY.disagreePrompt : RESPONDENT_COPY.changePrompt(labelFor(method, labels, answer.value) ?? "", labelFor(method, labels, proposed) ?? "");
  return (
    <fieldset className={cn("card flex min-w-0 flex-col gap-2 p-3", slot === "details" ? "h-[260px]" : "min-h-[260px]", ringCard && "ring-2 ring-violet ring-offset-4 ring-offset-ground")} data-testid="item-card" data-item={idKey} data-note={note ?? (saved ? "saved" : "pending")}>
      <legend className={cn("float-left flex w-full items-baseline gap-2", ringWording && "rounded-md ring-2 ring-violet ring-offset-2 ring-offset-surface")} data-ring={ringWording || undefined}>
        {reference && <span className="shrink-0 font-mono text-[11px] text-ink-muted">{reference}</span>}
        <span className="line-clamp-2 text-base leading-[23px] font-semibold">{title}</span>
      </legend>
      <div className="clear-both" />
      <RatingRow method={method} labels={labels} proposed={proposed} showProposed={showProposed} value={draft.picked} accent={accent} onChange={(code) => { set({ ...draft, picked: code }); setDetailsOpen(false); }} name={title} idKey={idKey} ring={ring} />
      {slot === "reason" ? (
        <div className="relative z-10 flex grow flex-col gap-1">
          <label htmlFor={`${prefix}-reason`} className="text-xs leading-4 text-ink-muted">{prompt}</label>
          <textarea id={`${prefix}-reason`} value={draft.reason} maxLength={2000} onChange={(e) => set({ ...draft, reason: e.target.value })} className={BOX} data-testid="card-reason" />
        </div>
      ) : slot === "comment" ? (
        <div className="relative z-10 flex grow flex-col gap-1">
          <label htmlFor={`${prefix}-comment`} className="text-xs leading-4 text-ink-muted">{RESPONDENT_COPY.commentLabel}</label>
          <textarea id={`${prefix}-comment`} value={draft.comment} maxLength={2000} onChange={(e) => set({ ...draft, comment: e.target.value })} className={BOX} data-testid="card-comment" />
        </div>
      ) : (
        <div ref={detailsRef} tabIndex={scrolls ? 0 : undefined} role={scrolls ? "region" : undefined} aria-label={scrolls ? `${RESPONDENT_COPY.details}: ${title}` : undefined} className="relative z-10 min-h-0 grow overflow-y-auto rounded-lg bg-ground px-2.5 py-1.5 text-[13px] leading-[18px] wrap-anywhere text-ink-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid="card-details">{details ?? ""}</div>
      )}
      <div className="flex min-h-6 shrink-0 items-center gap-3 text-xs">
        {details && (reasonNeeded || (commentAllowed && commentOpen)) && (
          <button type="button" aria-expanded={slot === "details"} onClick={() => setDetailsOpen((v) => !v)} className={TOGGLE}>{slot === "details" ? RESPONDENT_COPY.hideDetails : RESPONDENT_COPY.details}</button>
        )}
        {commentAllowed && onChange && (
          <button type="button" aria-expanded={slot === "comment"} onClick={() => { setCommentOpen(slot !== "comment"); setDetailsOpen(false); }} className={TOGGLE}>{slot === "comment" ? RESPONDENT_COPY.hideComment : RESPONDENT_COPY.addComment}</button>
        )}
        <span aria-live="polite" className={cn("ml-auto text-right font-semibold", error ? "text-danger" : note === null ? (saved ? "text-agree-text" : "text-ink") : note === "notRated" ? "font-normal text-ink-muted" : "text-sun-text")} data-testid="item-card-note">{noteText}</span>
      </div>
    </fieldset>
  );
}
