"use client";
// The light and dark toggle in the sidebar (decision 0041; the PM app board, bottom of the
// sidebar). The default follows the system setting; a press stores the choice in
// localStorage ("smesay-mode") and flips the html class, which every token reads
// (src/app/globals.css). The script in src/app/layout.tsx applies the stored choice before the
// first paint. The component reads the class through useSyncExternalStore with a
// MutationObserver as the subscription (react.dev/reference/react/useSyncExternalStore), so
// the label follows the class and the server render says "Light" until the client knows.
// A switch role with the mode as its label, so a screen reader hears "Dark mode, on". New to
// the design system: design note 34.
import { useSyncExternalStore } from "react";

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
  const flip = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem(KEY, next ? "dark" : "light"); } catch { /* private mode: the choice lasts this page only */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 text-xs text-ink-muted">
      <span aria-hidden="true">{dark ? "Dark" : "Light"}</span>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Dark mode"
        data-testid="mode-toggle"
        onClick={flip}
        className="relative h-5 w-9 shrink-0 rounded-full border border-transparent bg-hairline-strong transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface aria-checked:bg-violet"
      >
        <span aria-hidden="true" className="absolute top-0.5 left-0.5 block size-4 rounded-full bg-white shadow-sm transition-transform duration-150 in-aria-checked:translate-x-4" />
      </button>
    </div>
  );
}
