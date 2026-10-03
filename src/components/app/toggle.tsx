"use client";
// The design system's switch (docs/design-system.md, Components): 44 by 24, violet when on,
// ink-muted when off, the thumb white on light and the ground on dark, named by a visible
// label through aria-labelledby or by aria-label. The mode toggle keeps its own copy for its
// view transition names (src/components/app/mode-toggle.tsx).
import { cn } from "cn";

export function Toggle({ checked, onChange, disabled, className, ...aria }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; className?: string; "aria-label"?: string; "aria-labelledby"?: string; "aria-describedby"?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      {...aria}
      className={cn("relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-ink-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-checked:bg-violet disabled:opacity-40", className)}
    >
      <span aria-hidden="true" className="absolute top-1/2 left-0.5 block size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 in-aria-checked:translate-x-5 dark:bg-ground" />
    </button>
  );
}
