"use client";
// Goals sent from the page (stories/E13-3, acceptance 2) with the documented call
// plausible(name) (plausible.io/docs/custom-event-goals). GoalLink is a plain link, not a
// client-side navigation, so a page without the script (the visitors' sample) loads on its own
// and never keeps the landing page's script running. When the script has not loaded yet the
// goal waits for its load event; with no script on the page (off, or blocked) nothing is sent.
import { useEffect, type AnchorHTMLAttributes } from "react";
import type { Goal } from "@/lib/plausible";

declare global { interface Window { plausible?: (name: string, options?: { props?: Record<string, string> }) => void } }

export function sendClientGoal(goal: Goal): void {
  try {
    if (window.plausible) { window.plausible(goal); return; }
    const script = document.querySelector<HTMLScriptElement>('script[data-analytics="plausible"]');
    script?.addEventListener("load", () => { try { window.plausible?.(goal); } catch { /* none */ } }, { once: true });
  } catch { /* Analytics never stop a page. */ }
}

export function GoalLink({ goal, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { goal: Goal; href: string }) {
  return <a {...props} onClick={(e) => { sendClientGoal(goal); onClick?.(e); }} />;
}

// A goal sent once when a page opens.
export function GoalOnOpen({ goal }: { goal: Goal }) {
  useEffect(() => { sendClientGoal(goal); }, [goal]);
  return null;
}
