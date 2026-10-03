"use client";
// One item's reader version (stories/E4-3, acceptance 1, 4 and 7): the pill (Suggested,
// Reader version used, Original kept; the status tints of docs/design-system.md), Accept,
// Edit and Reject while suggested, Undo once decided; Edit turns the text into a textarea
// whose Save accepts the edited text. A reader version equal to the original shows the
// sameAsOriginal line and no controls. Read-only on the sample.
import { useActionState, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { editReaderAction, readerAction, type ProjectFormState } from "../../actions";

export type ReaderState = { reader: string | null; status: "suggested" | "accepted" | "rejected" | null; same: boolean };
const NONE: ProjectFormState = { error: null, saved: false };
const PILL = { suggested: "bg-violet-soft text-violet-text", accepted: "bg-mint-soft text-mint-text", rejected: "bg-disagree-tint text-disagree-text" } as const;

export function ReaderText({ item, original }: { item: ReaderState; original: string }) {
  if (item.reader === null) return <div className="text-[15px]">{original}</div>;
  if (item.same) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-[15px]">{original}</div>
        <div className="text-xs text-ink-muted" data-testid="same-as-original">{SHAPE_COPY.sameAsOriginal}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[15px]" data-testid="reader-text">{item.reader}</div>
      <div className="text-xs text-ink-muted" data-testid="original-text">{SHAPE_COPY.original} {original}</div>
    </div>
  );
}

// The edit form is its own component, mounted while editing, so Cancel drops its state and
// a reopened form starts clean.
function ReaderEdit({ projectId, itemId, ref, text, onCancel }: { projectId: string; itemId: string; ref: string; text: string; onCancel: () => void }) {
  const [editState, editAction, editPending] = useActionState<ProjectFormState, FormData>(editReaderAction, NONE);
  return (
    <form action={editAction} className="flex w-full flex-col gap-2" data-testid="reader-edit">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="itemId" value={itemId} />
      <label htmlFor={`reader-${itemId}`} className="sr-only">{SHAPE_COPY.editLabel(ref)}</label>
      <Textarea id={`reader-${itemId}`} name="text" defaultValue={text} rows={2} maxLength={1200} className="min-h-14 text-[15px]" />
      {editState.error && <p id={`reader-error-${itemId}`} role="alert" className="text-sm text-danger">{editState.error}</p>}
      <div className="flex gap-1.5">
        <Button type="submit" size="small" loading={editPending}>{SHAPE_COPY.save}</Button>
        <Button type="button" size="small" variant="secondary" onClick={onCancel} disabled={editPending}>{SHAPE_COPY.cancel}</Button>
      </div>
    </form>
  );
}

export function ReaderControls({ projectId, itemId, ref, item, readOnly }: { projectId: string; itemId: string; ref: string; item: ReaderState; readOnly: boolean }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(readerAction, NONE);
  const [editing, setEditing] = useState(false);
  if (item.reader === null || item.same || item.status === null) return null;
  const pill = <span data-testid="reader-pill" className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold leading-none", PILL[item.status])}>{SHAPE_COPY.pill[item.status]}</span>;
  if (readOnly) return pill;
  if (editing) return <ReaderEdit projectId={projectId} itemId={itemId} ref={ref} text={item.reader} onCancel={() => setEditing(false)} />;
  const move = (name: "accept" | "reject" | "undo") => (
    <form action={action} className="inline-flex">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="move" value={name} />
      <Button type="submit" size="small" variant={name === "accept" ? "primary" : name === "reject" ? "secondary" : "tertiary"} className="" loading={pending}>{name === "accept" ? SHAPE_COPY.accept : name === "reject" ? SHAPE_COPY.reject : SHAPE_COPY.undo}</Button>
    </form>
  );
  return (
    <div className="flex flex-col items-end gap-1.5">
      {pill}
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-1.5">
        {item.status === "suggested" ? (
          <>
            {move("accept")}
            <Button type="button" size="small" variant="secondary" onClick={() => setEditing(true)}>{SHAPE_COPY.edit}</Button>
            {move("reject")}
          </>
        ) : move("undo")}
      </div>
    </div>
  );
}
