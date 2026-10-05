"use client";
// A respondent card (decision 0018; docs/design-system.md, Rating row; stories/E7-2; design note
// 98): "Requirement [REF]" over the summary, the summary clamped to two lines, then the details
// behind View more, the rating row, one box, and the footer with "+ comment" and the status
// note. The details sit above the rating and open in place (Mihai, 2026-10-05: "Comment and
// details share the same box - its maybe a bit confusing"), so the box under the rating is only
// ever the reason or the comment: the reason box when the answer needs one (a value other than
// the proposal: "Could you tell us why you think the priority should be different?"; Not
// needed: "Why is it not needed ..."; Unclear: "What would you need to know to rate it?"), the
// comment box when "+ comment" is open on an answer that takes one. The card fills its grid
// cell and its footer sits at the bottom, so the two cards of a row are always the same height
// (CSS grid stretches the items of a row: developer.mozilla.org/docs/Web/CSS/align-items). The
// note says "Not rated yet", or "Saved" once the server has the complete answer (aria-live
// polite); a missing reason or question has no note on the card, since the box's question
// already asks, and the Wrap up lists it. Typed text stays when the respondent switches
// between answers on the same card (note 12, finding 4). Two modes: the Build preview keeps
// the pick in memory (no onChange, stories/E5-6, acceptance 4); the respondent app controls
// the draft and the saved state (E7-2, E7-3). One component for both, so the two cannot drift.
import { useId, useState } from "react";
import { cn } from "cn";
import type { ReasonRule, ScaleLabels, ScoringMethod } from "@/db/types";
import { answerFor, needsReason, noteFor, RESPONDENT_COPY, textRequired, type AnswerState } from "@/lib/respondent-rules";
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
  reasonRule: ReasonRule;
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

const BOX = "min-h-[52px] w-full resize-none rounded-xl border border-hairline-strong bg-surface px-2.5 py-1.5 text-sm leading-5 text-ink focus:outline-hidden focus-visible:border-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
// The footer's toggle keeps its text size and takes a 48 px tall hit area (docs/design-system.md,
// Respondent tap targets), as the Wrap up's Go to and Change pills do: 12 px above the text,
// which reaches the box above and no further, and 20 px below it, into the card's padding and
// 4 px past it (the cards are 12 px apart). The box sits over the row (relative z-10), so a
// tap on its edge stays the box's.
const TOGGLE = "relative rounded-sm text-xs font-semibold after:absolute after:-inset-x-1.5 after:-top-3 after:-bottom-5 after:content-[''] text-ink-muted underline-offset-2 focus:outline-hidden hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
// View more is 32 px tall and reaches 8 px above and below, into the card's 8 px gaps, for the
// 48 px target without covering the summary or the rating row.
const MORE = "relative inline-flex h-8 items-center self-start rounded-sm text-xs font-semibold text-ink-muted underline underline-offset-2 after:absolute after:-inset-x-1.5 after:-inset-y-2 after:content-[''] hover:text-ink focus:outline-hidden focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function ItemCard({ reference, title, details, method, labels, proposed, showProposed, reasonRule, accent, ring, ringCard = false, ringWording = false, idKey, draft: controlled, saved = false, savedLabel = RESPONDENT_COPY.saved, unsaved = false, error = null, onChange }: ItemCardProps) {
  const [own, setOwn] = useState<CardDraft>(EMPTY_DRAFT);
  const draft = controlled ?? own;
  const set = (next: CardDraft) => (onChange ? onChange(next) : setOwn(next));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(() => Boolean(controlled?.comment));
  const prefix = useId();
  const answer = answerOfDraft(draft, method, showProposed, proposed);
  const reasonNeeded = answer !== null && needsReason(answer.kind);
  const commentAllowed = answer !== null && !reasonNeeded;
  // The PM's rule on every answer (E5-2, acceptance 6): the comment is required, so its box opens on its own.
  const commentRequired = answer !== null && !reasonNeeded && textRequired(answer.kind, reasonRule);
  const slot: "reason" | "comment" | null = reasonNeeded ? "reason" : commentAllowed && (commentOpen || commentRequired) ? "comment" : null;
  const note = noteFor(answer, reasonRule);
  const noteText = error ? error : note === "notRated" ? RESPONDENT_COPY.notRated : note !== null ? "" : onChange ? (saved ? savedLabel : unsaved ? RESPONDENT_COPY.notSavedYet : "") : (labelFor(method, labels, draft.picked) ?? "");
  const prompt = !answer ? "" : answer.kind === "unclear" ? RESPONDENT_COPY.unclearPrompt : answer.kind === "disagree" ? RESPONDENT_COPY.disagreePrompt : RESPONDENT_COPY.changePrompt(method);
  return (
    <fieldset className={cn("card flex h-full min-w-0 flex-col gap-2 p-3", ringCard && "ring-2 ring-violet ring-offset-4 ring-offset-ground")} data-testid="item-card" data-item={idKey} data-note={note ?? (saved ? "saved" : "pending")}>
      <legend className={cn("float-left flex w-full flex-col gap-0.5", ringWording && "rounded-md ring-2 ring-violet ring-offset-2 ring-offset-surface")} data-ring={ringWording || undefined}>
        {reference && <span className="text-xs leading-4 font-semibold text-ink-muted" data-testid="card-reference">{RESPONDENT_COPY.reference(reference)}</span>}
        <span className={cn("text-base leading-[23px] font-semibold", !detailsOpen && "line-clamp-2")}>{title}</span>
      </legend>
      <div className="clear-both" />
      {details && (
        <>
          <button type="button" aria-expanded={detailsOpen} aria-controls={`${prefix}-details`} onClick={() => setDetailsOpen((v) => !v)} className={MORE} data-testid="card-more">{detailsOpen ? RESPONDENT_COPY.viewLess : RESPONDENT_COPY.viewMore}</button>
          <div id={`${prefix}-details`} hidden={!detailsOpen} className="rounded-lg bg-ground px-2.5 py-1.5 text-[13px] leading-[18px] wrap-anywhere text-ink-muted" data-testid="card-details">{details}</div>
        </>
      )}
      <RatingRow method={method} labels={labels} proposed={proposed} showProposed={showProposed} value={draft.picked} accent={accent} onChange={(code) => set({ ...draft, picked: code })} name={title} idKey={idKey} ring={ring} />
      {slot === "reason" ? (
        <div className="relative z-10 flex flex-col gap-1">
          <label htmlFor={`${prefix}-reason`} className="text-xs leading-4 text-ink-muted">{prompt}</label>
          <textarea id={`${prefix}-reason`} value={draft.reason} maxLength={2000} onChange={(e) => set({ ...draft, reason: e.target.value })} className={BOX} data-testid="card-reason" />
        </div>
      ) : slot === "comment" ? (
        <div className="relative z-10 flex flex-col gap-1">
          <label htmlFor={`${prefix}-comment`} className="text-xs leading-4 text-ink-muted">{commentRequired ? RESPONDENT_COPY.commentRequired : RESPONDENT_COPY.commentLabel}</label>
          <textarea id={`${prefix}-comment`} value={draft.comment} maxLength={2000} onChange={(e) => set({ ...draft, comment: e.target.value })} className={BOX} data-testid="card-comment" />
        </div>
      ) : null}
      <div className="mt-auto flex min-h-6 shrink-0 items-center gap-3 text-xs">
        {commentAllowed && !commentRequired && onChange && (
          <button type="button" aria-expanded={slot === "comment"} onClick={() => setCommentOpen(slot !== "comment")} className={TOGGLE}>{slot === "comment" ? RESPONDENT_COPY.hideComment : RESPONDENT_COPY.addComment}</button>
        )}
        <span aria-live="polite" className={cn("ml-auto text-right font-semibold", error ? "text-danger" : note === null ? (saved ? "text-agree-text" : "text-ink") : "font-normal text-ink-muted")} data-testid="item-card-note">{noteText}</span>
      </div>
    </fieldset>
  );
}
