"use client";
// "Show tips" in the sidebar footer, above the mode toggle (stories/E15-1, acceptance 3): one
// switch per person, on by default; off hides every guide card and the first-project path, on
// brings back the tips not dismissed. The look and the accessible name are the mode toggle's
// (design note 34); the state is the server's (user.guide_state), shown at once and stored by
// ./guide-actions.ts setShowTipsAction, which reloads the shell. Disabled during an admin's
// view (E14-4).
import { useId, useOptimistic, useState, useTransition } from "react";
import { GUIDE_COPY } from "@/lib/guide-lines";
import { setShowTipsAction } from "@/app/app/(shell)/guide-actions";

export function ShowTips({ on, disabled = false }: { on: boolean; disabled?: boolean }) {
  const labelId = useId();
  const [shown, setShown] = useOptimistic(on);
  const [, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
    <div className="flex items-center justify-between gap-3 px-2.5 text-xs text-ink-muted">
      <span id={labelId}>{GUIDE_COPY.showTips}</span>
      <button
        type="button"
        role="switch"
        aria-checked={shown}
        aria-labelledby={labelId}
        disabled={disabled}
        data-testid="show-tips"
        onClick={() => start(async () => {
          setShown(!shown);
          // A failed store puts the switch back (useOptimistic ends with the transition) and says so.
          try { await setShowTipsAction(!shown); setFailed(false); } catch { setFailed(true); }
        })}
        className="relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-ink-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 aria-checked:bg-violet"
      >
        <span aria-hidden="true" className="absolute top-1/2 left-0.5 block size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 in-aria-checked:translate-x-5 dark:bg-ground dark:in-aria-checked:bg-ground" />
      </button>
    </div>
    {failed && <p role="alert" className="px-2.5 text-xs text-danger">{GUIDE_COPY.notSaved}</p>}
    </>
  );
}
