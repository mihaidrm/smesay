"use client";
// The areas and their items (stories/E4-2, acceptance 1 and 3). Each area is a drop target
// and each item draggable with the browser's own drag and drop (HTML Drag and Drop API,
// developer.mozilla.org/docs/Web/API/HTML_Drag_and_Drop_API: draggable, dragstart, dragover,
// drop), no library (design note 27). The keyboard path is "Move to": a select of the areas
// and a Move button per item, a form on moveAction. Both call the same action, so a move is
// saved within the round trip and the page re-renders from the database. Before shaping the
// list is read-only: the imported areas, or one "Not shaped yet" group.
import { useActionState, useState, useTransition } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { NeutralPill } from "@/components/ui/status-pill";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { moveAction, type ProjectFormState } from "../../actions";

export type BoardItem = { id: string; position: number; ref: string | null; text: string; placedByAi: boolean; moved: boolean };
export type BoardGroup = { name: string; rationale: string | null; items: BoardItem[] };
const NONE: ProjectFormState = { error: null, saved: false };

export function Board({ projectId, areas, groups, readOnly }: { projectId: string; areas: string[]; groups: BoardGroup[]; readOnly: boolean }) {
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
      {groups.map((group) => {
        const target = !readOnly && areas.includes(group.name);
        return (
          <section
            key={group.name}
            aria-labelledby={`area-${slug(group.name)}`}
            data-testid="area"
            data-area={group.name}
            className={cn("rounded-md border border-hairline", over === group.name && "ring-2 ring-teal-700 ring-offset-2")}
            onDragOver={target ? (e) => { e.preventDefault(); setOver(group.name); } : undefined}
            onDragLeave={target ? () => setOver(null) : undefined}
            onDrop={target ? (e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) drop(id, group.name); } : undefined}
          >
            <div className="flex flex-wrap items-baseline gap-3 rounded-t-md border-b border-hairline bg-grey-50 px-4 py-2.5">
              <h3 id={`area-${slug(group.name)}`} className="font-medium">{group.name}</h3>
              {group.rationale && <div className="text-[13px] text-ink-muted" data-testid="rationale">{group.rationale}</div>}
            </div>
            {group.items.map((it) => (
              <div
                key={it.id}
                data-testid="item"
                data-item-id={it.id}
                draggable={!readOnly}
                onDragStart={!readOnly ? (e) => { e.dataTransfer.setData("text/plain", it.id); e.dataTransfer.effectAllowed = "move"; } : undefined}
                className={cn("flex items-center gap-4 border-b border-grey-100 px-4 py-3 last:border-b-0", !readOnly && "cursor-grab active:cursor-grabbing")}
              >
                <div className="w-14 shrink-0 font-mono text-xs text-ink-muted">{it.ref ?? it.position}</div>
                <div className="min-w-0 flex-grow text-[15px]">{it.text}</div>
                <div className="flex shrink-0 items-center gap-2">
                  {it.placedByAi && <NeutralPill data-testid="placed-pill">{SHAPE_COPY.placedByAi}</NeutralPill>}
                  {it.moved && <NeutralPill data-testid="moved-pill">{SHAPE_COPY.movedByYou}</NeutralPill>}
                  {!readOnly && (
                    <form action={(data) => start(() => action(data))} className="flex items-center gap-1.5">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="itemId" value={it.id} />
                      <label htmlFor={`move-${it.id}`} className="sr-only">{`${SHAPE_COPY.moveTo} for ${it.ref ?? it.position}`}</label>
                      <select id={`move-${it.id}`} name="area" defaultValue={group.name} disabled={pending} className="h-8 rounded-md border border-hairline-strong bg-white px-2 text-[13px]">
                        {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <Button type="submit" variant="secondary" size="small" disabled={pending}>{SHAPE_COPY.move}</Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
