"use client";
// The thinking state (stories/E4-8, acceptance 5; design note 113): while an AI run is
// pending, the mascot in the "analysis" pose at 56 px beside one line that walks through the
// steps the screen passes, 1.6 seconds each, stopping on the last, with three dots pulsing
// after it. The line is a status region (role="status", aria-live="polite"), so a screen
// reader hears each step without being interrupted. Under prefers-reduced-motion the first
// line stays and nothing pulses: the base rule in src/app/globals.css stops every animation,
// and the interval is not started when matchMedia says so
// (developer.mozilla.org/docs/Web/API/Window/matchMedia). The dots use Tailwind's
// animate-pulse (tailwindcss.com/docs/animation), each 200 ms behind the one before.
// New to the design system: docs/design-system.md, Components, Thinking.
import { useEffect, useState } from "react";
import { Mascot } from "@/components/app/mascot";
import { cn } from "cn";

export const THINKING_STEP_MS = 1_600;

export function Thinking({ steps, className }: { steps: string[]; className?: string }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (steps.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setAt((n) => Math.min(n + 1, steps.length - 1)), THINKING_STEP_MS);
    return () => clearInterval(timer);
  }, [steps.length]);
  return (
    <div className={cn("flex items-center gap-3", className)} data-testid="thinking">
      <Mascot pose="analysis" size={56} />
      <p role="status" aria-live="polite" className="text-sm text-ink-soft" data-testid="thinking-line">
        {steps[Math.min(at, steps.length - 1)] ?? ""}
        <span aria-hidden="true" className="ml-1 inline-flex items-baseline gap-0.5">
          {[0, 200, 400].map((delay) => (
            <span key={delay} className="inline-block size-1.5 animate-pulse rounded-full bg-violet" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </span>
      </p>
    </div>
  );
}
