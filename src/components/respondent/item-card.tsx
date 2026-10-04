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
import { useId, useState } from "react";
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
  ring?: boolean;
  // The respondent app: the draft, whether the server has its complete answer, and the change.
  idKey?: string;
  draft?: CardDraft;
  saved?: boolean;
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

const BOX = "min-h-[52px] w-full grow resize-none rounded-xl border border-hairline-strong bg-surface px-2.5 py-1.5 text-sm leading-5 text-ink outline-none focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1 focus-visible:ring-offset-surface";
const TOGGLE = "rounded-sm text-xs font-semibold text-ink-muted underline-offset-2 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function ItemCard({ reference, title, details, method, labels, proposed, showProposed, accent, ring, idKey, draft: controlled, saved = false, unsaved = false, error = null, onChange }: ItemCardProps) {
  const [own, setOwn] = useState<CardDraft>(EMPTY_DRAFT);
  const draft = controlled ?? own;
  const set = (next: CardDraft) => (onChange ? onChange(next) : setOwn(next));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(() => Boolean(controlled?.comment));
  const prefix = useId();
  const answer = answerOfDraft(draft, method, showProposed, proposed);
  const reasonNeeded = answer !== null && needsReason(answer.kind);
  const commentAllowed = answer !== null && !reasonNeeded;
  const slot: "reason" | "comment" | "details" = detailsOpen && details ? "details" : reasonNeeded ? "reason" : commentAllowed && commentOpen ? "comment" : "details";
  const note = noteFor(answer);
  const noteText = error ? error : note === "notRated" ? RESPONDENT_COPY.notRated : note === "sayWhy" ? RESPONDENT_COPY.sayWhy : note === "writeQuestion" ? RESPONDENT_COPY.writeQuestion : onChange ? (saved ? RESPONDENT_COPY.saved : unsaved ? RESPONDENT_COPY.notSavedYet : "") : (labelFor(method, labels, draft.picked) ?? "");
  const prompt = !answer ? "" : answer.kind === "unclear" ? RESPONDENT_COPY.unclearPrompt : answer.kind === "disagree" ? RESPONDENT_COPY.disagreePrompt : RESPONDENT_COPY.changePrompt(labelFor(method, labels, answer.value) ?? "", labelFor(method, labels, proposed) ?? "");
  return (
    <fieldset className={cn("card flex min-w-0 flex-col gap-2 p-3", slot === "details" ? "h-[260px]" : "min-h-[260px]")} data-testid="item-card" data-item={idKey} data-note={note ?? (saved ? "saved" : "pending")}>
      <legend className="float-left flex w-full items-baseline gap-2">
        {reference && <span className="shrink-0 font-mono text-[11px] text-ink-muted">{reference}</span>}
        <span className="line-clamp-2 text-base leading-[23px] font-semibold">{title}</span>
      </legend>
      <div className="clear-both" />
      <RatingRow method={method} labels={labels} proposed={proposed} showProposed={showProposed} value={draft.picked} accent={accent} onChange={(code) => { set({ ...draft, picked: code }); setDetailsOpen(false); }} name={title} idKey={idKey} ring={ring} />
      {slot === "reason" ? (
        <div className="flex grow flex-col gap-1">
          <label htmlFor={`${prefix}-reason`} className="text-xs leading-4 text-ink-muted">{prompt}</label>
          <textarea id={`${prefix}-reason`} value={draft.reason} maxLength={2000} onChange={(e) => set({ ...draft, reason: e.target.value })} className={BOX} data-testid="card-reason" />
        </div>
      ) : slot === "comment" ? (
        <div className="flex grow flex-col gap-1">
          <label htmlFor={`${prefix}-comment`} className="text-xs leading-4 text-ink-muted">{RESPONDENT_COPY.commentLabel}</label>
          <textarea id={`${prefix}-comment`} value={draft.comment} maxLength={2000} onChange={(e) => set({ ...draft, comment: e.target.value })} className={BOX} data-testid="card-comment" />
        </div>
      ) : (
        <div className="min-h-0 grow overflow-y-auto rounded-lg bg-ground px-2.5 py-1.5 text-[13px] leading-[18px] text-ink-muted" data-testid="card-details">{details ?? ""}</div>
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
