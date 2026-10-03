"use client";
// The perspective chips on an item on Shape (stories/E5-4, acceptance 1): one toggle per
// name of the project's newest instrument, pressed when the item carries it; a press posts
// the item's whole list (tagItemAction), so the server holds one rule for it. Nothing shows
// while the instrument has no perspectives. A group named "Perspectives of [REF]".
import { useActionState, useOptimistic, useTransition } from "react";
import { cn } from "cn";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { tagItemAction, type ProjectFormState } from "../../actions";

export function PerspectiveTags({ projectId, itemId, reference, names, tags }: { projectId: string; itemId: string; reference: string; names: string[]; tags: string[] }) {
  const [state, action] = useActionState<ProjectFormState, FormData>(tagItemAction, { error: null, saved: false });
  const [shown, setShown] = useOptimistic(tags);
  const [pending, start] = useTransition();
  if (names.length === 0) return null;
  const toggle = (name: string) => {
    const next = shown.includes(name) ? shown.filter((t) => t !== name) : [...shown, name];
    const data = new FormData();
    data.set("projectId", projectId);
    data.set("itemId", itemId);
    data.set("tags", JSON.stringify(next));
    start(() => { setShown(next); action(data); });
  };
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="group" aria-label={SHAPE_COPY.perspectivesLabel(reference)} data-testid="perspective-tags">
      {names.map((name) => {
        const on = shown.includes(name);
        return (
          <button key={name} type="button" aria-pressed={on} disabled={pending} onClick={() => toggle(name)}
            className={cn("h-6 rounded-full border px-2.5 text-[11px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60", on ? "border-transparent bg-violet-soft text-violet-text" : "border-hairline-strong text-ink-muted hover:bg-tint")}>
            {name}
          </button>
        );
      })}
      {state.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
    </div>
  );
}
