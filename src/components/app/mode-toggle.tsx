"use client";
// The light and dark toggle in the sidebar (decision 0041; the PM app board, bottom of the
// sidebar). The default follows the system setting; a press stores the choice in
// localStorage ("smesay-mode") and flips the html class, which every token reads
// (src/app/globals.css). The script in src/app/layout.tsx applies the stored choice before the
// first paint. A press sweeps the new mode in from the top left corner (design note 35).
// The component reads the class through useSyncExternalStore with a
// MutationObserver as the subscription (react.dev/reference/react/useSyncExternalStore), so
// the state follows the class and the server render says off until the client knows.
// A switch named by its visible label "Dark mode" (the label is the accessible name, WCAG
// 2.5.3), 24 px high (WCAG 2.5.8), the off track in ink-muted against the surface (6.60 on
// light, 6.82 on dark) with the thumb in white on light and in the ground on dark (6.60 and
// 7.42 against the track). New to the design system: design note 34.
import { useId, useSyncExternalStore } from "react";

const KEY = "smesay-mode";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const read = () => document.documentElement.classList.contains("dark");
const serverRead = () => false;

export function ModeToggle() {
  const dark = useSyncExternalStore(subscribe, read, serverRead);
  const labelId = useId();
  const flip = () => {
    const next = !dark;
    const apply = () => {
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem(KEY, next ? "dark" : "light"); } catch { /* private mode: the choice lasts this page only */ }
    };
    // The sweep (design note 35): a view transition wipes the new mode in from the top left
    // corner to the bottom right over 1.4 s (src/app/globals.css, mode-sweep). The html class
    // scopes the CSS to this transition. Browsers without startViewTransition and people who
    // asked for reduced motion get the plain switch
    // (developer.mozilla.org/docs/Web/API/Document/startViewTransition).
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof document.startViewTransition !== "function") { apply(); return; }
    root.classList.add("mode-sweep");
    document.startViewTransition(apply).finished.finally(() => root.classList.remove("mode-sweep"));
  };
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 text-xs text-ink-muted">
      <span id={labelId}>Dark mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-labelledby={labelId}
        data-testid="mode-toggle"
        onClick={flip}
        className="relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-ink-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-checked:bg-violet"
      >
        <span aria-hidden="true" className="absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 in-aria-checked:translate-x-5 dark:bg-ground dark:in-aria-checked:bg-ground" />
      </button>
    </div>
  );
}
