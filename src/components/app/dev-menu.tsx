"use client";
// The developer menu at the bottom of the sidebar (stories/E4-8, acceptance 1; design note
// 113), rendered by the shell only when the server sees the menu on (src/lib/ai/mode.ts
// devMenuOn: SMESAY_DEV_MENU=1 or NODE_ENV not "production"). "AI calls" is a group of three
// radios, Stand-in (free), Real (spends credits) and Off; a press stores the choice through
// setAiModeAction (the cookie smesay-ai-mode) and the shell reloads. Shown at once through
// useOptimistic (react.dev/reference/react/useOptimistic), put back when the store fails.
// Under it, the workspace's AI usage this month from usage() (E2-6): "[N] AI runs, EUR [x]".
// Copy: docs/copy/app.md, Signed-in shell.
import { useId, useOptimistic, useState, useTransition } from "react";
import { setAiModeAction } from "@/app/app/(shell)/dev-actions";
import { AI_MODES, type AiMode } from "@/lib/ai/mode-rules";
import { DEV_MENU_COPY } from "@/lib/dev-menu-copy";

export function DevMenu({ mode, runs, eur }: { mode: AiMode; runs: number; eur: string }) {
  const groupId = useId();
  const [chosen, setChosen] = useOptimistic(mode);
  const [, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <details className="rounded-xl border border-dashed border-hairline-strong text-xs text-ink-muted" data-testid="dev-menu">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&::-webkit-details-marker]:hidden" data-testid="dev-menu-summary">
        <span className="font-semibold text-ink-soft">{DEV_MENU_COPY.title}</span>
        <span data-testid="dev-menu-mode">{DEV_MENU_COPY.modes[chosen]}</span>
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-2.5">
        <fieldset className="flex flex-col gap-1.5" aria-labelledby={groupId}>
          <legend id={groupId} className="mb-1">{DEV_MENU_COPY.aiCalls}</legend>
          {AI_MODES.map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 text-ink-soft">
              <input
                type="radio"
                name="ai-mode"
                value={m}
                checked={chosen === m}
                data-testid={`ai-mode-${m}`}
                className="size-3.5 accent-violet"
                onChange={() => start(async () => {
                  setChosen(m);
                  try { await setAiModeAction(m); setFailed(false); } catch { setFailed(true); }
                })}
              />
              <span>{DEV_MENU_COPY.modes[m]}</span>
            </label>
          ))}
        </fieldset>
        <div data-testid="dev-menu-usage">{DEV_MENU_COPY.usage(runs, eur)}</div>
        {failed && <p role="alert" className="text-danger">{DEV_MENU_COPY.notSaved}</p>}
      </div>
    </details>
  );
}
