"use client";
// "Choose tiles" (stories/E8-1, acceptance 2): the catalogue of twelve as a checklist in a
// modal dialog (the HTML dialog element, showModal: developer.mozilla.org/docs/Web/HTML/
// Element/dialog), at most six ticked (the others are disabled once six are), saved per PM
// per instrument on the server (saveTiles), which checks the choice again. Escape and Cancel
// close it with nothing saved. Copy: docs/copy/app.md, Results.
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RESULTS_COPY } from "@/lib/results-copy";
import { MAX_TILES, TILE_IDS, TILE_NAMES, type TileId } from "@/lib/results-tiles";
import { saveTiles } from "./actions";

export function TileChooser({ projectId, tiles }: { projectId: string; tiles: TileId[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [chosen, setChosen] = useState<TileId[]>(tiles);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const open = () => { setChosen(tiles); setError(null); dialog.current?.showModal(); };
  const close = () => { dialog.current?.close(); opener.current?.focus(); };
  const save = () => startTransition(async () => {
    const result = await saveTiles(projectId, chosen).catch(() => ({ error: RESULTS_COPY.saveFailed }));
    if (result.error) { setError(result.error); return; }
    close();
    router.refresh();
  });
  return (
    <>
      <Button ref={opener} type="button" variant="secondary" size="small" onClick={open} data-testid="choose-tiles">{RESULTS_COPY.chooseTiles}</Button>
      <dialog ref={dialog} aria-labelledby="tile-chooser-title" onClose={() => opener.current?.focus()} className="m-auto w-[420px] max-w-[calc(100vw-32px)] rounded-2xl border border-hairline bg-surface p-5 text-ink shadow-card backdrop:bg-[#15131F]/40" data-testid="tile-chooser">
        <form method="dialog" onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="tile-chooser-title" className="text-lg font-bold tracking-[-0.02em]">{RESULTS_COPY.chooserTitle}</h2>
            <p className="text-[13px] text-ink-muted">{RESULTS_COPY.chooserLine}</p>
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className="sr-only">{RESULTS_COPY.chooserTitle}</legend>
            {TILE_IDS.map((id) => {
              const on = chosen.includes(id);
              const full = !on && chosen.length >= MAX_TILES;
              return (
                <label key={id} className="flex min-h-9 items-center gap-3 rounded-lg px-2 text-sm has-[:disabled]:opacity-40 hover:bg-raised">
                  <input type="checkbox" checked={on} disabled={full} onChange={() => setChosen((c) => (on ? c.filter((x) => x !== id) : [...c, id]))} className="size-4 accent-[var(--violet)] outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface" data-testid={`tile-option-${id}`} />
                  {TILE_NAMES[id]}
                </label>
              );
            })}
          </fieldset>
          <p className="font-mono text-xs text-ink-muted" aria-live="polite">{RESULTS_COPY.chooserCount(chosen.length)}</p>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="small" onClick={close}>{RESULTS_COPY.cancel}</Button>
            <Button type="submit" size="small" disabled={pending || chosen.length === 0} aria-busy={pending || undefined} data-testid="save-tiles">{RESULTS_COPY.save}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
