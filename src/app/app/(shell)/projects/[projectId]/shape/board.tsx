"use client";
// The areas and their items (stories/E4-2, acceptance 1 and 3). Each area is a drop target
// and each item draggable with the browser's own drag and drop (HTML Drag and Drop API,
// developer.mozilla.org/docs/Web/API/HTML_Drag_and_Drop_API: draggable, dragstart, dragover,
// drop), no library (design note 27). The keyboard path is "Move to": a select of the areas
// and a Move button per item, a form on moveAction. Both call the same action, so a move is
// saved within the round trip and the page re-renders from the database. Before shaping the
// list is read-only: the imported areas, or one "Not shaped yet" group. Each row also shows
// the reader version with its pill and buttons (stories/E4-3, reader-row.tsx); readerOnly
// (the sample) keeps the pills and drops every control.
import { useActionState, useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { NeutralPill } from "@/components/ui/status-pill";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { moveAction, type ProjectFormState } from "../../actions";
import { PerspectiveTags } from "./perspective-tags";
import { ReaderControls, ReaderText, type ReaderState } from "./reader-row";

// notes (E4-4): the item's own lines under its text, the ambiguity and the duplicate it may be.
export type BoardItem = { id: string; position: number; ref: string | null; text: string; placedByAi: boolean; moved: boolean; reader: ReaderState; notes: string[]; tags: string[] };
export type BoardGroup = { name: string; rationale: string | null; items: BoardItem[] };
const NONE: ProjectFormState = { error: null, saved: false };

// perspectives (stories/E5-4): the newest instrument's names, chips under every item; none
// while the instrument has none, and never on the sample (readerOnly).
export function Board({ projectId, areas, groups, readOnly, readerOnly, perspectives }: { projectId: string; areas: string[]; groups: BoardGroup[]; readOnly: boolean; readerOnly: boolean; perspectives: string[] }) {
  const [state, action] = useActionState<ProjectFormState, FormData>(moveAction, NONE);
  const [pending, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const drop = (itemId: string, area: string) => {
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("itemId", itemId);
    data.set("area", area);
    start(() => action(data));
  };
  return (
    <div className="flex flex-col gap-4" data-testid="shape-board" aria-busy={pending}>
      {state.error && <p id="move-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      {groups.map((group, g) => {
        const target = !readOnly && areas.includes(group.name);
        return (
          <section
            key={group.name}
            aria-labelledby={`area-${g}`}
            data-testid="area"
            data-area={group.name}
            className={cn("card flex flex-col", over === group.name && "ring-2 ring-violet ring-offset-2 ring-offset-ground")}
            onDragOver={target ? (e) => { e.preventDefault(); setOver(group.name); } : undefined}
            onDragLeave={target ? () => setOver(null) : undefined}
            onDrop={target ? (e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) drop(id, group.name); } : undefined}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 pb-1">
              <h3 id={`area-${g}`} className="text-[15px] font-bold">{group.name} <span className="font-mono text-xs font-normal text-ink-muted">{group.items.length === 1 ? "1 item" : `${group.items.length} items`}</span></h3>
              {group.rationale && <div className="text-xs text-ink-muted" data-testid="rationale">{group.rationale}</div>}
            </div>
            <div className="flex flex-col gap-2.5 p-3">
            {group.items.map((it) => (
              <div
                key={it.id}
                id={`item-${it.id}`}
                data-testid="item"
                data-item-id={it.id}
                draggable={!readOnly}
                onDragStart={!readOnly ? (e) => { e.dataTransfer.setData("text/plain", it.id); e.dataTransfer.effectAllowed = "move"; } : undefined}
                className={cn("item-row flex items-start gap-3 px-3.5 py-3 text-sm leading-5", !readOnly && "cursor-grab active:cursor-grabbing")}
              >
                <div className="w-12 shrink-0 pt-0.5 font-mono text-xs text-ink-muted">{it.ref ?? it.position}</div>
                <div className="min-w-0 flex-grow">
                  <ReaderText item={it.reader} original={it.text} />
                  {it.notes.map((note) => <div key={note} className="mt-1 text-xs text-unclear-text" data-testid="item-note">{note}</div>)}
                  {!readerOnly && <PerspectiveTags projectId={projectId} itemId={it.id} reference={it.ref ?? String(it.position)} names={perspectives} tags={it.tags} />}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {/* Keyed by what the server holds, so a saved decision or edit closes the controls' own state. */}
                  <ReaderControls key={`${it.reader.status}:${it.reader.reader}`} projectId={projectId} itemId={it.id} ref={it.ref ?? String(it.position)} item={it.reader} readOnly={readOnly || readerOnly} />
                  <div className="flex items-center gap-2">
                  {it.placedByAi && <NeutralPill data-testid="placed-pill">{SHAPE_COPY.placedByAi}</NeutralPill>}
                  {it.moved && <NeutralPill data-testid="moved-pill">{SHAPE_COPY.movedByYou}</NeutralPill>}
                  {!readOnly && (
                    <form action={(data) => start(() => action(data))} className="flex items-center gap-1.5">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="itemId" value={it.id} />
                      <label htmlFor={`move-${it.id}`} className="sr-only">{SHAPE_COPY.moveLabel(it.ref ?? String(it.position))}</label>
                      <select id={`move-${it.id}`} name="area" defaultValue={group.name} disabled={pending} className="h-8 rounded-lg border border-hairline-strong bg-surface px-2 text-[13px]">
                        {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <Button type="submit" variant="secondary" size="small" disabled={pending}>{SHAPE_COPY.move}</Button>
                    </form>
                  )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

