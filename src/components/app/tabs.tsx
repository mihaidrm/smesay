"use client";
// Tabs inside a page (design note 123; docs/design-system.md, Components): a row of tabs in
// the segmented control's look (the tint track, the active tab a surface pill) over one
// panel at a time, the others kept in the DOM and hidden. The ARIA tabs pattern
// (w3.org/WAI/ARIA/apg/patterns/tabs/): role tablist, tab and tabpanel, aria-selected and
// aria-controls, one tab stop with the arrow keys, Home and End moving between the tabs,
// and the panel following the focused tab. A count beside a label is mono and part of
// the tab's name ("Follow up 2").
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "cn";

export type TabSpec<K extends string> = { key: K; label: string; count?: number };

export function Tabs<K extends string>({ label, tabs, initial, panels, testId }: { label: string; tabs: TabSpec<K>[]; initial: K; panels: Record<K, ReactNode>; testId?: string }) {
  const [selected, setSelected] = useState<K>(initial);
  const id = useId();
  const refs = useRef(new Map<K, HTMLButtonElement>());
  const pick = (key: K) => { setSelected(key); refs.current.get(key)?.focus(); };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const at = tabs.findIndex((t) => t.key === selected);
    const to = event.key === "ArrowRight" ? (at + 1) % tabs.length : event.key === "ArrowLeft" ? (at - 1 + tabs.length) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (to < 0) return;
    event.preventDefault();
    pick(tabs[to].key);
  };
  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <div role="tablist" aria-label={label} className="inline-flex w-fit max-w-full flex-wrap rounded-full border border-hairline bg-tint p-[3px]">
        {tabs.map((t) => {
          const active = t.key === selected;
          return (
            <button
              key={t.key}
              ref={(el) => { if (el) refs.current.set(t.key, el); else refs.current.delete(t.key); }}
              type="button"
              role="tab"
              id={`${id}-tab-${t.key}`}
              aria-selected={active}
              aria-controls={`${id}-panel-${t.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => pick(t.key)}
              onKeyDown={onKeyDown}
              data-testid={testId ? `${testId}-tab-${t.key}` : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
                active ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="font-mono text-xs">{t.count.toLocaleString("en-GB")}</span>}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" id={`${id}-panel-${t.key}`} aria-labelledby={`${id}-tab-${t.key}`} hidden={t.key !== selected} data-testid={testId ? `${testId}-panel-${t.key}` : undefined} className="flex flex-col gap-4">
          {panels[t.key]}
        </div>
      ))}
    </div>
  );
}
