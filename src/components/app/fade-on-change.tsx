"use client";
// A dashboard cell that fades when its value changes (stories/E8-7, acceptance 2; design
// system, Motion: "a changed dashboard cell fades over 400 ms", none under
// prefers-reduced-motion, no counters that spin). The value seen last is kept in state and a
// change bumps a key, which restarts the fade (react.dev/reference/react/useState, storing
// information from previous renders). The fade is a violet-soft layer over the cell that
// clears; the first render does not fade.
import { useState } from "react";
import { cn } from "cn";

export function FadeOnChange({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const [seen, setSeen] = useState({ value, n: 0 });
  if (seen.value !== value) setSeen({ value, n: seen.n + 1 });
  return (
    <span className={cn("relative", className)} data-changed={seen.n > 0 || undefined}>
      {children}
      {seen.n > 0 && <span key={seen.n} aria-hidden="true" className="cell-fade" />}
    </span>
  );
}
